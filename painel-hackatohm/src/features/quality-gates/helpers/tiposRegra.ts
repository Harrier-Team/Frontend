import { ParametrosRegra, TipoRegra } from '@/features/quality-gates/types/regraQualidade';

export interface TipoRegraInfo {
  /** Identificador do backend; para um tipo desconhecido, o texto recebido. */
  tipo: string;
  /** false = tipo que o painel não conhece (mostrado pelo identificador, só leitura). */
  conhecido: boolean;
  /** Nome amigável, em linguagem de operação. */
  rotulo: string;
  /** Nome técnico do tipo, como subtítulo. */
  subtitulo: string;
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

export const TIPOS_REGRA: Record<TipoRegra, TipoRegraInfo & { tipo: TipoRegra }> = {
  'temperatura.limiar_estatico': {
    tipo: 'temperatura.limiar_estatico',
    conhecido: true,
    rotulo: 'Limite de temperatura',
    subtitulo: 'Limiar estático',
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
    unidade: '°C',
    unidadeLonga: '°C de diferença',
    descricao:
      'Avalia a diferença entre a escova mais quente e a mais fria do motor. Precisa de pelo menos duas escovas no lote.',
    avalia: 'A diferença entre a escova mais quente e a mais fria do motor.',
    aguardaQuando: 'Quando o motor tem uma só escova no lote.',
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
  const numero = (papel === 'limite' ? formatadorLimite : formatadorObservado).format(valor);
  return `${numero} ${TIPOS_REGRA[tipoRegra].unidade}`;
}

/** Texto dos limites de uma regra: "Aviso em 80 °C, crítico em 95 °C". */
export function descreverLimites(tipoRegra: string, parametros: ParametrosRegra): string {
  const aviso = formatarValorGate(tipoRegra, parametros.aviso, 'limite');
  const critico = formatarValorGate(tipoRegra, parametros.critico, 'limite');
  return `Aviso em ${aviso}, crítico em ${critico}`;
}

export const TIPO_GRADIENTE: TipoRegra = 'temperatura.gradiente_termico';
export const TIPO_ASSIMETRIA: TipoRegra = 'temperatura.assimetria_escovas';

/** Faixa aceita, em texto: "de -55 a 200 °C", "0 ou mais °C/min". */
export function descreverFaixa(info: TipoRegraInfo): string {
  if (!info.conhecido) return 'definida pelo servidor';
  if (info.min !== null && info.max !== null) return `de ${info.min} a ${info.max} ${info.unidade}`;
  if (info.min !== null) return `${info.min} ou mais ${info.unidade}`;
  if (info.max !== null) return `até ${info.max} ${info.unidade}`;
  return info.unidade;
}

/**
 * Grupos na ordem do catálogo (estático, gradiente, assimetria); regras por
 * nome. Tipos desconhecidos formam um grupo por identificador, depois dos
 * conhecidos. Grupos vazios saem.
 */
export function agruparRegrasPorTipo<T extends { tipoRegra: string; nome: string }>(
  regras: T[]
): Array<{ info: TipoRegraInfo; regras: T[] }> {
  const porNome = (a: T, b: T) => a.nome.localeCompare(b.nome, 'pt-BR');
  const conhecidos = LISTA_TIPOS_REGRA.map((info) => ({
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
