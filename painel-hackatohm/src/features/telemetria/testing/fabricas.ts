import { NivelSeveridade, ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { LeituraEscova, MotorStatusDto } from '@/features/telemetria/types/telemetria';

export function gate(sobrescrever: Partial<ResultadoGateRealtime> = {}): ResultadoGateRealtime {
  return {
    regraQualidadeId: 'regra-1',
    nomeRegra: 'Limiar estático',
    disparouAlerta: false,
    severidade: 'Normal',
    tipoRegra: 'temperatura.limiar_estatico',
    codigoRegra: 'OK',
    mensagemDiagnostico: null,
    valorObservado: null,
    valorLimite: null,
    metadados: null,
    ...sobrescrever,
  };
}

export function gateAguardando(sobrescrever: Partial<ResultadoGateRealtime> = {}) {
  return gate({
    nomeRegra: 'Gradiente térmico',
    tipoRegra: 'temperatura.gradiente_termico',
    codigoRegra: 'DADOS_INSUFICIENTES',
    metadados: { avaliacaoConcluida: false },
    ...sobrescrever,
  });
}

export function gateAlerta(
  severidade: NivelSeveridade,
  sobrescrever: Partial<ResultadoGateRealtime> = {}
) {
  return gate({
    disparouAlerta: true,
    severidade,
    codigoRegra: severidade === 'Critico' ? 'TEMP_CRITICA' : 'TEMP_ALERTA',
    valorObservado: 96.1,
    valorLimite: 95,
    ...sobrescrever,
  });
}

export const T0 = Date.parse('2026-10-26T14:30:00+00:00');

export function iso(deslocamentoSegundos: number): string {
  return new Date(T0 + deslocamentoSegundos * 1000).toISOString();
}

export function leitura(sobrescrever: Partial<LeituraEscova> = {}): LeituraEscova {
  return {
    motorId: 1,
    sensorId: 'AA:BB:CC:DD:EE:FF-1',
    espMacAddress: 'AA:BB:CC:DD:EE:FF',
    numeroEscova: 1,
    valorCelsius: 50,
    dataHora: iso(0),
    alertaDesgaste: false,
    resultadosQualityGates: [gate()],
    ...sobrescrever,
  };
}

export function status(sobrescrever: Partial<MotorStatusDto> = {}): MotorStatusDto {
  return {
    motorId: 1,
    severidadeGeral: 'Normal',
    situacao: 'Online',
    contagem: { normal: 1, atencao: 0, alertaPreditivo: 0, critico: 0 },
    motivo: null,
    escovas: [
      {
        sensorId: 'AA:BB:CC:DD:EE:FF-1',
        numeroEscova: 1,
        valorCelsius: 50,
        severidade: 'Normal',
        dataHora: iso(0),
        alertaDesgaste: false,
        resultadosQualityGates: [gate()],
      },
    ],
    ...sobrescrever,
  };
}
