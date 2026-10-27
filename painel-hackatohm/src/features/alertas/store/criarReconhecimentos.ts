import { AlertaManutencao } from '../types/alerta';
import { chaveDoAlerta } from '../helpers/apresentacao';

export const CHAVE_ARMAZENAMENTO = 'harrier.alertas.reconhecidos';
/** Quantos reconhecimentos o navegador guarda; os mais antigos saem primeiro. */
export const LIMITE_RECONHECIDOS = 500;

type Armazenamento = Pick<Storage, 'getItem' | 'setItem'>;

function ler(armazenamento: Armazenamento | null): string[] {
  try {
    const bruto = armazenamento?.getItem(CHAVE_ARMAZENAMENTO);
    const lista: unknown = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    // Armazenamento bloqueado ou conteúdo corrompido: o painel segue sem lembrar.
    return [];
  }
}

/**
 * "Reconhecer" só vale neste navegador: os alertas vistos ficam no
 * `localStorage`. Reconhecimento compartilhado entre painéis exigiria o
 * servidor. Toda leitura e escrita é protegida: o painel funciona sem storage.
 */
export function criarReconhecimentos(armazenamento: Armazenamento | null) {
  let ordem = ler(armazenamento).slice(-LIMITE_RECONHECIDOS);
  let conjunto: ReadonlySet<string> = new Set(ordem);
  const ouvintes = new Set<() => void>();

  return {
    subscribe(ouvinte: () => void) {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
    obterReconhecidos: (): ReadonlySet<string> => conjunto,
    reconhecer(alertas: Array<Pick<AlertaManutencao, 'id' | 'iniciadoEm'>>) {
      const novos = alertas.map(chaveDoAlerta).filter((chave) => !conjunto.has(chave));
      if (novos.length === 0) return;
      ordem = [...ordem, ...novos].slice(-LIMITE_RECONHECIDOS);
      conjunto = new Set(ordem);
      try {
        armazenamento?.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(ordem));
      } catch {
        // Cota cheia ou storage bloqueado: vale só até recarregar a página.
      }
      ouvintes.forEach((ouvinte) => ouvinte());
    },
  };
}

export type Reconhecimentos = ReturnType<typeof criarReconhecimentos>;
