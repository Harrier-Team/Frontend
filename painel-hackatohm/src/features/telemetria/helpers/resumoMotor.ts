import { NivelSeveridade } from '@/features/quality-gates/types/qualityGate';
import { MotivoStatus, SituacaoMotor } from '@/features/telemetria/types/telemetria';
import { MotorTelemetria, SerieEscova } from '@/features/telemetria/store/tipos';
import {
  consolidarSeveridade,
  EstadoAvaliacao,
  EstadoDado,
  estadoAvaliacao,
  estadoDado,
  EstadoPrincipal,
  estadoPrincipal,
  maiorSeveridade,
} from './estadoHelper';

export interface ResumoMotor {
  /** Severidade do backend; null enquanto não há avaliação concluída. */
  severidade: NivelSeveridade | null;
  avaliacao: EstadoAvaliacao;
  dado: EstadoDado;
  principal: EstadoPrincipal;
  situacao: SituacaoMotor | null;
  motivo: MotivoStatus | null;
  ultimoLoteEm: string | null;
  temperaturaMaxima: number | null;
}

export interface ResumoEscova {
  severidade: NivelSeveridade | null;
  avaliacao: EstadoAvaliacao;
}

export function resumirEscova(serie: SerieEscova | undefined): ResumoEscova {
  const ultima = serie?.ultima ?? null;
  const gates = ultima?.resultadosQualityGates ?? [];
  const avaliacao = estadoAvaliacao(gates, ultima !== null);
  return {
    severidade: avaliacao === 'avaliada' ? consolidarSeveridade(gates) : null,
    avaliacao,
  };
}

/**
 * Consolida o motor a partir do store.
 *  - Severidade: `severidadeGeral` do status agregado. O máximo local só vale
 *    enquanto o status ainda não chegou ou é mais antigo que o último lote.
 *  - Um `Normal` sem avaliação concluída (aguardando amostras, sem regras,
 *    sem leitura) não é normalidade e vira null.
 *  - `situacao` só vale se o status não for mais antigo que o último lote.
 */
export function resumirMotor(telemetria: MotorTelemetria | undefined, agora: number): ResumoMotor {
  if (!telemetria) {
    return {
      severidade: null,
      avaliacao: 'sem-leitura',
      dado: 'sem-leitura',
      principal: 'sem-leitura',
      situacao: null,
      motivo: null,
      ultimoLoteEm: null,
      temperaturaMaxima: null,
    };
  }

  const leituras = Object.values(telemetria.escovas)
    .map((serie) => serie.ultima)
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const avaliacao = estadoAvaliacao(
    leituras.flatMap((l) => l.resultadosQualityGates),
    leituras.length > 0
  );

  const ultimoLoteMs = telemetria.ultimoLoteEm ? Date.parse(telemetria.ultimoLoteEm) : null;
  const statusAtual =
    telemetria.status !== null &&
    (ultimoLoteMs === null ||
      (telemetria.statusVersao !== null && telemetria.statusVersao >= ultimoLoteMs));

  const base: NivelSeveridade | null = statusAtual
    ? telemetria.status!.severidadeGeral
    : maiorSeveridade(leituras.map((l) => consolidarSeveridade(l.resultadosQualityGates)));

  const severidade = base === 'Normal' && avaliacao !== 'avaliada' ? null : base;
  const situacao = statusAtual ? telemetria.status!.situacao : null;
  const dado = estadoDado(telemetria.ultimoLoteEm, situacao, agora);
  const temperaturas = leituras.map((l) => l.valorCelsius);

  return {
    severidade,
    avaliacao,
    dado,
    principal: estadoPrincipal(severidade, avaliacao, dado),
    situacao,
    motivo: statusAtual ? telemetria.status!.motivo : null,
    ultimoLoteEm: telemetria.ultimoLoteEm,
    temperaturaMaxima: temperaturas.length > 0 ? Math.max(...temperaturas) : null,
  };
}
