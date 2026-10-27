import type {
  CodigoSeveridade,
  NivelSeveridade,
  ResultadoGateRecebido,
  ResultadoGateRealtime,
  SeveridadeGate,
} from '@/features/quality-gates/types/qualityGate';

const SEVERIDADE_POR_CODIGO: Record<CodigoSeveridade, NivelSeveridade> = {
  0: 'Normal',
  1: 'Atencao',
  2: 'AlertaPreditivo',
  3: 'Critico',
};

// Codigos estruturados emitidos pelas estrategias atuais do backend.
// Servem tambem quando uma leitura em memoria ainda usa um formato antigo.
const SEVERIDADE_POR_REGRA: Record<string, NivelSeveridade> = {
  OK: 'Normal',
  TEMP_CRITICA: 'Critico',
  GRADIENTE_TERMICO_CRITICO: 'Critico',
  ASSIMETRIA_ESCOVAS_CRITICA: 'Critico',
  TEMP_ALERTA_PREDITIVO: 'AlertaPreditivo',
  GRADIENTE_TERMICO_ALERTA: 'AlertaPreditivo',
  ASSIMETRIA_ESCOVAS_ALERTA: 'AlertaPreditivo',
};

export function normalizarSeveridade(valor: unknown): SeveridadeGate {
  if (typeof valor === 'number' && Object.hasOwn(SEVERIDADE_POR_CODIGO, valor)) {
    return SEVERIDADE_POR_CODIGO[valor as CodigoSeveridade];
  }
  if (typeof valor !== 'string') return 'Indisponivel';
  const chave = valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]/g, '').toLowerCase();
  switch (chave) {
    case '0': case 'normal': return 'Normal';
    case '1': case 'atencao': return 'Atencao';
    case '2': case 'alertapreditivo': return 'AlertaPreditivo';
    case '3': case 'critico': return 'Critico';
    case 'dadosinsuficientes': return 'DadosInsuficientes';
    default: return 'Indisponivel';
  }
}

export function obterSeveridadeGate(
  resultado: { severidade?: unknown; codigoRegra?: string; metadados?: Record<string, unknown> | null }
): SeveridadeGate {
  if (resultado.codigoRegra === 'DADOS_INSUFICIENTES' || resultado.metadados?.avaliacaoConcluida === false) {
    return 'DadosInsuficientes';
  }
  const severidade = normalizarSeveridade(resultado.severidade);
  const codigo = resultado.codigoRegra;
  const peloCodigo = codigo && Object.hasOwn(SEVERIDADE_POR_REGRA, codigo)
    ? SEVERIDADE_POR_REGRA[codigo] : undefined;
  // Um codigo explicito de criticidade nao pode ser ocultado por um nivel
  // ausente ou menos grave. Nao inferimos severidade pelo texto do diagnostico.
  return peloCodigo && SEVERIDADE_THEME[peloCodigo].prioridade > SEVERIDADE_THEME[severidade].prioridade
    ? peloCodigo : severidade;
}

export function normalizarResultadosQualityGates(
  resultados?: ResultadoGateRecebido[] | null
): ResultadoGateRealtime[] {
  if (!Array.isArray(resultados)) return [];
  return resultados.map((resultado) => ({
    ...resultado,
    severidade: obterSeveridadeGate(resultado),
  }));
}

export const SEVERIDADE_THEME: Record<
  SeveridadeGate,
  { label: string; color: string; textClass: string; prioridade: number }
> = {
  Normal: { label: 'Normal', color: 'var(--color-ok)', textClass: 'text-ok', prioridade: 0 },
  Atencao: { label: 'Atenção', color: 'var(--color-warn)', textClass: 'text-warn', prioridade: 1 },
  AlertaPreditivo: { label: 'Alerta preditivo', color: 'var(--color-warn)', textClass: 'text-warn', prioridade: 2 },
  Critico: { label: 'Crítico', color: 'var(--color-hot)', textClass: 'text-hot', prioridade: 3 },
  Indisponivel: { label: 'Sem classificação', color: 'var(--color-ink-3)', textClass: 'text-ink-3', prioridade: -1 },
  DadosInsuficientes: { label: 'Dados insuficientes', color: 'var(--color-ink-3)', textClass: 'text-ink-3', prioridade: -1 },
};

export function formatarSeveridade(severidade: unknown): string {
  return SEVERIDADE_THEME[normalizarSeveridade(severidade)].label;
}
