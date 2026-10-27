import {
  NivelSeveridade,
  ResultadoGateRealtime,
} from '@/features/quality-gates/types/qualityGate';
import {
  EscovaStatusDto,
  LeituraEscova,
  MotorStatusDto,
  SituacaoMotor,
  TelemetriaRealtimeDto,
} from '@/features/telemetria/types/telemetria';

const SEVERIDADES: NivelSeveridade[] = ['Normal', 'Atencao', 'AlertaPreditivo', 'Critico'];

/**
 * A severidade chega como string. Tolera os números 0 a 3 de versões
 * anteriores do servidor. Valor desconhecido vira Normal.
 */
export function normalizarSeveridade(valor: unknown): NivelSeveridade {
  if (typeof valor === 'number') return SEVERIDADES[valor] ?? 'Normal';
  if (typeof valor === 'string') {
    const encontrada = SEVERIDADES.find((s) => s.toLowerCase() === valor.toLowerCase());
    if (encontrada) return encontrada;
  }
  return 'Normal';
}

export function normalizarGate(bruto: Partial<ResultadoGateRealtime>): ResultadoGateRealtime {
  return {
    regraQualidadeId: bruto.regraQualidadeId ?? '',
    nomeRegra: bruto.nomeRegra ?? '',
    disparouAlerta: Boolean(bruto.disparouAlerta),
    severidade: normalizarSeveridade(bruto.severidade),
    tipoRegra: bruto.tipoRegra ?? '',
    codigoRegra: bruto.codigoRegra ?? '',
    mensagemDiagnostico: bruto.mensagemDiagnostico ?? null,
    valorObservado: bruto.valorObservado ?? null,
    valorLimite: bruto.valorLimite ?? null,
    metadados: bruto.metadados ?? null,
  };
}

export function normalizarGates(
  brutos: Partial<ResultadoGateRealtime>[] | null | undefined
): ResultadoGateRealtime[] {
  return Array.isArray(brutos) ? brutos.map(normalizarGate) : [];
}

export function normalizarLeituraRealtime(dto: TelemetriaRealtimeDto): LeituraEscova {
  return {
    motorId: dto.motorId ?? null,
    sensorId: dto.sensorId,
    espMacAddress: dto.espMacAddress,
    numeroEscova: dto.numeroEscova,
    valorCelsius: dto.valorCelsius,
    dataHora: dto.dataHora,
    alertaDesgaste: Boolean(dto.alertaDesgaste),
    resultadosQualityGates: normalizarGates(dto.resultadosQualityGates),
  };
}

function normalizarSituacao(valor: unknown): SituacaoMotor {
  return valor === 'Online' || valor === 'Degradado' || valor === 'Offline' ? valor : 'Offline';
}

export function normalizarStatus(bruto: MotorStatusDto): MotorStatusDto {
  const escovas: EscovaStatusDto[] = (bruto.escovas ?? []).map((escova) => ({
    ...escova,
    severidade: normalizarSeveridade(escova.severidade),
    alertaDesgaste: Boolean(escova.alertaDesgaste),
    resultadosQualityGates: normalizarGates(escova.resultadosQualityGates),
  }));

  return {
    motorId: bruto.motorId,
    severidadeGeral: normalizarSeveridade(bruto.severidadeGeral),
    situacao: normalizarSituacao(bruto.situacao),
    contagem: {
      normal: bruto.contagem?.normal ?? 0,
      atencao: bruto.contagem?.atencao ?? 0,
      alertaPreditivo: bruto.contagem?.alertaPreditivo ?? 0,
      critico: bruto.contagem?.critico ?? 0,
    },
    motivo: bruto.motivo
      ? {
          ...bruto.motivo,
          valorObservado: bruto.motivo.valorObservado ?? null,
          valorLimite: bruto.motivo.valorLimite ?? null,
          mensagemDiagnostico: bruto.motivo.mensagemDiagnostico ?? null,
        }
      : null,
    escovas,
  };
}

/** Converte a escova do status em leitura, para o mesmo caminho de merge do hub. */
export function leituraDeEscovaStatus(motorId: number, escova: EscovaStatusDto): LeituraEscova {
  return {
    motorId,
    sensorId: escova.sensorId,
    numeroEscova: escova.numeroEscova,
    valorCelsius: escova.valorCelsius,
    dataHora: escova.dataHora,
    alertaDesgaste: escova.alertaDesgaste,
    resultadosQualityGates: escova.resultadosQualityGates,
  };
}
