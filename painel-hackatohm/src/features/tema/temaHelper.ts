/**
 * Tema do painel. Escuro é o padrão (sala de operação); o claro existe para
 * projetor. A escolha fica em `localStorage`, que pode estar bloqueado ou
 * vazio (janela privada): toda leitura e escrita tolera falha.
 */

export type Tema = 'dark' | 'light';

export const CHAVE_TEMA = 'harrier:tema';
export const TEMA_PADRAO: Tema = 'dark';
export const COR_DO_NAVEGADOR: Record<Tema, string> = { dark: '#0b0d10', light: '#f3f4f6' };

type Leitura = Pick<Storage, 'getItem'>;
type Escrita = Pick<Storage, 'setItem'>;

export function ehTema(valor: unknown): valor is Tema {
  return valor === 'dark' || valor === 'light';
}

/** Tema salvo, ou null se não houver escolha válida (ou se o armazenamento falhar). */
export function lerTemaSalvo(obterArmazenamento: () => Leitura | null): Tema | null {
  try {
    const valor = obterArmazenamento()?.getItem(CHAVE_TEMA);
    return ehTema(valor) ? valor : null;
  } catch {
    return null;
  }
}

/** Retorna se conseguiu salvar; a troca de tema vale na aba mesmo quando não consegue. */
export function salvarTema(obterArmazenamento: () => Escrita | null, tema: Tema): boolean {
  try {
    const armazenamento = obterArmazenamento();
    if (!armazenamento) return false;
    armazenamento.setItem(CHAVE_TEMA, tema);
    return true;
  } catch {
    return false;
  }
}

export function alternarTema(tema: Tema): Tema {
  return tema === 'dark' ? 'light' : 'dark';
}

/** Rótulo do botão: diz o que acontece ao clicar. */
export function rotuloDaTroca(tema: Tema): string {
  return tema === 'dark' ? 'Usar tema claro' : 'Usar tema escuro';
}
