import React, { useRef } from 'react';
import { TipoRegra } from '@/features/quality-gates/types/regraQualidade';
import { agruparTiposPorCategoria, descreverFaixa, TIPOS_POR_CATEGORIA } from '../helpers/tiposRegra';

interface TipoRegraSelectorProps {
  valor: TipoRegra;
  onChange: (tipo: TipoRegra) => void;
  /** Tipo fixo (edição): o backend não aceita trocar o tipo de uma regra. */
  desabilitado?: boolean;
}

/**
 * Cartões agrupados pela categoria do backend (Preditivo, Aceleração,
 * Condição): o que cada tipo avalia, a unidade e quando fica "aguardando
 * amostras". As setas percorrem todos os cartões na ordem dos grupos.
 */
export const TipoRegraSelector: React.FC<TipoRegraSelectorProps> = ({ valor, onChange, desabilitado }) => {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const total = TIPOS_POR_CATEGORIA.length;

  const mover = (event: React.KeyboardEvent, tipoAtual: TipoRegra) => {
    if (desabilitado) return;
    const indice = TIPOS_POR_CATEGORIA.findIndex((info) => info.tipo === tipoAtual);
    let alvo: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') alvo = (indice + 1) % total;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') alvo = (indice - 1 + total) % total;
    if (alvo === null) return;
    event.preventDefault();
    const tipo = TIPOS_POR_CATEGORIA[alvo].tipo;
    onChange(tipo);
    refs.current[tipo]?.focus();
  };

  return (
    <div>
      <p id="tipo-regra-label" className="field-label">
        Tipo de regra
      </p>
      <div role="radiogroup" aria-labelledby="tipo-regra-label" className="space-y-3">
        {agruparTiposPorCategoria().map((grupo) => (
          <div key={grupo.categoria} role="presentation">
            <p className="eyebrow mb-1.5">{grupo.rotulo}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {grupo.tipos.map((info) => {
                const ativo = info.tipo === valor;
                return (
                  <button
                    key={info.tipo}
                    ref={(el) => {
                      refs.current[info.tipo] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={ativo}
                    disabled={desabilitado && !ativo}
                    tabIndex={ativo ? 0 : -1}
                    onClick={() => !desabilitado && onChange(info.tipo)}
                    onKeyDown={(event) => mover(event, info.tipo)}
                    className={`flex flex-col gap-1.5 rounded-[var(--radius-control)] border px-3 py-3 text-left transition-colors disabled:opacity-45 ${
                      ativo
                        ? 'border-ink-2 bg-raised'
                        : 'border-line-strong hover:border-ink-3 hover:bg-raised/60'
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm text-ink">{info.rotulo}</span>
                      <span className="num text-xs text-ink-3">{info.unidade}</span>
                    </span>
                    <span className="-mt-1 text-xs text-ink-3">{info.subtitulo}</span>
                    <span className="text-[13px] leading-snug text-ink-2">{info.avalia}</span>
                    <span className="text-xs leading-snug text-ink-3">
                      Aguardando amostras: {info.aguardaQuando.toLowerCase()}
                    </span>
                    <span className="num text-xs text-ink-3">Limites {descreverFaixa(info)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
