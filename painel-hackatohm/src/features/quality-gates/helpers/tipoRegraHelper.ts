import type { RegraQualidade, TipoRegra } from '../types/regraQualidade';
import type { ResultadoGateRealtime } from '../types/qualityGate';

interface TipoRegraConfig {
  nome: string;
  descricao: string;
  unidade: string;
  minimo: number;
  maximo?: number;
  requisito: string;
}

export const TIPOS_REGRA: Record<TipoRegra, TipoRegraConfig> = {
  'temperatura.limiar_estatico': {
    nome: 'Limite de temperatura', unidade: '°C', minimo: -55, maximo: 200,
    descricao: 'Compara a temperatura da escova com os limites de aviso e crítico.',
    requisito: 'Avaliada a cada leitura de temperatura.',
  },
  'temperatura.gradiente_termico': {
    nome: 'Velocidade de aquecimento', unidade: '°C/min', minimo: 0,
    descricao: 'Acompanha a velocidade de subida da temperatura, em graus por minuto.',
    requisito: 'Precisa de duas amostras da mesma escova com intervalo positivo.',
  },
  'temperatura.assimetria_escovas': {
    nome: 'Diferença entre escovas', unidade: '°C de diferença', minimo: 0,
    descricao: 'Compara a maior e a menor temperatura das escovas do motor.',
    requisito: 'Precisa de pelo menos duas escovas do mesmo motor enviadas juntas no mesmo lote.',
  },
};

export function tipoRegraSuportado(tipo: string): tipo is TipoRegra {
  return Object.hasOwn(TIPOS_REGRA, tipo);
}

export function obterTipoRegra(tipo: string): TipoRegraConfig | undefined {
  return tipoRegraSuportado(tipo) ? TIPOS_REGRA[tipo] : undefined;
}

export function formatarValorRegra(valor: number | null | undefined, tipo: string): string {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return '--';
  const unidade = obterTipoRegra(tipo)?.unidade;
  const numero = valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  return unidade ? `${numero} ${unidade}` : numero;
}

export function formatarLimitesRegra(regra: Pick<RegraQualidade, 'tipoRegra' | 'parametros'>): string {
  if (!tipoRegraSuportado(regra.tipoRegra)) return 'Tipo não suportado por esta versão do painel.';
  return `Aviso em ${formatarValorRegra(regra.parametros?.aviso, regra.tipoRegra)}, ` +
    `crítico em ${formatarValorRegra(regra.parametros?.critico, regra.tipoRegra)}`;
}

export function obterMetadadosRegra(resultado: ResultadoGateRealtime): { label: string; valor: string }[] {
  const metadados = resultado.metadados;
  if (!metadados) return [];
  const campos = resultado.tipoRegra === 'temperatura.gradiente_termico'
    ? [{ chave: 'temperaturaAnterior', label: 'Temperatura anterior', unidade: '°C' },
      { chave: 'intervaloSegundos', label: 'Intervalo entre amostras', unidade: 's' }]
    : resultado.tipoRegra === 'temperatura.assimetria_escovas'
      ? [{ chave: 'temperaturaMinima', label: 'Menor temperatura', unidade: '°C' },
        { chave: 'temperaturaMaxima', label: 'Maior temperatura', unidade: '°C' }]
      : [];
  return campos.flatMap(({ chave, label, unidade }) => {
    const valor = metadados[chave];
    return typeof valor === 'number' && Number.isFinite(valor)
      ? [{ label, valor: `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${unidade}` }]
      : [];
  });
}
