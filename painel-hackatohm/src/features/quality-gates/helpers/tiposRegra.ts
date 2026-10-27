import { ParametrosRegra, TipoRegra } from '@/features/quality-gates/types/regraQualidade';

export interface TipoRegraInfo {
  tipo: TipoRegra;
  rotulo: string;
  /** Unidade curta, usada ao lado de qualquer valor ou limite. */
  unidade: string;
  /** Unidade por extenso, usada nos rótulos dos campos. */
  unidadeLonga: string;
  descricao: string;
  /** Faixa aceita para cada limite. `null` = sem limite naquele lado. */
  min: number | null;
  max: number | null;
  /** Limites sugeridos ao criar uma regra do tipo. */
  padrao: ParametrosRegra;
}

export const TIPO_LIMIAR_ESTATICO: TipoRegra = 'temperatura.limiar_estatico';

export const TIPOS_REGRA: Record<TipoRegra, TipoRegraInfo> = {
  'temperatura.limiar_estatico': {
    tipo: 'temperatura.limiar_estatico',
    rotulo: 'Limiar estático',
    unidade: '°C',
    unidadeLonga: '°C',
    descricao: 'Avalia a temperatura atual de cada escova contra os limites.',
    min: -55,
    max: 200,
    padrao: { aviso: 80, critico: 95 },
  },
  'temperatura.gradiente_termico': {
    tipo: 'temperatura.gradiente_termico',
    rotulo: 'Gradiente térmico',
    unidade: '°C/min',
    unidadeLonga: '°C/min',
    descricao:
      'Avalia a velocidade de subida da temperatura. Precisa de duas leituras da escova para ser calculado.',
    min: 0,
    max: null,
    padrao: { aviso: 5, critico: 10 },
  },
  'temperatura.assimetria_escovas': {
    tipo: 'temperatura.assimetria_escovas',
    rotulo: 'Assimetria entre escovas',
    unidade: '°C',
    unidadeLonga: '°C de diferença',
    descricao:
      'Avalia a diferença entre a escova mais quente e a mais fria do motor. Precisa de pelo menos duas escovas no lote.',
    min: 0,
    max: null,
    padrao: { aviso: 10, critico: 15 },
  },
};

export const LISTA_TIPOS_REGRA: TipoRegraInfo[] = Object.values(TIPOS_REGRA);

export function ehTipoRegra(valor: unknown): valor is TipoRegra {
  return typeof valor === 'string' && valor in TIPOS_REGRA;
}

/** Catálogo do tipo; tipo desconhecido cai no limiar estático, como o backend faz ao omitir. */
export function obterTipoRegra(tipo: string | null | undefined): TipoRegraInfo {
  return ehTipoRegra(tipo) ? TIPOS_REGRA[tipo] : TIPOS_REGRA[TIPO_LIMIAR_ESTATICO];
}

const formatadorNumero = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Valor observado ou limite com a unidade do tipo da regra
 * (96,1 °C, 6,2 °C/min, 25,2 °C). Tipo desconhecido: só o número.
 */
export function formatarValorGate(
  tipoRegra: string | null | undefined,
  valor: number | null | undefined
): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—';
  const numero = formatadorNumero.format(valor);
  return ehTipoRegra(tipoRegra) ? `${numero} ${TIPOS_REGRA[tipoRegra].unidade}` : numero;
}

/** Texto dos limites de uma regra: "Aviso em 80 °C, crítico em 95 °C". */
export function descreverLimites(tipoRegra: string, parametros: ParametrosRegra): string {
  const aviso = formatarValorGate(tipoRegra, parametros.aviso);
  const critico = formatarValorGate(tipoRegra, parametros.critico);
  return `Aviso em ${aviso}, crítico em ${critico}`;
}
