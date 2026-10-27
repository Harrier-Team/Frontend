import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import {
  ParametrosRegra,
  RegraQualidade,
  RegraQualidadeRequest,
  TipoRegra,
} from '@/features/quality-gates/types/regraQualidade';
import { TipoRegraSelector } from '@/features/quality-gates/components/TipoRegraSelector';
import { EscalaLimites } from '@/features/quality-gates/components/EscalaLimites';
import {
  descreverFaixa,
  ehTipoRegra,
  obterTipoRegra,
  TIPO_LIMIAR_ESTATICO,
} from '@/features/quality-gates/helpers/tiposRegra';
import {
  errosDoServidorParaFormulario,
  FormErrors,
  RegraQualidadeFormValues,
  validarRegraQualidade,
} from '@/features/quality-gates/helpers/validationHelper';

interface QualityRuleFormProps {
  regra?: RegraQualidade | null;
  salvando: boolean;
  /** Erros de campo do Problem Details da última tentativa que falhou. */
  errosServidor?: Record<string, string[]> | null;
  onSubmit: (payload: RegraQualidadeRequest) => Promise<void>;
  onCancel: () => void;
}

const valoresIniciais: RegraQualidadeFormValues = {
  nome: '',
  descricao: '',
  tipoRegra: TIPO_LIMIAR_ESTATICO,
  // Limites dependem do equipamento: nenhum valor sugerido.
  parametros: { aviso: Number.NaN, critico: Number.NaN },
  ativo: true,
};

export const QualityRuleForm: React.FC<QualityRuleFormProps> = ({
  regra,
  salvando,
  errosServidor,
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<RegraQualidadeFormValues>(valoresIniciais);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    // Sincroniza o formulário quando o registro editado muda.
    // oxlint-disable-next-line react/set-state-in-effect
    setValues(
      regra
        ? {
            nome: regra.nome,
            descricao: regra.descricao ?? '',
            tipoRegra: ehTipoRegra(regra.tipoRegra) ? regra.tipoRegra : TIPO_LIMIAR_ESTATICO,
            parametros: regra.parametros,
            ativo: regra.ativo,
          }
        : valoresIniciais
    );
    setErrors({});
  }, [regra]);

  useEffect(() => {
    // Falha HTTP: os erros por campo aparecem no campo, e os valores digitados ficam.
    const doServidor = errosDoServidorParaFormulario(errosServidor);
    // oxlint-disable-next-line react/set-state-in-effect
    if (Object.keys(doServidor).length > 0) setErrors(doServidor);
  }, [errosServidor]);

  const limparErro = (campo: keyof FormErrors) =>
    setErrors((atual) => {
      if (!atual[campo]) return atual;
      const { [campo]: _removido, ...resto } = atual;
      return resto;
    });

  const updateValue = <K extends keyof RegraQualidadeFormValues>(
    key: K,
    value: RegraQualidadeFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === 'nome' || key === 'descricao') limparErro(key);
  };

  const trocarTipo = (tipo: TipoRegra) => {
    setValues((current) => ({
      ...current,
      tipoRegra: tipo,
      // Cada tipo tem unidade e faixa próprias: o valor digitado não vale para o novo tipo.
      parametros: { aviso: Number.NaN, critico: Number.NaN } as ParametrosRegra,
    }));
    setErrors({});
  };

  const updateLimit = (key: 'aviso' | 'critico', value: string) => {
    updateValue('parametros', {
      ...values.parametros,
      [key]: value === '' ? Number.NaN : Number(value),
    });
    limparErro(key);
    if (key === 'aviso') limparErro('critico');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validarRegraQualidade(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    await onSubmit({
      nome: values.nome.trim(),
      descricao: values.descricao.trim() || null,
      tipoRegra: values.tipoRegra,
      parametros: values.parametros,
      ativo: values.ativo,
    });
  };

  const tipo = obterTipoRegra(values.tipoRegra);

  return (
    <form onSubmit={submit} className="space-y-5 px-6 pb-6 pt-5" noValidate>
      <TipoRegraSelector valor={values.tipoRegra} onChange={trocarTipo} desabilitado={Boolean(regra)} />
      {errors.tipo && <p className="field-error -mt-3">{errors.tipo}</p>}
      {regra && (
        <p className="-mt-3 text-[13px] text-ink-3">O tipo não pode ser alterado depois de criada.</p>
      )}

      <div>
        <label htmlFor="regra-nome" className="field-label">
          Nome
        </label>
        <input
          id="regra-nome"
          value={values.nome}
          maxLength={120}
          autoFocus
          aria-invalid={Boolean(errors.nome)}
          onChange={(event) => updateValue('nome', event.target.value)}
          className="field"
        />
        {errors.nome && <p className="field-error">{errors.nome}</p>}
      </div>

      <div>
        <label htmlFor="regra-descricao" className="field-label">
          Descrição <span className="text-ink-3">(opcional)</span>
        </label>
        <textarea
          id="regra-descricao"
          value={values.descricao}
          maxLength={255}
          rows={2}
          aria-invalid={Boolean(errors.descricao)}
          onChange={(event) => updateValue('descricao', event.target.value)}
          className="field resize-none"
        />
        {errors.descricao && <p className="field-error">{errors.descricao}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="regra-aviso" className="field-label">
            Aviso a partir de ({tipo.unidadeLonga})
          </label>
          <input
            id="regra-aviso"
            type="number"
            inputMode="decimal"
            step="any"
            value={Number.isNaN(values.parametros.aviso) ? '' : values.parametros.aviso}
            aria-invalid={Boolean(errors.aviso)}
            onChange={(event) => updateLimit('aviso', event.target.value)}
            className="field num"
          />
          {errors.aviso && <p className="field-error">{errors.aviso}</p>}
        </div>
        <div>
          <label htmlFor="regra-critico" className="field-label">
            Crítico a partir de ({tipo.unidadeLonga})
          </label>
          <input
            id="regra-critico"
            type="number"
            inputMode="decimal"
            step="any"
            value={Number.isNaN(values.parametros.critico) ? '' : values.parametros.critico}
            aria-invalid={Boolean(errors.critico)}
            onChange={(event) => updateLimit('critico', event.target.value)}
            className="field num"
          />
          {errors.critico && <p className="field-error">{errors.critico}</p>}
        </div>
      </div>
      <p className="-mt-3 text-[13px] text-ink-3">
        Cada limite aceita valores {descreverFaixa(tipo)}. O aviso deve ser menor que o crítico; igual ao limite já dispara.
      </p>
      <div className="rounded-xl border border-line px-4 py-3">
        <p className="mb-2 text-[13px] text-ink-2">Prévia da escala</p>
        <EscalaLimites
          tipoRegra={values.tipoRegra}
          aviso={values.parametros.aviso}
          critico={values.parametros.critico}
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
        <span id="regra-ativa-label" className="text-sm text-ink">
          Regra ativa
        </span>
        <Switch
          checked={values.ativo}
          label="Regra ativa"
          onChange={(valor) => updateValue('ativo', valor)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onCancel} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" busy={salvando}>
          {regra ? 'Salvar alterações' : 'Criar regra'}
        </Button>
      </div>
    </form>
  );
};
