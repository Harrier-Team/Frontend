import { describe, expect, it } from 'vitest';
import {
  calcularStatusGeralDoMotor,
  classificarSensor,
  formatarTemperatura,
  formatarGrau,
  formatarRelativo,
  compararPorUrgencia,
} from './statusHelper';

describe('statusHelper', () => {
  it('classifica leituras por temperatura e desgaste', () => {
    expect(classificarSensor(null, false, false)).toBe('offline');
    expect(classificarSensor(null, false, true)).toBe('normal');
    expect(classificarSensor(60, false, true)).toBe('warning');
    expect(classificarSensor(80, false, true)).toBe('perigo');
    expect(classificarSensor(20, true, true)).toBe('perigo');
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
    const lista = (['normal', 'perigo', 'offline', 'warning'] as const).slice();
    lista.sort(compararPorUrgencia);
    expect(lista).toEqual(['perigo', 'warning', 'offline', 'normal']);
  });
});
