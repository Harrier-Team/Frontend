import { ParametrosRegra, TipoRegra } from '@/features/quality-gates/types/regraQualidade';
import { formatarMinutos } from '@/utils/tempo';

/** Categoria do backend: o que o alerta comunica (o que vai acontecer, o que está acontecendo). */
export type CategoriaRegra = 'Preditivo' | 'Aceleracao' | 'Condicao';

export const ORDEM_CATEGORIAS: CategoriaRegra[] = ['Preditivo', 'Aceleracao', 'Condicao'];

export const ROTULO_CATEGORIA: Record<CategoriaRegra, string> = {
  Preditivo: 'Preditivo',
  Aceleracao: 'Aceleração',
  Condicao: 'Condição',
};

export function ehCategoriaRegra(valor: unknown): valor is CategoriaRegra {
  return valor === 'Preditivo' || valor === 'Aceleracao' || valor === 'Condicao';
}

export interface TipoRegraInfo {
  /** Identificador do backend; para um tipo desconhecido, o texto recebido. */
  tipo: string;
  /** false = tipo que o painel não conhece (mostrado pelo identificador, só leitura). */
  conhecido: boolean;
  /** Nome amigável, em linguagem de operação. */
  rotulo: string;
  /** Nome técnico do tipo, como subtítulo. */
  subtitulo: string;
  /** Categoria do backend; null em tipo desconhecido. */
  categoria: CategoriaRegra | null;
  /** Unidade curta, usada ao lado de qualquer valor ou limite. */
  unidade: string;
  /** Unidade por extenso, usada nos rótulos dos campos. */
  unidadeLonga: string;
  descricao: string;
  /** Uma linha: o que o tipo avalia. */
  avalia: string;
  /** Uma linha: quando a regra fica "aguardando amostras". */
  aguardaQuando: string;
  /** Faixa aceita para cada limite. `null` = sem limite naquele lado. */
  min: number | null;
  max: number | null;
}

export const TIPO_LIMIAR_ESTATICO: TipoRegra = 'temperatura.limiar_estatico';
export const TIPO_PREVISAO: TipoRegra = 'temperatura.previsao_tendencia';

/** Previsão por tendência: aviso e crítico são minutos de antecedência e a ordem é invertida. */
export function ehPrevisao(tipo: string | null | undefined): boolean {
  return tipo === TIPO_PREVISAO;
}

export const TIPOS_REGRA: Record<TipoRegra, TipoRegraInfo & { tipo: TipoRegra }> = {
  'temperatura.limiar_estatico': {
    tipo: 'temperatura.limiar_estatico',
    conhecido: true,
    rotulo: 'Limite de temperatura',
    subtitulo: 'Limiar estático',
    categoria: 'Condicao',
    unidade: '°C',
    unidadeLonga: '°C',
    descricao: 'Avalia a temperatura atual de cada escova contra os limites.',
    avalia: 'A temperatura de cada escova, a cada lote.',
    aguardaQuando: 'Quase nunca: basta uma leitura válida.',
    min: -55,
    max: 200,
  },
  'temperatura.gradiente_termico': {
    tipo: 'temperatura.gradiente_termico',
    conhecido: true,
    rotulo: 'Velocidade de aquecimento',
    subtitulo: 'Gradiente térmico',
    categoria: 'Aceleracao',
    unidade: '°C/min',
    unidadeLonga: '°C/min',
    descricao:
      'Avalia a velocidade de subida da temperatura. Precisa de duas leituras da escova para ser calculado.',
    avalia: 'Quão rápido cada escova esquenta, entre dois lotes seguidos.',
    aguardaQuando: 'No primeiro lote, quando ainda não há leitura anterior.',
    min: 0,
    max: null,
  },
  'temperatura.assimetria_escovas': {
    tipo: 'temperatura.assimetria_escovas',
    conhecido: true,
    rotulo: 'Diferença entre escovas',
    subtitulo: 'Assimetria entre escovas',
    categoria: 'Condicao',
    unidade: '°C',
    unidadeLonga: '°C de diferença',
    descricao:
      'Avalia a diferença entre a escova mais quente e a mais fria do motor. Precisa de pelo menos duas escovas no lote.',
    avalia: 'A diferença entre a escova mais quente e a mais fria do motor.',
    aguardaQuando: 'Quando o motor tem uma só escova no lote.',
    min: 0,
    max: null,
  },
  'temperatura.previsao_tendencia': {
    tipo: 'temperatura.previsao_tendencia',
    conhecido: true,
    rotulo: 'Tempo até o limite',
    subtitulo: 'Previsão por tendência',
    categoria: 'Preditivo',
    unidade: 'min',
    unidadeLonga: 'min',
    descricao: 'Estima, pela tendência das últimas leituras, quando a escova atinge a temperatura limite.',
    avalia: 'Em quantos minutos cada escova atinge a temperatura limite, se a tendência se mantiver.',
    aguardaQuando: 'Nas primeiras 5 leituras de cada escova.',
    // Os limites são minutos de antecedência, maiores que zero; a ordem é invertida (aviso > crítico).
    min: 0,
    max: null,
  },
};

export const LISTA_TIPOS_REGRA = Object.values(TIPOS_REGRA) as Array<TipoRegraInfo & { tipo: TipoRegra }>;

export function ehTipoRegra(valor: unknown): valor is TipoRegra {
  return typeof valor === 'string' && valor in TIPOS_REGRA;
}

/**
 * Catálogo do tipo. Tipo desconhecido não herda nada de outro tipo: aparece
 * pelo identificador, sem unidade, e o painel não o edita nem o alterna.
 */
export function obterTipoRegra(tipo: string | null | undefined): TipoRegraInfo {
  if (ehTipoRegra(tipo)) return TIPOS_REGRA[tipo];
  const id = (tipo ?? '').trim();
  return {
    tipo: id,
    conhecido: false,
    rotulo: id || 'Tipo não informado',
    subtitulo: 'Tipo não reconhecido pelo painel',
    categoria: null,
    unidade: '',
    unidadeLonga: '',
    descricao: 'O painel não conhece este tipo de regra, então só mostra o que o servidor enviou.',
    avalia: 'Avaliação definida pelo servidor.',
    aguardaQuando: 'Definido pelo servidor.',
    min: null,
    max: null,
  };
}

/** O painel sabe interpretar, editar e alternar regras deste tipo. */
export function ehRegraEditavel(regra: { tipoRegra: string }): boolean {
  return ehTipoRegra(regra.tipoRegra);
}

const formatadorObservado = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
// Limites são configurados pelo usuário: mantêm as casas que ele digitou (até 2) e dispensam ",0".
const formatadorLimite = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** `observado` é medido (sempre uma casa decimal); `limite` é configurado (sem ",0" sobrando). */
export type PapelDoValor = 'observado' | 'limite';

/**
 * Valor observado ou limite com a unidade do tipo da regra
 * (96,1 °C, 6,2 °C/min, 25,2 °C). Tipo desconhecido: só o número.
 */
export function formatarValorGate(
  tipoRegra: string | null | undefined,
  valor: number | null | undefined,
  papel: PapelDoValor = 'observado'
): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—';
  // Tipo desconhecido: sem unidade nem precisão inventadas.
  if (!ehTipoRegra(tipoRegra)) return formatadorLimite.format(valor);
  // Previsão: o observado é uma estimativa em minutos ("~8 min"); o limite é o horizonte ("10 min").
  if (ehPrevisao(tipoRegra)) {
    return papel === 'limite' ? `${formatadorLimite.format(valor)} min` : formatarMinutos(valor);
  }
  const numero = (papel === 'limite' ? formatadorLimite : formatadorObservado).format(valor);
  return `${numero} ${TIPOS_REGRA[tipoRegra].unidade}`;
}

/**
 * Valor e limite lado a lado. Nos tipos de temperatura é `96,1 °C ≥ 95 °C`; na
 * previsão o horizonte não é um teto a superar, então vira `~8 min · horizonte 10 min`.
 */
export function formatarValorELimite(
  tipoRegra: string | null | undefined,
  observado: number | null | undefined,
  limite: number | null | undefined
): string {
  const valor = formatarValorGate(tipoRegra, observado);
  const teto = formatarValorGate(tipoRegra, limite, 'limite');
  return ehPrevisao(tipoRegra) ? `${valor} · horizonte ${teto}` : `${valor} ≥ ${teto}`;
}

/** Texto dos limites de uma regra: "Aviso em 80 °C, crítico em 95 °C". */
export function descreverLimites(tipoRegra: string, parametros: ParametrosRegra): string {
  if (ehPrevisao(tipoRegra)) return descreverAntecedencia(parametros);
  const aviso = formatarValorGate(tipoRegra, parametros.aviso, 'limite');
  const critico = formatarValorGate(tipoRegra, parametros.critico, 'limite');
  return `Aviso em ${aviso}, crítico em ${critico}`;
}

/** "Avisa 30 min antes de 95 °C; crítico 10 min antes" (a janela só aparece se foi definida). */
export function descreverAntecedencia(parametros: ParametrosRegra): string {
  const min = (v: number) => `${formatadorLimite.format(v)} min`;
  const limite =
    typeof parametros.temperaturaLimite === 'number' && Number.isFinite(parametros.temperaturaLimite)
      ? `${formatadorLimite.format(parametros.temperaturaLimite)} °C`
      : 'o limite';
  return `Avisa ${min(parametros.aviso)} antes de ${limite}; crítico ${min(parametros.critico)} antes`;
}

export const TIPO_GRADIENTE: TipoRegra = 'temperatura.gradiente_termico';
export const TIPO_ASSIMETRIA: TipoRegra = 'temperatura.assimetria_escovas';

/** Faixa aceita, em texto: "de -55 a 200 °C", "0 ou mais °C/min". */
export function descreverFaixa(info: TipoRegraInfo): string {
  if (!info.conhecido) return 'definida pelo servidor';
  if (info.tipo === TIPO_PREVISAO) return 'em minutos, maiores que zero';
  if (info.min !== null && info.max !== null) return `de ${info.min} a ${info.max} ${info.unidade}`;
  if (info.min !== null) return `${info.min} ou mais ${info.unidade}`;
  if (info.max !== null) return `até ${info.max} ${info.unidade}`;
  return info.unidade;
}

/** Tipos conhecidos na ordem das categorias (Preditivo, Aceleração, Condição) e, dentro delas, a do catálogo. */
export const TIPOS_POR_CATEGORIA: Array<TipoRegraInfo & { tipo: TipoRegra }> = ORDEM_CATEGORIAS.flatMap((categoria) =>
  LISTA_TIPOS_REGRA.filter((info) => info.categoria === categoria)
);

/** Tipos agrupados pela categoria do backend, para o seletor do formulário. */
export function agruparTiposPorCategoria(): Array<{
  categoria: CategoriaRegra;
  rotulo: string;
  tipos: Array<TipoRegraInfo & { tipo: TipoRegra }>;
}> {
  return ORDEM_CATEGORIAS.map((categoria) => ({
    categoria,
    rotulo: ROTULO_CATEGORIA[categoria],
    tipos: LISTA_TIPOS_REGRA.filter((info) => info.categoria === categoria),
  })).filter((grupo) => grupo.tipos.length > 0);
}

/**
 * Grupos por tipo na ordem das categorias (preditivo, aceleração, condição);
 * regras por nome. Tipos desconhecidos formam um grupo por identificador,
 * depois dos conhecidos. Grupos vazios saem.
 */
export function agruparRegrasPorTipo<T extends { tipoRegra: string; nome: string }>(
  regras: T[]
): Array<{ info: TipoRegraInfo; regras: T[] }> {
  const porNome = (a: T, b: T) => a.nome.localeCompare(b.nome, 'pt-BR');
  const conhecidos = TIPOS_POR_CATEGORIA.map((info) => ({
    info,
    regras: regras.filter((r) => r.tipoRegra === info.tipo).sort(porNome),
  }));
  const desconhecidos = [...new Set(regras.filter((r) => !ehTipoRegra(r.tipoRegra)).map((r) => r.tipoRegra))]
    .sort((a, b) => a.localeCompare(b))
    .map((tipo) => ({
      info: obterTipoRegra(tipo),
      regras: regras.filter((r) => r.tipoRegra === tipo).sort(porNome),
    }));
  return [...conhecidos, ...desconhecidos].filter((grupo) => grupo.regras.length > 0);
}

/**
 * Nome da regra para exibir ao lado do tipo: some quando só repete o tipo
 * (pelo rótulo amigável ou pelo nome técnico), para a tela não dizer a mesma
 * coisa duas vezes.
 */
export function nomeRegraDistinto(nomeRegra: string | null | undefined, info: TipoRegraInfo): string | null {
  const nome = (nomeRegra ?? '').trim();
  if (!nome) return null;
  const norma = (t: string) => t.trim().toLowerCase();
  return [info.rotulo, info.subtitulo, info.tipo].some((t) => norma(t) === norma(nome)) ? null : nome;
}
