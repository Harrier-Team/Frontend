import { NivelSeveridade } from '@/features/quality-gates/types/qualityGate';
import { formatarValorGate, obterTipoRegra } from '@/features/quality-gates/helpers/tiposRegra';
import { MotivoStatus } from '@/features/telemetria/types/telemetria';
import { MotorTelemetria, SerieEscova } from '@/features/telemetria/store/tipos';
import { EstadoPrincipal, estadoResultado, RANK_SEVERIDADE } from './estadoHelper';
import { montarLotes } from './grafico';

/** Filtros da visão geral: severidade e, à parte, os estados sem severidade. */
export type FiltroMotor =
  | 'todos'
  | 'Critico'
  | 'AlertaPreditivo'
  | 'Atencao'
  | 'Normal'
  | 'sem-dados'
  | 'sem-avaliacao';

export const ROTULO_FILTRO: Record<FiltroMotor, string> = {
  todos: 'Todos',
  Critico: 'Crítico',
  AlertaPreditivo: 'Alerta preditivo',
  Atencao: 'Atenção',
  Normal: 'Normal',
  'sem-dados': 'Sem dados',
  'sem-avaliacao': 'Sem avaliação',
};

/** Ordem de exibição dos filtros (após "Todos"). */
export const ORDEM_FILTROS: FiltroMotor[] = [
  'Critico',
  'AlertaPreditivo',
  'Atencao',
  'sem-dados',
  'sem-avaliacao',
  'Normal',
];

export function filtroDoEstado(principal: EstadoPrincipal): Exclude<FiltroMotor, 'todos'> {
  switch (principal) {
    case 'Critico':
    case 'AlertaPreditivo':
    case 'Atencao':
    case 'Normal':
      return principal;
    case 'offline':
    case 'degradado':
    case 'sem-leitura':
      return 'sem-dados';
    default:
      return 'sem-avaliacao';
  }
}

export function contarPorFiltro(estados: EstadoPrincipal[]): Record<FiltroMotor, number> {
  const contagem: Record<FiltroMotor, number> = {
    todos: estados.length,
    Critico: 0,
    AlertaPreditivo: 0,
    Atencao: 0,
    Normal: 0,
    'sem-dados': 0,
    'sem-avaliacao': 0,
  };
  for (const estado of estados) contagem[filtroDoEstado(estado)] += 1;
  return contagem;
}

/**
 * Maior temperatura entre as escovas a cada lote (os últimos `maximo`), para a
 * sparkline da linha do motor.
 */
export function serieDaMaiorTemperatura(
  escovas: Record<number, SerieEscova> | undefined,
  maximo = 40
): number[] {
  const series = Object.entries(escovas ?? {}).map(([numero, serie]) => ({
    numeroEscova: Number(numero),
    pontos: serie.pontos,
  }));
  return montarLotes(series)
    .slice(-maximo)
    .map((lote) => Math.max(...Object.values(lote.valores).map((x) => x.v)));
}

/** ΔT entre a escova mais quente e a mais fria das últimas leituras; null com menos de duas. */
export function deltaTDasUltimas(escovas: Record<number, SerieEscova> | undefined): number | null {
  const valores = Object.values(escovas ?? {})
    .map((s) => s.ultima?.valorCelsius)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  return valores.length >= 2 ? Math.max(...valores) - Math.min(...valores) : null;
}

/**
 * Motivo do estado do motor. Vem do status agregado do backend; sem ele, usa
 * o gate de maior severidade das últimas leituras (nunca recalcula severidade).
 */
export function motivoDoMotor(
  telemetria: MotorTelemetria | undefined,
  motivoDoStatus: MotivoStatus | null
): MotivoStatus | null {
  if (motivoDoStatus) return motivoDoStatus;
  let melhor: { numeroEscova: number; rank: number; motivo: MotivoStatus } | null = null;
  for (const serie of Object.values(telemetria?.escovas ?? {})) {
    const leitura = serie.ultima;
    if (!leitura) continue;
    for (const gate of leitura.resultadosQualityGates) {
      if (estadoResultado(gate) !== 'avaliado' || gate.severidade === 'Normal') continue;
      const rank = RANK_SEVERIDADE[gate.severidade as NivelSeveridade];
      if (!melhor || rank > melhor.rank) {
        melhor = {
          numeroEscova: leitura.numeroEscova,
          rank,
          motivo: {
            numeroEscova: leitura.numeroEscova,
            nomeRegra: gate.nomeRegra,
            tipoRegra: gate.tipoRegra,
            codigoRegra: gate.codigoRegra,
            valorObservado: gate.valorObservado,
            valorLimite: gate.valorLimite,
            mensagemDiagnostico: gate.mensagemDiagnostico,
          },
        };
      }
    }
  }
  return melhor?.motivo ?? null;
}

/**
 * "Escova 2 de Motor A: Limiar estático, 96,1 °C ≥ 95 °C" (o quê, onde, quanto).
 * A assimetria é do motor: não aponta uma escova.
 */
export function descreverMotivo(motivo: MotivoStatus, nomeMotor: string): string {
  const tipo = obterTipoRegra(motivo.tipoRegra);
  const onde =
    motivo.tipoRegra === 'temperatura.assimetria_escovas'
      ? nomeMotor
      : `escova ${motivo.numeroEscova} de ${nomeMotor}`;
  const valores =
    motivo.valorObservado !== null && motivo.valorLimite !== null
      ? `, ${formatarValorGate(motivo.tipoRegra, motivo.valorObservado)} ≥ ${formatarValorGate(motivo.tipoRegra, motivo.valorLimite)}`
      : '';
  const frase = `${onde}: ${tipo.rotulo.toLowerCase()}${valores}`;
  return frase.charAt(0).toUpperCase() + frase.slice(1);
}

/** "Limiar estático na escova 2" / "Assimetria entre escovas": curto, para a linha do motor. */
export function rotuloCurtoDoMotivo(motivo: MotivoStatus): string {
  const tipo = obterTipoRegra(motivo.tipoRegra).rotulo;
  return motivo.tipoRegra === 'temperatura.assimetria_escovas'
    ? tipo
    : `${tipo} na escova ${motivo.numeroEscova}`;
}
