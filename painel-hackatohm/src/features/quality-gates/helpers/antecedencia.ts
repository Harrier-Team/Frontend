import { formatarDuracaoMinutos } from '@/utils/tempo';

/** Posições (0 a 100, da esquerda para a direita) do aviso e do crítico na régua de antecedência. */
export interface PosicoesAntecedencia {
  aviso: number;
  critico: number;
}

/**
 * Régua de tempo da direita para a esquerda: "agora" fica à direita (100) e
 * "sem urgência" à esquerda. A régua cobre um quarto a mais que o aviso, para
 * sobrar espaço antes dele.
 */
export function posicoesNaRegua(aviso: number, critico: number): PosicoesAntecedencia | null {
  if (!Number.isFinite(aviso) || !Number.isFinite(critico) || critico <= 0 || aviso <= critico) return null;
  const alcance = aviso * 1.25;
  return { aviso: (1 - aviso / alcance) * 100, critico: (1 - critico / alcance) * 100 };
}

/** "Avisa 30 min antes de 95 °C; crítico 10 min antes" ou null com valores inválidos. */
export function fraseDaAntecedencia(
  aviso: number,
  critico: number,
  temperaturaLimite: number | undefined
): string | null {
  if (posicoesNaRegua(aviso, critico) === null) return null;
  const limite =
    typeof temperaturaLimite === 'number' && Number.isFinite(temperaturaLimite)
      ? `${temperaturaLimite.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} °C`
      : 'a temperatura limite';
  return `Avisa ${formatarDuracaoMinutos(aviso)} antes de ${limite}; crítico ${formatarDuracaoMinutos(critico)} antes`;
}

/** Tradução da janela em tempo de histórico: "≈ 2 min de histórico a cada 10 s". */
export function traduzirJanela(janela: number, cadenciaSegundos = 10): string {
  const minutos = (janela * cadenciaSegundos) / 60;
  const texto = minutos.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return `≈ ${texto} min de histórico a cada ${cadenciaSegundos} s`;
}
