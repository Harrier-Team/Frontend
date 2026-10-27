import { describe, expect, it } from 'vitest';
import { formatarDuracaoMinutos, formatarHorarioPrevisto, formatarMinutos } from './tempo';

describe('formatarMinutos', () => {
  it('arredonda para minutos inteiros com til', () => {
    expect(formatarMinutos(8.4)).toBe('~8 min');
    expect(formatarMinutos(8.6)).toBe('~9 min');
    expect(formatarMinutos(59.4)).toBe('~59 min');
  });

  it('passa para horas a partir de 60 min', () => {
    expect(formatarMinutos(60)).toBe('~1 h');
    expect(formatarMinutos(80)).toBe('~1 h 20 min');
    expect(formatarMinutos(125)).toBe('~2 h 5 min');
  });

  it('zero é "agora" e menos de um minuto não vira "~0 min"', () => {
    expect(formatarMinutos(0)).toBe('agora');
    expect(formatarMinutos(0.3)).toBe('menos de 1 min');
  });

  it('valor ausente ou inválido vira traço', () => {
    expect(formatarMinutos(null)).toBe('—');
    expect(formatarMinutos(undefined)).toBe('—');
    expect(formatarMinutos(Number.NaN)).toBe('—');
    expect(formatarMinutos(-3)).toBe('—');
  });
});

describe('formatarDuracaoMinutos', () => {
  it('não leva til', () => {
    expect(formatarDuracaoMinutos(4)).toBe('4 min');
    expect(formatarDuracaoMinutos(80)).toBe('1 h 20 min');
    expect(formatarDuracaoMinutos(0.2)).toBe('menos de 1 min');
  });
});

describe('formatarHorarioPrevisto', () => {
  const lote = '2026-10-27T14:30:00+00:00';

  it('soma os minutos ao horário do lote', () => {
    expect(formatarHorarioPrevisto(lote, 8.4, 'UTC')).toBe('14:38');
    expect(formatarHorarioPrevisto(lote, 80, 'UTC')).toBe('15:50');
  });

  it('não depende de relógio: o mesmo lote dá o mesmo horário', () => {
    expect(formatarHorarioPrevisto(lote, 8.4, 'UTC')).toBe(formatarHorarioPrevisto(lote, 8.4, 'UTC'));
  });

  it('data ou minutos inválidos devolvem null', () => {
    expect(formatarHorarioPrevisto(null, 5, 'UTC')).toBeNull();
    expect(formatarHorarioPrevisto('lixo', 5, 'UTC')).toBeNull();
    expect(formatarHorarioPrevisto(lote, null, 'UTC')).toBeNull();
    expect(formatarHorarioPrevisto(lote, -1, 'UTC')).toBeNull();
  });
});
