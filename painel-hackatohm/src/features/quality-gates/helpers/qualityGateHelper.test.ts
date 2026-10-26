import { describe, expect, it } from 'vitest';
import { formatarSeveridade } from './qualityGateHelper';

describe('qualityGateHelper', () => {
  it('formata severidades conhecidas', () => {
    expect(formatarSeveridade('Normal')).toBe('Normal');
    expect(formatarSeveridade('AlertaPreditivo')).toBe('Alerta preditivo');
  });
});
