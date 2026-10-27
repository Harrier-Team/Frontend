import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf-8');

/**
 * Mede o contraste dos tokens de `tokens.css` (WCAG 2.x) nos dois temas.
 * Texto precisa de 4,5:1 sobre `canvas`, `panel` e `raised`; ícones e pontos
 * (`data-off`) de 3:1.
 */

function lerBloco(inicio: RegExp): Record<string, string> {
  const achado = inicio.exec(css);
  if (!achado) throw new Error(`Bloco ${inicio} não encontrado em tokens.css`);
  const abre = css.indexOf('{', achado.index);
  let nivel = 0;
  let fim = abre;
  for (let i = abre; i < css.length; i += 1) {
    if (css[i] === '{') nivel += 1;
    if (css[i] === '}') nivel -= 1;
    if (nivel === 0) {
      fim = i;
      break;
    }
  }
  const tokens: Record<string, string> = {};
  for (const [, nome, valor] of css.slice(abre, fim).matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    tokens[nome] = valor;
  }
  return tokens;
}

const escuro = lerBloco(/@theme\s*\{/);
const claro = { ...escuro, ...lerBloco(/:root\[data-theme='light'\]/) };

function luminancia(hex: string): number {
  const canal = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
}

export function contraste(a: string, b: string): number {
  const [claroL, escuroL] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claroL + 0.05) / (escuroL + 0.05);
}

/** `color-mix(in srgb, cor pct%, base)`: mistura nos canais sRGB, como o navegador. */
function misturar(cor: string, porcento: number, base: string): string {
  const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const hex = [0, 1, 2]
    .map((i) => Math.round(canal(cor, i) * (porcento / 100) + canal(base, i) * (1 - porcento / 100)))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
  return `#${hex}`;
}

const SUPERFICIES = ['canvas', 'panel', 'raised'] as const;
const TEXTOS = [
  'ink',
  'ink-2',
  'ink-3',
  'sev-normal',
  'sev-atencao',
  'sev-alerta',
  'sev-critico',
  'series-1',
  'series-2',
  'series-3',
  'series-4',
  'series-5',
];

describe.each([
  ['escuro', escuro],
  ['claro', claro],
])('contraste do tema %s', (_nome, tema) => {
  for (const texto of TEXTOS) {
    for (const superficie of SUPERFICIES) {
      it(`${texto} sobre ${superficie} passa AA (4,5:1)`, () => {
        expect(contraste(tema[texto], tema[superficie])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  for (const superficie of SUPERFICIES) {
    it(`data-off sobre ${superficie} passa 3:1 (ícones e pontos)`, () => {
      expect(contraste(tema['data-off'], tema[superficie])).toBeGreaterThanOrEqual(3);
    });
  }

  it('Crítico sobre os fundos tingidos (7%, 8% e 14% sobre o painel) passa AA', () => {
    for (const pct of [7, 8, 14]) {
      const fundo = misturar(tema['sev-critico'], pct, tema.panel);
      expect(contraste(tema['sev-critico'], fundo)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(tema['ink-2'], fundo)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('texto do botão primário (canvas sobre flare) passa AA', () => {
    expect(contraste(tema.canvas, tema.flare)).toBeGreaterThanOrEqual(4.5);
  });
});
