import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Info, OctagonAlert, TriangleAlert } from 'lucide-react';
import { Segmented } from '@/components/ui/Segmented';
import { ParametrosRegra } from '@/features/quality-gates/types/regraQualidade';
import { NivelSeveridade } from '@/features/quality-gates/types/qualityGate';
import { PontoEscova } from '../store/tipos';
import { formatarGrau } from '../helpers/statusHelper';
import {
  afastarRotulos,
  afinarMarcadores,
  cadenciaMediana,
  caminhoLinha,
  calcularEscalaY,
  calcularTicksX,
  dividirEmSegmentos,
  JANELAS,
  JanelaGrafico,
  loteProximo,
  montarLotes,
  recortarJanela,
  reduzirPontos,
  SerieGrafico,
} from '../helpers/grafico';

interface TrendChartProps {
  series: SerieGrafico[];
  /** Limites da regra de limiar estático do motor; sem regra, sem linhas tracejadas. */
  limites: ParametrosRegra | null;
  /** Relógio global (`useAgora`). */
  agora: number;
}

const CORES_SERIE = [
  'var(--color-series-1)',
  'var(--color-series-2)',
  'var(--color-series-3)',
  'var(--color-series-4)',
  'var(--color-series-5)',
];
const COR_SEVERIDADE: Record<Exclude<NivelSeveridade, 'Normal'>, string> = {
  Atencao: 'var(--color-sev-atencao)',
  AlertaPreditivo: 'var(--color-sev-alerta)',
  Critico: 'var(--color-sev-critico)',
};
const ICONE_SEVERIDADE = {
  Atencao: Info,
  AlertaPreditivo: TriangleAlert,
  Critico: OctagonAlert,
} as const;

const formatoHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});
const hora = (t: number) => formatoHora.format(t);

const ALTURA_DESKTOP = 300;
const ALTURA_MOBILE = 240;

function estiloSerie(indice: number) {
  return {
    cor: CORES_SERIE[indice % CORES_SERIE.length],
    // Além da quinta escova a paleta repete com traço pontilhado.
    tracejado: indice >= CORES_SERIE.length ? '1.5 4' : undefined,
  };
}

function useLargura(ref: React.RefObject<HTMLDivElement | null>): number {
  const [largura, setLargura] = useState(720);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setLargura(Math.round(el.getBoundingClientRect().width) || 720);
    if (typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(([entrada]) => {
      setLargura(Math.round(entrada.contentRect.width) || 720);
    });
    observador.observe(el);
    return () => observador.disconnect();
  }, [ref]);
  return largura;
}

/**
 * Tendência térmica da sessão, em SVG próprio: uma linha por escova com rótulo
 * direto no fim, limites tracejados da regra do motor, marcadores de alerta,
 * lacunas que quebram a linha, crosshair com todas as escovas e ΔT, e tabela
 * como alternativa acessível. O backend não guarda histórico: o dado é da sessão.
 */
export const TrendChart: React.FC<TrendChartProps> = ({ series, limites, agora }) => {
  const [janela, setJanela] = useState<JanelaGrafico>('5min');
  const [tabela, setTabela] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const largura = useLargura(caixa);

  const compacto = largura < 520;
  const altura = compacto ? ALTURA_MOBILE : ALTURA_DESKTOP;
  const margem = { esq: 44, dir: compacto ? 60 : 84, topo: 14, base: 28 };
  const areaL = Math.max(largura - margem.esq - margem.dir, 40);
  const areaA = altura - margem.topo - margem.base;

  // Fim arredondado a 5 s: a janela anda sem tremer a cada segundo.
  const ultimoT = useMemo(
    () => Math.max(0, ...series.map((s) => s.pontos[s.pontos.length - 1]?.t ?? 0)),
    [series]
  );
  const fim = Math.max(Math.floor(agora / 5000) * 5000, ultimoT);
  const primeiroT = useMemo(
    () => Math.min(Infinity, ...series.map((s) => s.pontos[0]?.t ?? Infinity)),
    [series]
  );
  const ms = JANELAS.find((j) => j.id === janela)?.ms ?? null;
  const inicio = ms !== null ? fim - ms : Math.min(primeiroT, fim - 60_000);

  const visiveis = useMemo(
    () =>
      series.map((serie) => ({
        numeroEscova: serie.numeroEscova,
        cadencia: cadenciaMediana(serie.pontos),
        pontos: recortarJanela(serie.pontos, inicio, fim),
      })),
    [series, inicio, fim]
  );
  const lotes = useMemo(() => montarLotes(visiveis), [visiveis]);
  const temDados = visiveis.some((s) => s.pontos.length > 0);

  const escala = useMemo(
    () =>
      calcularEscalaY(
        visiveis.flatMap((s) => s.pontos.map((p) => p.v)),
        limites?.critico ?? null
      ),
    [visiveis, limites]
  );

  const x = (t: number) => margem.esq + ((t - inicio) / Math.max(fim - inicio, 1)) * areaL;
  const y = (v: number) => margem.topo + (1 - (v - escala.min) / (escala.max - escala.min)) * areaA;

  const ticksX = calcularTicksX(inicio, fim, Math.max(2, Math.floor(areaL / 110)));

  const tracos = visiveis.map((serie, indice) => {
    // Quebra por lacuna primeiro, só depois reduz: a redução não cria falsas lacunas.
    const segmentos = dividirEmSegmentos(serie.pontos, serie.cadencia).map((seg) =>
      reduzirPontos(seg, Math.max(Math.floor(areaL), 40))
    );
    const ultimo = serie.pontos[serie.pontos.length - 1];
    return { ...serie, ...estiloSerie(indice), segmentos, ultimo };
  });

  const posicoesRotulo = afastarRotulos(
    tracos.map((t) => (t.ultimo ? y(t.ultimo.v) : 0)),
    14,
    margem.topo + 6,
    margem.topo + areaA - 2
  );

  const loteAtivo = cursor !== null ? lotes[cursor] : undefined;

  const aoMover = (event: React.PointerEvent<SVGSVGElement>) => {
    const caixaSvg = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - caixaSvg.left;
    if (px < margem.esq - 8 || px > margem.esq + areaL + 8) {
      setCursor(null);
      return;
    }
    const t = inicio + ((px - margem.esq) / areaL) * (fim - inicio);
    const indice = loteProximo(lotes, t);
    setCursor(indice >= 0 ? indice : null);
  };

  const aoTeclar = (event: React.KeyboardEvent) => {
    if (lotes.length === 0) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setCursor((atual) => (atual === null ? lotes.length - 1 : Math.max(atual - 1, 0)));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setCursor((atual) => (atual === null ? lotes.length - 1 : Math.min(atual + 1, lotes.length - 1)));
    } else if (event.key === 'Escape') {
      setCursor(null);
    }
  };

  const ultimosLotes = useMemo(() => montarLotes(series).slice(-20).reverse(), [series]);
  const escovasTabela = series.map((s) => s.numeroEscova);

  const tooltipEsquerda = loteAtivo ? x(loteAtivo.t) > largura * 0.6 : false;

  return (
    <section aria-labelledby="titulo-tendencia" className="rounded-[var(--radius-panel)] border border-line bg-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id="titulo-tendencia" className="display text-base">
            Tendência
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Janela da sessão: o backend não guarda histórico, então a curva recomeça ao recarregar a página.
          </p>
        </div>
        <Segmented
          label="Janela do gráfico"
          valor={janela}
          onChange={(id) => {
            setJanela(id);
            setCursor(null);
          }}
          itens={JANELAS.map((j) => ({ id: j.id, rotulo: j.rotulo }))}
        />
      </div>

      <div ref={caixa} className="relative mt-4">
        {!temDados ? (
          <div
            className="flex items-center justify-center rounded-[var(--radius-control)] border border-dashed border-line-strong text-sm text-ink-3"
            style={{ height: altura }}
          >
            {series.some((s) => s.pontos.length > 0)
              ? 'Nenhum lote nesta janela. Tente uma janela maior.'
              : 'Aguardando o primeiro lote'}
          </div>
        ) : (
          <>
            <svg
              width={largura}
              height={altura}
              viewBox={`0 0 ${largura} ${altura}`}
              role="img"
              tabIndex={0}
              aria-label={`Gráfico de temperatura das escovas na janela ${
                JANELAS.find((j) => j.id === janela)?.rotulo
              }. Use as setas para percorrer os lotes ou abra a tabela.`}
              onPointerMove={aoMover}
              onPointerLeave={() => setCursor(null)}
              onKeyDown={aoTeclar}
              onBlur={() => setCursor(null)}
              className="block touch-pan-y select-none rounded-[var(--radius-control)]"
            >
              {/* Grade e eixo Y */}
              {escala.ticks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={margem.esq}
                    x2={margem.esq + areaL}
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke="var(--color-line)"
                  />
                  <text
                    x={margem.esq - 8}
                    y={y(tick)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="num"
                    fontSize={12}
                    fill="var(--color-ink-3)"
                  >
                    {tick}
                  </text>
                </g>
              ))}
              <text x={4} y={margem.topo - 4} fontSize={12} fill="var(--color-ink-3)">
                °C
              </text>
              <line
                x1={margem.esq}
                x2={margem.esq + areaL}
                y1={margem.topo + areaA}
                y2={margem.topo + areaA}
                stroke="var(--color-line-strong)"
              />

              {/* Eixo X */}
              {ticksX.map((t) => (
                <text
                  key={t}
                  x={x(t)}
                  y={altura - 8}
                  textAnchor="middle"
                  className="num"
                  fontSize={12}
                  fill="var(--color-ink-3)"
                >
                  {hora(t)}
                </text>
              ))}

              {/* Limites da regra de limiar estático do motor */}
              {limites &&
                (
                  [
                    ['aviso', limites.aviso, COR_SEVERIDADE.AlertaPreditivo],
                    ['crítico', limites.critico, COR_SEVERIDADE.Critico],
                  ] as const
                ).map(([nome, valor, cor]) =>
                  valor >= escala.min && valor <= escala.max ? (
                    <g key={nome}>
                      <line
                        x1={margem.esq}
                        x2={margem.esq + areaL}
                        y1={y(valor)}
                        y2={y(valor)}
                        stroke={cor}
                        strokeWidth={1}
                        strokeDasharray="5 4"
                      />
                      <text
                        x={margem.esq + 6}
                        y={y(valor) - 5}
                        fontSize={12}
                        className="num"
                        fill={cor}
                      >
                        {nome} {formatarGrau(valor)} °C
                      </text>
                    </g>
                  ) : null
                )}

              {/* Linhas por escova */}
              {tracos.map((traco) =>
                traco.segmentos.map((segmento, i) => (
                  <path
                    key={`${traco.numeroEscova}-${i}`}
                    d={caminhoLinha(segmento.map((p) => ({ x: x(p.t), y: y(p.v) })))}
                    fill="none"
                    stroke={traco.cor}
                    strokeWidth={1.5}
                    strokeDasharray={traco.tracejado}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))
              )}

              {/* Marcadores dos pontos que dispararam alerta */}
              {tracos.map((traco) =>
                afinarMarcadores(traco.pontos, x, 16).map((ponto: PontoEscova) => {
                  const severidade = ponto.severidade as Exclude<NivelSeveridade, 'Normal'>;
                  const Icone = ICONE_SEVERIDADE[severidade];
                  return (
                    <g key={`m-${traco.numeroEscova}-${ponto.t}`}>
                      <circle cx={x(ponto.t)} cy={y(ponto.v)} r={7} fill="var(--color-panel)" />
                      <Icone
                        x={x(ponto.t) - 6}
                        y={y(ponto.v) - 6}
                        width={12}
                        height={12}
                        color={COR_SEVERIDADE[severidade]}
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                    </g>
                  );
                })
              )}

              {/* Ponto de luz no último valor e rótulo direto */}
              {tracos.map((traco, i) =>
                traco.ultimo ? (
                  <g key={`f-${traco.numeroEscova}`}>
                    <circle cx={x(traco.ultimo.t)} cy={y(traco.ultimo.v)} r={7} fill="var(--color-flare)" opacity={0.16} />
                    <circle cx={x(traco.ultimo.t)} cy={y(traco.ultimo.v)} r={3.5} fill="var(--color-flare)" />
                    <text
                      x={Math.min(x(traco.ultimo.t) + 12, largura - margem.dir + 8)}
                      y={posicoesRotulo[i]}
                      dominantBaseline="middle"
                      fontSize={12}
                      className="num"
                      fill={traco.cor}
                    >
                      E{traco.numeroEscova} {formatarGrau(traco.ultimo.v)}
                    </text>
                  </g>
                ) : null
              )}

              {/* Crosshair */}
              {loteAtivo && (
                <g pointerEvents="none">
                  <line
                    x1={x(loteAtivo.t)}
                    x2={x(loteAtivo.t)}
                    y1={margem.topo}
                    y2={margem.topo + areaA}
                    stroke="var(--color-ink-3)"
                    strokeDasharray="2 3"
                  />
                  {tracos.map((traco) => {
                    const valor = loteAtivo.valores[traco.numeroEscova];
                    return valor ? (
                      <circle
                        key={`c-${traco.numeroEscova}`}
                        cx={x(loteAtivo.t)}
                        cy={y(valor.v)}
                        r={4}
                        fill="var(--color-panel)"
                        stroke={traco.cor}
                        strokeWidth={2}
                      />
                    ) : null;
                  })}
                </g>
              )}
            </svg>

            {loteAtivo && (
              <div
                role="status"
                className="num pointer-events-none absolute top-2 z-10 min-w-36 rounded-[var(--radius-control)] border border-line-strong bg-raised px-3 py-2 text-[13px] shadow-[0_12px_30px_-10px_rgb(0_0_0/0.6)]"
                style={
                  tooltipEsquerda
                    ? { right: largura - x(loteAtivo.t) + 12 }
                    : { left: x(loteAtivo.t) + 12 }
                }
              >
                <p className="text-ink-2">{hora(loteAtivo.t)}</p>
                <ul className="mt-1 space-y-0.5">
                  {tracos.map((traco) => {
                    const valor = loteAtivo.valores[traco.numeroEscova];
                    return (
                      <li key={traco.numeroEscova} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-ink-2">
                          <span
                            aria-hidden="true"
                            className="inline-block h-0.5 w-3 rounded"
                            style={{ background: traco.cor }}
                          />
                          Escova {traco.numeroEscova}
                        </span>
                        <span className="text-ink">{valor ? `${formatarGrau(valor.v)} °C` : '—'}</span>
                      </li>
                    );
                  })}
                </ul>
                {loteAtivo.deltaT !== null && (
                  <p className="mt-1.5 flex justify-between border-t border-line pt-1.5 text-ink-2">
                    <span>ΔT</span>
                    <span className="text-ink">{formatarGrau(loteAtivo.deltaT)} °C</span>
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-3">
        <button
          type="button"
          aria-expanded={tabela}
          aria-controls="tabela-tendencia"
          onClick={() => setTabela((v) => !v)}
          className="text-[13px] text-ink-2 underline underline-offset-2 transition-colors hover:text-ink"
        >
          {tabela ? 'Ocultar tabela dos últimos lotes' : 'Ver como tabela (últimos 20 lotes)'}
        </button>
        {tabela && (
          <div id="tabela-tendencia" className="mt-3 max-h-72 overflow-auto rounded-[var(--radius-control)] border border-line">
            <table className="num w-full min-w-[320px] text-left text-[13px]">
              <caption className="sr-only">Temperaturas dos últimos 20 lotes da sessão, em graus Celsius</caption>
              <thead className="sticky top-0 bg-panel text-ink-3">
                <tr>
                  <th scope="col" className="px-3 py-2 font-normal">
                    Hora
                  </th>
                  {escovasTabela.map((n) => (
                    <th key={n} scope="col" className="px-3 py-2 text-right font-normal">
                      Escova {n}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 text-right font-normal">
                    ΔT
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ultimosLotes.length === 0 ? (
                  <tr>
                    <td colSpan={escovasTabela.length + 2} className="px-3 py-3 text-ink-3">
                      Ainda sem lotes nesta sessão.
                    </td>
                  </tr>
                ) : (
                  ultimosLotes.map((lote) => (
                    <tr key={lote.t}>
                      <th scope="row" className="px-3 py-1.5 font-normal text-ink-2">
                        {hora(lote.t)}
                      </th>
                      {escovasTabela.map((n) => (
                        <td key={n} className="px-3 py-1.5 text-right text-ink">
                          {lote.valores[n] ? formatarGrau(lote.valores[n].v) : '—'}
                        </td>
                      ))}
                      <td className="px-3 py-1.5 text-right text-ink-2">
                        {lote.deltaT !== null ? formatarGrau(lote.deltaT) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
