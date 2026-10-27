import { describe, expect, it } from 'vitest';
import type { NivelSeveridade, ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import {
  calcularStatusGeralDoMotor,
  classificarSensor,
  formatarTemperatura,
  formatarGrau,
  formatarRelativo,
  compararPorUrgencia,
} from './statusHelper';

const gate = (severidade: NivelSeveridade): ResultadoGateRealtime => ({
  regraQualidadeId: 'regra-1', nomeRegra: 'Regra de teste',
  severidade, disparouAlerta: severidade !== 'Normal',
  tipoRegra: 'temperatura.limiar_estatico', codigoRegra: 'TESTE',
  mensagemDiagnostico: 'Diagnostico de teste',
  valorObservado: 85, valorLimite: 80, metadados: null,
});

describe('statusHelper', () => {
  it('separa falta de sinal de falta de avaliação', () => {
    expect(classificarSensor(null, false)).toBe('offline');
    expect(classificarSensor(null, true)).toBe('sem_avaliacao');
    expect(classificarSensor(Number.NaN, true)).toBe('sem_avaliacao');
  });

  it.each(['Atencao', 'AlertaPreditivo'] as const)(
    'classifica %s como atenção usando o resultado do gate',
    (severidade) => {
      expect(classificarSensor(85, true, [gate(severidade)])).toBe('warning');
    }
  );

  it('respeita o resultado normal sem recalcular limites no painel', () => {
    expect(classificarSensor(150, true, [gate('Normal')])).toBe('normal');
  });

  it('usa a maior severidade de todos os gates', () => {
    expect(classificarSensor(30, true, [gate('Normal'), gate('AlertaPreditivo')])).toBe('warning');
    expect(classificarSensor(30, true, [gate('AlertaPreditivo'), gate('Critico')])).toBe('perigo');
    expect(classificarSensor(30, true, [gate('Critico')])).toBe('perigo');
  });

  it.each([20, 60, 80, 150])('não deduz estado térmico de %s °C sem gates', (temperatura) => {
    expect(classificarSensor(temperatura, true, [])).toBe('sem_avaliacao');
    expect(classificarSensor(temperatura, true, null)).toBe('sem_avaliacao');
    expect(classificarSensor(temperatura, true)).toBe('sem_avaliacao');
  });

  it('não trata um gate desconhecido como normal', () => {
    const desconhecido = { ...gate('Normal'), severidade: 'Indisponivel' as const };
    expect(classificarSensor(20, true, [gate('Normal'), desconhecido])).toBe('sem_avaliacao');
    expect(classificarSensor(20, true, [gate('Critico'), desconhecido])).toBe('perigo');
  });

  it('consolida um motor com aviso sem promovê-lo a crítico', () => {
    const status = classificarSensor(85, true, [gate('AlertaPreditivo')]);
    expect(calcularStatusGeralDoMotor([
      { status: 'normal' } as never,
      { status } as never,
    ])).toBe('warning');
  });

  it('consolida o pior status do motor', () => {
    expect(
      calcularStatusGeralDoMotor([
        { status: 'normal' } as never,
        { status: 'warning' } as never,
        { status: 'perigo' } as never,
      ])
    ).toBe('perigo');
    expect(calcularStatusGeralDoMotor([])).toBe('offline');
    expect(calcularStatusGeralDoMotor([
      { status: 'normal' } as never, { status: 'sem_avaliacao' } as never,
    ])).toBe('sem_avaliacao');
  });

  it('formata temperatura e valores ausentes', () => {
    expect(formatarTemperatura(21.456)).toBe('21.5 °C');
    expect(formatarTemperatura(null)).toBe('--');
  });
});

describe('formatação e ordenação da interface', () => {
  it('formata graus no padrão brasileiro', () => {
    expect(formatarGrau(54.24)).toBe('54,2');
    expect(formatarGrau(undefined)).toBe('--');
  });

  it('descreve o tempo decorrido em texto curto', () => {
    const agora = new Date('2026-01-01T12:00:00Z').getTime();
    expect(formatarRelativo('2026-01-01T11:59:58Z', agora)).toBe('agora');
    expect(formatarRelativo('2026-01-01T11:59:30Z', agora)).toBe('há 30 s');
    expect(formatarRelativo('2026-01-01T11:55:00Z', agora)).toBe('há 5 min');
    expect(formatarRelativo(null, agora)).toBe('sem leitura');
  });

  it('ordena do mais urgente ao mais estável', () => {
    const lista = (['normal', 'perigo', 'offline', 'warning', 'sem_avaliacao'] as const).slice();
    lista.sort(compararPorUrgencia);
    expect(lista).toEqual(['perigo', 'warning', 'sem_avaliacao', 'offline', 'normal']);
  });
});
