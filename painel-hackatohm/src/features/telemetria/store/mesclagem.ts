import { LeituraEscova } from '@/features/telemetria/types/telemetria';
import { TIPO_ASSIMETRIA } from '@/features/quality-gates/helpers/tiposRegra';
import { consolidarSeveridade } from '@/features/telemetria/helpers/estadoHelper';
import { PontoEscova, SerieEscova } from './tipos';

/** ~1 hora a 10 s por lote. */
export const MAX_PONTOS = 360;

export const SERIE_VAZIA: SerieEscova = { ultima: null, pontos: [] };

export function instanteDaLeitura(leitura: Pick<LeituraEscova, 'dataHora'>): number | null {
  const t = Date.parse(leitura.dataHora);
  return Number.isNaN(t) ? null : t;
}

/**
 * Insere o ponto mantendo a ordem por `t`. Ponto com o mesmo `t` substitui o
 * existente (mesmo instante, mesma escova: deduplicação). Descarta os mais
 * antigos acima de `max`.
 */
export function adicionarPonto(
  pontos: PontoEscova[],
  ponto: PontoEscova,
  max = MAX_PONTOS
): { pontos: PontoEscova[]; duplicado: boolean } {
  const existente = pontos.findIndex((p) => p.t === ponto.t);
  if (existente >= 0) {
    const copia = pontos.slice();
    copia[existente] = ponto;
    return { pontos: copia, duplicado: true };
  }

  const ultimo = pontos[pontos.length - 1];
  const novos =
    !ultimo || ponto.t > ultimo.t
      ? [...pontos, ponto]
      : [...pontos, ponto].sort((a, b) => a.t - b.t);

  return { pontos: novos.length > max ? novos.slice(novos.length - max) : novos, duplicado: false };
}

export interface ResultadoMesclagem {
  serie: SerieEscova;
  /** O instante ainda não existia na série. */
  novaAmostra: boolean;
  /** A leitura passou a ser a mais recente da escova. */
  substituiuUltima: boolean;
}

/**
 * Funde uma leitura na série da escova.
 *  - Monotonicidade: só vira "última" se o instante for igual ou mais novo.
 *    Instante igual é aceito porque a releitura por HTTP traz os gates
 *    reavaliados com as regras atuais.
 *  - Deduplicação: o mesmo instante nunca gera um segundo ponto.
 */
export function mesclarLeitura(serie: SerieEscova, leitura: LeituraEscova): ResultadoMesclagem {
  const t = instanteDaLeitura(leitura);
  if (t === null || !Number.isFinite(leitura.valorCelsius)) {
    return { serie, novaAmostra: false, substituiuUltima: false };
  }

  const tUltima = serie.ultima ? instanteDaLeitura(serie.ultima) : null;
  const substituiuUltima = tUltima === null || t >= tUltima;

  const { pontos, duplicado } = adicionarPonto(serie.pontos, {
    t,
    v: leitura.valorCelsius,
    // A assimetria é do motor (repetida em cada escova): não marca a curva de uma escova.
    severidade: consolidarSeveridade(
      leitura.resultadosQualityGates.filter((g) => g.tipoRegra !== TIPO_ASSIMETRIA)
    ),
  });

  return {
    serie: {
      // O status por HTTP não traz o MAC do ESP: mantém o que o lote do hub já informou.
      ultima: substituiuUltima
        ? { ...leitura, espMacAddress: leitura.espMacAddress ?? serie.ultima?.espMacAddress }
        : serie.ultima,
      pontos,
    },
    novaAmostra: !duplicado,
    substituiuUltima,
  };
}
