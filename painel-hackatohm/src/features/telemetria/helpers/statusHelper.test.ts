import { describe, expect, it } from 'vitest';
import { formatarTemperatura, formatarGrau, formatarRelativo } from './statusHelper';

describe('statusHelper', () => {
  it('formata temperatura e valores ausentes', () => {
    expect(formatarTemperatura(21.456)).toBe('21.5 °C');
    expect(formatarTemperatura(null)).toBe('--');
  });
});

describe('formatação da interface', () => {
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
});
