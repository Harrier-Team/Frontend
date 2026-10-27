import React, { useRef } from 'react';
import { EstadoPrincipal, ehSeveridadeAnormal } from '../helpers/estadoHelper';
import { SIMBOLO_ESTADO } from '../helpers/simbolos';
import { TEMA_ESTADO } from '../helpers/apresentacao';
import { arcoMaisCurto, escovaVizinha, posicoesDasEscovas } from '../helpers/anel';
import { formatarGrau } from '../helpers/statusHelper';

export interface EscovaDoAnel {
  numeroEscova: number;
  /** Última leitura em °C; null = sem leitura. */
  valor: number | null;
  /** Severidade do backend ou o motivo de não haver (aguardando amostras, sem regras...). */
  estado: EstadoPrincipal;
}

export interface AssimetriaDoAnel {
  maisQuente: number;
  maisFria: number;
  /** Diferença em °C mostrada no centro. */
  diferenca: number;
  /** Severidade (do backend) da regra de assimetria; só realça com alerta. */
  estado: EstadoPrincipal;
}

interface CollectorRingProps {
  escovas: EscovaDoAnel[];
  /** Dado atrasado ou offline: contorno tracejado, cor de alerta a 60%. */
  desatualizado: boolean;
  /** Maior leitura, mostrada no centro quando não há alerta de assimetria. */
  maiorTemperatura: number | null;
  /** Escovas extremas e ΔT; o realce do arco só aparece com a assimetria em alerta. */
  assimetria: AssimetriaDoAnel | null;
  /** Escova destacada, compartilhada com os cartões e o gráfico. */
  selecionada: number | null;
  onSelecionar: (numeroEscova: number | null) => void;
  /** Modo apresentação: o desenho cresce além dos 360 px. */
  ampliado?: boolean;
  className?: string;
}

const LADO = 360;
const CENTRO = LADO / 2;
const RAIO = 134;

/**
 * Vista esquemática do anel coletor, inspirada no render da identidade Harrier.
 * É esquemática: os porta-escovas ficam igualmente espaçados na ordem do número
 * da escova (a 1 no topo, sentido horário) e as posições NÃO são medidas.
 * Cor só em Atenção, Alerta e Crítico; contorno tracejado sem leitura ou com
 * dado desatualizado. Setas percorrem as escovas.
 */
export const CollectorRing: React.FC<CollectorRingProps> = ({
  escovas,
  desatualizado,
  maiorTemperatura,
  assimetria,
  selecionada,
  onSelecionar,
  ampliado = false,
  className = '',
}) => {
  const refs = useRef<Record<number, SVGGElement | null>>({});
  const numeros = escovas.map((e) => e.numeroEscova);
  const posicoes = posicoesDasEscovas(numeros, CENTRO, CENTRO, RAIO);
  const porNumero = new Map(escovas.map((e) => [e.numeroEscova, e]));
  const largura = posicoes.length <= 6 ? 76 : posicoes.length <= 8 ? 62 : 50;
  const altura = 50;

  const alerta = assimetria !== null && ehSeveridadeAnormal(assimetria.estado);
  const corAlerta = alerta ? TEMA_ESTADO[assimetria.estado].color : undefined;
  const posAssimetria = alerta
    ? {
        quente: posicoes.find((p) => p.numeroEscova === assimetria.maisQuente),
        fria: posicoes.find((p) => p.numeroEscova === assimetria.maisFria),
      }
    : null;
  const arco =
    posAssimetria?.quente && posAssimetria.fria
      ? arcoMaisCurto(CENTRO, CENTRO, RAIO, posAssimetria.quente.angulo, posAssimetria.fria.angulo)
      : null;

  const aoTeclar = (event: React.KeyboardEvent, atual: number) => {
    let alvo: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') alvo = escovaVizinha(numeros, atual, 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') alvo = escovaVizinha(numeros, atual, -1);
    else if (event.key === 'Home') alvo = Math.min(...numeros);
    else if (event.key === 'End') alvo = Math.max(...numeros);
    else if (event.key === 'Escape') {
      onSelecionar(null);
      return;
    }
    if (alvo === null) return;
    event.preventDefault();
    onSelecionar(alvo);
    refs.current[alvo]?.focus();
  };

  // Um só ponto de entrada no Tab: a escova selecionada, ou a primeira.
  const entrada = selecionada !== null && numeros.includes(selecionada) ? selecionada : posicoes[0]?.numeroEscova;

  const resumoAria = escovas
    .map(
      (e) =>
        `escova ${e.numeroEscova}: ${e.valor !== null ? `${formatarGrau(e.valor)} graus` : 'sem leitura'}, ${TEMA_ESTADO[e.estado].label}`
    )
    .join('; ');

  return (
    <figure className={`m-0 ${className}`}>
      <svg
        viewBox={`0 0 ${LADO} ${LADO}`}
        className={`mx-auto block h-auto w-full select-none overflow-visible ${ampliado ? 'max-w-[520px]' : 'max-w-[360px]'}`}
        role="group"
        aria-label={`Anel coletor, representação esquemática. ${resumoAria}. Use as setas para percorrer as escovas.`}
      >
        <defs>
          <linearGradient id="anel-aco" x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0" stopColor="var(--color-ink)" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="var(--color-ink-3)" />
            <stop offset="1" stopColor="var(--color-ink-2)" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Anel de aço: traço com gradiente e dois filetes para dar corpo */}
        <circle cx={CENTRO} cy={CENTRO} r={RAIO + 6} fill="none" stroke="var(--color-line-strong)" strokeWidth={1} />
        <circle cx={CENTRO} cy={CENTRO} r={RAIO} fill="none" stroke="url(#anel-aco)" strokeWidth={8} opacity={0.85} />
        <circle cx={CENTRO} cy={CENTRO} r={RAIO - 6} fill="none" stroke="var(--color-line-strong)" strokeWidth={1} />

        {/* Realce do arco entre a escova mais quente e a mais fria (assimetria em alerta) */}
        {arco && (
          <path
            d={arco.d}
            fill="none"
            stroke={corAlerta}
            strokeWidth={8}
            strokeLinecap="round"
            opacity={desatualizado ? 0.45 : 0.8}
            aria-hidden="true"
          />
        )}

        {/* Centro: ΔT com alerta de assimetria; senão, a maior temperatura */}
        <g textAnchor="middle" aria-hidden="true">
          <text x={CENTRO} y={CENTRO - 28} fontSize={10} letterSpacing="0.14em" fill="var(--color-ink-3)">
            {alerta ? 'DIFERENÇA ENTRE ESCOVAS' : 'MAIOR TEMPERATURA'}
          </text>
          <text
            x={CENTRO}
            y={CENTRO + 14}
            fontSize={42}
            className="display num"
            fill={corAlerta ?? 'var(--color-ink)'}
            opacity={alerta && desatualizado ? 0.6 : 1}
          >
            {alerta
              ? formatarGrau(assimetria.diferenca)
              : maiorTemperatura !== null
                ? formatarGrau(maiorTemperatura)
                : '—'}
            {(alerta || maiorTemperatura !== null) && (
              <tspan fontSize={16} dx={3} fill="var(--color-ink-3)">
                °C
              </tspan>
            )}
          </text>
          <text x={CENTRO} y={CENTRO + 36} fontSize={12} className="num" fill="var(--color-ink-2)">
            {alerta ? `mín. E${assimetria.maisFria} · máx. E${assimetria.maisQuente}` : desatualizado ? 'desatualizado' : ''}
          </text>
        </g>

        {/* Porta-escovas */}
        {posicoes.map((posicao) => {
          const escova = porNumero.get(posicao.numeroEscova)!;
          const tema = TEMA_ESTADO[escova.estado];
          const anormal = ehSeveridadeAnormal(escova.estado);
          const ativa = selecionada === posicao.numeroEscova;
          const semLeitura = escova.valor === null;
          const tracejado = semLeitura || desatualizado;
          const Icone = SIMBOLO_ESTADO[escova.estado];
          const neutro = escova.estado === 'Normal';
          const rotulo = `Escova ${posicao.numeroEscova}: ${
            semLeitura ? 'sem leitura' : `${formatarGrau(escova.valor)} graus`
          }, ${tema.label}`;
          const corValor = anormal ? tema.color : desatualizado ? 'var(--color-ink-2)' : 'var(--color-ink)';
          return (
            <g
              key={posicao.numeroEscova}
              ref={(el) => {
                refs.current[posicao.numeroEscova] = el;
              }}
              transform={`translate(${posicao.x} ${posicao.y})`}
              tabIndex={posicao.numeroEscova === entrada ? 0 : -1}
              role="group"
              aria-label={rotulo}
              onPointerEnter={() => onSelecionar(posicao.numeroEscova)}
              onPointerLeave={() => onSelecionar(null)}
              onFocus={() => onSelecionar(posicao.numeroEscova)}
              onBlur={() => onSelecionar(null)}
              onKeyDown={(event) => aoTeclar(event, posicao.numeroEscova)}
              className="cursor-default outline-none [&:focus-visible>rect]:stroke-[var(--color-flare)] [&:focus-visible>rect]:stroke-2"
            >
              <rect
                x={-largura / 2}
                y={-altura / 2}
                width={largura}
                height={altura}
                rx={11}
                fill={ativa ? 'var(--color-raised)' : 'var(--color-panel)'}
                stroke={ativa ? 'var(--color-flare)' : anormal ? tema.color : 'var(--color-line-strong)'}
                strokeWidth={ativa || anormal ? 1.75 : 1}
                strokeDasharray={tracejado ? '4 3' : undefined}
                opacity={anormal && desatualizado ? 0.75 : 1}
              />
              <text x={-largura / 2 + 9} y={-altura / 2 + 16} fontSize={11} fill="var(--color-ink-3)">
                E{posicao.numeroEscova}
              </text>
              {neutro ? (
                <circle cx={largura / 2 - 13} cy={-altura / 2 + 12} r={3} fill="var(--color-sev-normal)" />
              ) : (
                <Icone
                  x={largura / 2 - 21}
                  y={-altura / 2 + 5}
                  width={14}
                  height={14}
                  color={tema.color}
                  strokeWidth={2.25}
                  opacity={anormal && desatualizado ? 0.6 : 1}
                  aria-hidden="true"
                />
              )}
              <text
                x={0}
                y={altura / 2 - 11}
                textAnchor="middle"
                fontSize={largura < 60 ? 15 : 18}
                className="num"
                fill={corValor}
                opacity={anormal && desatualizado ? 0.6 : 1}
              >
                {semLeitura ? '—' : formatarGrau(escova.valor)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-3 text-center text-xs text-ink-3">
        Representação esquemática: posições não medidas
      </figcaption>
    </figure>
  );
};
