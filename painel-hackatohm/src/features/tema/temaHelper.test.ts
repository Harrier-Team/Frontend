import { describe, expect, it } from 'vitest';
import { alternarTema, CHAVE_TEMA, lerTemaSalvo, rotuloDaTroca, salvarTema } from './temaHelper';

function armazenamentoFalso(inicial: Record<string, string> = {}) {
  const dados = { ...inicial };
  return {
    dados,
    getItem: (chave: string) => dados[chave] ?? null,
    setItem: (chave: string, valor: string) => {
      dados[chave] = valor;
    },
  };
}

describe('tema', () => {
  it('lê o tema salvo e ignora valores inválidos', () => {
    expect(lerTemaSalvo(() => armazenamentoFalso({ [CHAVE_TEMA]: 'light' }))).toBe('light');
    expect(lerTemaSalvo(() => armazenamentoFalso({ [CHAVE_TEMA]: 'dark' }))).toBe('dark');
    expect(lerTemaSalvo(() => armazenamentoFalso({ [CHAVE_TEMA]: 'sepia' }))).toBeNull();
    expect(lerTemaSalvo(() => armazenamentoFalso())).toBeNull();
  });

  it('sem armazenamento ou com acesso bloqueado, não há tema salvo e nada quebra', () => {
    expect(lerTemaSalvo(() => null)).toBeNull();
    expect(
      lerTemaSalvo(() => {
        throw new Error('SecurityError');
      })
    ).toBeNull();
  });

  it('salva a escolha e informa quando não consegue', () => {
    const armazenamento = armazenamentoFalso();
    expect(salvarTema(() => armazenamento, 'light')).toBe(true);
    expect(armazenamento.dados[CHAVE_TEMA]).toBe('light');
    expect(salvarTema(() => null, 'light')).toBe(false);
    expect(
      salvarTema(
        () => ({
          setItem: () => {
            throw new Error('QuotaExceededError');
          },
        }),
        'dark'
      )
    ).toBe(false);
  });

  it('alterna e descreve a ação do botão', () => {
    expect(alternarTema('dark')).toBe('light');
    expect(alternarTema('light')).toBe('dark');
    expect(rotuloDaTroca('dark')).toBe('Usar tema claro');
    expect(rotuloDaTroca('light')).toBe('Usar tema escuro');
  });
});
