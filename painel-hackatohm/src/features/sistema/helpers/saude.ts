/**
 * Saúde do backend (`/health/live`, `/health/ready`). O ASP.NET responde por
 * padrão com texto puro ("Healthy", "Degraded", "Unhealthy"), mas um escritor
 * JSON também é comum; aceitamos os dois e nunca presumimos o formato.
 */

export type EstadoSaude = 'saudavel' | 'degradado' | 'indisponivel';

export interface ItemSaude {
  nome: string;
  estado: EstadoSaude;
  descricao: string | null;
}

export interface ResultadoSaude {
  estado: EstadoSaude;
  /** null = a API nem respondeu (rede). */
  httpStatus: number | null;
  itens: ItemSaude[];
  /** Texto cru, curto, para o detalhe técnico. */
  bruto: string | null;
}

/** Enum numérico do .NET: 0 Unhealthy, 1 Degraded, 2 Healthy. */
function interpretarEstado(valor: unknown): EstadoSaude | null {
  if (typeof valor === 'number') return ['indisponivel', 'degradado', 'saudavel'][valor] as EstadoSaude | undefined ?? null;
  if (typeof valor !== 'string') return null;
  const texto = valor.trim().toLowerCase();
  if (texto === 'healthy' || texto === 'saudavel' || texto === 'ok') return 'saudavel';
  if (texto === 'degraded') return 'degradado';
  if (texto === 'unhealthy') return 'indisponivel';
  return null;
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/** Pega a propriedade ignorando maiúsculas (status / Status). */
function propriedade(objeto: Record<string, unknown>, nome: string): unknown {
  const chave = Object.keys(objeto).find((k) => k.toLowerCase() === nome);
  return chave === undefined ? undefined : objeto[chave];
}

function lerItens(entradas: unknown): ItemSaude[] {
  const lista: Array<[string, unknown]> = Array.isArray(entradas)
    ? entradas.map((e, i): [string, unknown] => [
        ehObjeto(e) && typeof (propriedade(e, 'name') ?? propriedade(e, 'key')) === 'string'
          ? String(propriedade(e, 'name') ?? propriedade(e, 'key'))
          : `item ${i + 1}`,
        e,
      ])
    : ehObjeto(entradas)
      ? Object.entries(entradas)
      : [];
  const itens: ItemSaude[] = [];
  for (const [nome, dado] of lista) {
    if (!ehObjeto(dado)) continue;
    const estado = interpretarEstado(propriedade(dado, 'status'));
    if (!estado) continue;
    const descricao = propriedade(dado, 'description');
    itens.push({ nome, estado, descricao: typeof descricao === 'string' && descricao ? descricao : null });
  }
  return itens;
}

function resumirBruto(corpo: unknown): string | null {
  if (corpo === null || corpo === undefined || corpo === '') return null;
  const texto = typeof corpo === 'string' ? corpo : JSON.stringify(corpo);
  return texto.length > 400 ? `${texto.slice(0, 400)}…` : texto;
}

/**
 * Converte a resposta em estado. `httpStatus` null é falha de rede. O corpo
 * pode ser texto, JSON ou vazio; sem corpo legível vale o código HTTP
 * (2xx saudável, o resto indisponível).
 */
export function mapearSaude(httpStatus: number | null, corpo: unknown): ResultadoSaude {
  const bruto = resumirBruto(corpo);
  if (httpStatus === null) return { estado: 'indisponivel', httpStatus, itens: [], bruto };

  let estado: EstadoSaude | null = null;
  let itens: ItemSaude[] = [];

  if (ehObjeto(corpo)) {
    estado = interpretarEstado(propriedade(corpo, 'status'));
    itens = lerItens(propriedade(corpo, 'entries') ?? propriedade(corpo, 'checks'));
  } else if (typeof corpo === 'string') {
    estado = interpretarEstado(corpo);
  }

  const porHttp: EstadoSaude = httpStatus >= 200 && httpStatus < 300 ? 'saudavel' : 'indisponivel';
  // Código HTTP de falha prevalece sobre um corpo que diga o contrário.
  const final = estado === null || (porHttp === 'indisponivel' && estado !== 'indisponivel') ? porHttp : estado;
  return { estado: final, httpStatus, itens, bruto };
}

/** Estado de um item pelo nome (ex.: "postgresql"), se o corpo detalhar. */
export function itemDeSaude(resultado: ResultadoSaude | null, trecho: string): ItemSaude | null {
  return resultado?.itens.find((i) => i.nome.toLowerCase().includes(trecho)) ?? null;
}

/* ---------- Cadência ---------- */

export function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 === 1 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

/**
 * Cadência medida: mediana, em segundos, dos intervalos entre lotes seguidos.
 * Recebe os instantes (ms) de cada escova; só intervalos positivos contam e a
 * mediana ignora lacunas de silêncio.
 */
export function cadenciaMedianaSegundos(instantesPorSerie: number[][]): number | null {
  const intervalos: number[] = [];
  for (const instantes of instantesPorSerie) {
    const ordenados = [...instantes].sort((a, b) => a - b);
    for (let i = 1; i < ordenados.length; i += 1) {
      const dt = (ordenados[i] - ordenados[i - 1]) / 1000;
      if (dt > 0) intervalos.push(dt);
    }
  }
  return mediana(intervalos);
}
