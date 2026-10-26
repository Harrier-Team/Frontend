import { describe, expect, it } from 'vitest';
import {
  calcularStatusGeralDoMotor,
  classificarSensor,
  formatarTemperatura,
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
