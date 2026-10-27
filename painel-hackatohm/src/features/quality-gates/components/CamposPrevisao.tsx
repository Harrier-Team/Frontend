import React from 'react';
import { ParametrosRegra } from '@/features/quality-gates/types/regraQualidade';
import { EscalaAntecedencia } from '@/features/quality-gates/components/EscalaAntecedencia';
import { traduzirJanela } from '@/features/quality-gates/helpers/antecedencia';
import {
  FormErrors,
  JANELA_MAXIMA,
  JANELA_MINIMA,
  JANELA_PADRAO,
} from '@/features/quality-gates/helpers/validationHelper';

export type CampoPrevisao = 'aviso' | 'critico' | 'temperaturaLimite' | 'janela';

interface CamposPrevisaoProps {
  parametros: ParametrosRegra;
  errors: FormErrors;
  onChange: (campo: CampoPrevisao, valor: string) => void;
}

const textoDe = (valor: number | undefined) =>
  typeof valor !== 'number' || Number.isNaN(valor) ? '' : valor;

/**
 * Campos da regra de previsão por tendência: a temperatura a antecipar, os
 * minutos de antecedência do aviso e do crítico (aviso com mais minutos) e,
 * recolhida, a janela de leituras. O erro único que o backend devolve para
 * `parametros` aparece no topo, não preso a um campo.
 */
export const CamposPrevisao: React.FC<CamposPrevisaoProps> = ({ parametros, errors, onChange }) => {
  const janela = Number.isInteger(parametros.janela) ? (parametros.janela as number) : JANELA_PADRAO;

  return (
    <>
      {errors.parametros && (
        <p role="alert" className="field-error">
          {errors.parametros}
        </p>
      )}
      <div>
        <label htmlFor="regra-temperatura-limite" className="field-label">
          Temperatura a antecipar (°C)
        </label>
        <input
          id="regra-temperatura-limite"
          type="number"
          inputMode="decimal"
          step="any"
          value={textoDe(parametros.temperaturaLimite)}
          aria-invalid={Boolean(errors.temperaturaLimite)}
          onChange={(event) => onChange('temperaturaLimite', event.target.value)}
          className="field num"
        />
        {errors.temperaturaLimite && <p className="field-error">{errors.temperaturaLimite}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="regra-aviso" className="field-label">
            Avisar quando faltar (min)
          </label>
          <input
            id="regra-aviso"
            type="number"
            inputMode="decimal"
            step="any"
            value={textoDe(parametros.aviso)}
            aria-invalid={Boolean(errors.aviso)}
            onChange={(event) => onChange('aviso', event.target.value)}
            className="field num"
          />
          {errors.aviso && <p className="field-error">{errors.aviso}</p>}
        </div>
        <div>
          <label htmlFor="regra-critico" className="field-label">
            Crítico quando faltar (min)
          </label>
          <input
            id="regra-critico"
            type="number"
            inputMode="decimal"
            step="any"
            value={textoDe(parametros.critico)}
            aria-invalid={Boolean(errors.critico)}
            onChange={(event) => onChange('critico', event.target.value)}
            className="field num"
          />
          {errors.critico && <p className="field-error">{errors.critico}</p>}
        </div>
      </div>
      <p className="-mt-3 text-[13px] text-ink-3">
        São minutos de antecedência: o aviso deve ter mais minutos que o crítico, porque avisa mais cedo.
      </p>

      <details className="rounded-xl border border-line px-4 py-3">
        <summary className="cursor-pointer text-[13px] text-ink-2">Avançado</summary>
        <div className="mt-3">
          <label htmlFor="regra-janela" className="field-label">
            Janela de leituras <span className="text-ink-3">(opcional)</span>
          </label>
          <input
            id="regra-janela"
            type="number"
            inputMode="numeric"
            step={1}
            min={JANELA_MINIMA}
            max={JANELA_MAXIMA}
            placeholder={String(JANELA_PADRAO)}
            value={textoDe(parametros.janela)}
            aria-invalid={Boolean(errors.janela)}
            aria-describedby="regra-janela-ajuda"
            onChange={(event) => onChange('janela', event.target.value)}
            className="field num"
          />
          {errors.janela && <p className="field-error">{errors.janela}</p>}
          <p id="regra-janela-ajuda" className="mt-1.5 text-[13px] text-ink-3">
            De {JANELA_MINIMA} a {JANELA_MAXIMA} leituras; vazio usa {JANELA_PADRAO}. {traduzirJanela(janela)}.
          </p>
        </div>
      </details>

      <div className="rounded-xl border border-line px-4 py-3">
        <p className="mb-2 text-[13px] text-ink-2">Prévia da escala</p>
        <EscalaAntecedencia
          aviso={parametros.aviso}
          critico={parametros.critico}
          temperaturaLimite={parametros.temperaturaLimite}
        />
      </div>
    </>
  );
};
