import { describe, expect, it } from 'vitest';
import { duracaoDoToast, TEMPO_TOAST_MS } from './toastContext';

describe('duracaoDoToast', () => {
  it('some em 8 s, exceto Crítico', () => {
    expect(duracaoDoToast('info')).toBe(TEMPO_TOAST_MS);
    expect(duracaoDoToast('atencao')).toBe(8000);
    expect(duracaoDoToast('critico')).toBeNull();
  });
});
