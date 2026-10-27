import React, { useRef } from 'react';
import { TipoRegra } from '@/features/quality-gates/types/regraQualidade';
import { descreverFaixa, LISTA_TIPOS_REGRA } from '../helpers/tiposRegra';

interface TipoRegraSelectorProps {
  valor: TipoRegra;
  onChange: (tipo: TipoRegra) => void;
  /** Tipo fixo (edição): o backend não aceita trocar o tipo de uma regra. */
  desabilitado?: boolean;
}

/** Três cartões: o que cada tipo avalia, a unidade e quando fica "aguardando amostras". */
export const TipoRegraSelector: React.FC<TipoRegraSelectorProps> = ({ valor, onChange, desabilitado }) => {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const mover = (event: React.KeyboardEvent, indice: number) => {
    if (desabilitado) return;
    let alvo: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') alvo = (indice + 1) % LISTA_TIPOS_REGRA.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      alvo = (indice - 1 + LISTA_TIPOS_REGRA.length) % LISTA_TIPOS_REGRA.length;
    if (alvo === null) return;
    event.preventDefault();
    const tipo = LISTA_TIPOS_REGRA[alvo].tipo;
    onChange(tipo);
    refs.current[tipo]?.focus();
  };

  return (
    <div>
      <p id="tipo-regra-label" className="field-label">
        Tipo de regra
      </p>
      <div role="radiogroup" aria-labelledby="tipo-regra-label" className="grid gap-2 sm:grid-cols-3">
        {LISTA_TIPOS_REGRA.map((info, indice) => {
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
              onKeyDown={(event) => mover(event, indice)}
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
              <span className="text-[13px] leading-snug text-ink-2">{info.avalia}</span>
              <span className="text-xs leading-snug text-ink-3">Aguardando amostras: {info.aguardaQuando.toLowerCase()}</span>
              <span className="num text-xs text-ink-3">Limites {descreverFaixa(info)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
