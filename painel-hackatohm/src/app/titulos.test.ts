import { describe, expect, it } from 'vitest';
import { chaveDaPagina, tituloDaPagina } from './titulos';

describe('tituloDaPagina', () => {
  it('dá um título por página', () => {
    expect(tituloDaPagina('/')).toBe('Harrier | Telemetria de motores');
    expect(tituloDaPagina('/motores')).toBe('Harrier | Telemetria de motores');
    expect(tituloDaPagina('/motores/3')).toBe('Motor | Harrier');
    expect(tituloDaPagina('/motores/3/regras')).toBe('Motor | Harrier');
    expect(tituloDaPagina('/eventos')).toBe('Eventos | Harrier');
    expect(tituloDaPagina('/regras-qualidade')).toBe('Quality gates | Harrier');
    expect(tituloDaPagina('/sistema')).toBe('Sistema | Harrier');
  });
});

describe('chaveDaPagina', () => {
  it('só muda ao trocar de página, não de aba do motor', () => {
    expect(chaveDaPagina('/motores/3')).toBe(chaveDaPagina('/motores/3/regras'));
    expect(chaveDaPagina('/motores/3')).not.toBe(chaveDaPagina('/motores/4'));
    expect(chaveDaPagina('/eventos')).not.toBe(chaveDaPagina('/'));
  });
});
