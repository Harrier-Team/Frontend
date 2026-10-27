import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Alert } from '@/components/ui/Alert';
import { obterMensagemErro } from '@/utils/errorHelper';
import { TIPOS_REGRA, obterTipoRegra, tipoRegraSuportado } from '../helpers/tipoRegraHelper';
import { criarValoresFormulario, criarPayloadFormulario, trocarTipoFormulario } from '../helpers/regraFormHelper';
import {
  RegraQualidade,
  RegraQualidadeRequest,
} from '@/features/quality-gates/types/regraQualidade';
import {
  FormErrors,
  RegraQualidadeFormValues,
  validarRegraQualidade,
  mapearErrosRegra,
} from '@/features/quality-gates/helpers/validationHelper';

interface QualityRuleFormProps {
  regra?: RegraQualidade | null;
  salvando: boolean;
  onSubmit: (payload: RegraQualidadeRequest) => Promise<void>;
  onCancel: () => void;
}

export const QualityRuleForm: React.FC<QualityRuleFormProps> = ({
  regra,
  salvando,
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<RegraQualidadeFormValues>(() => criarValoresFormulario(regra));
  const [errors, setErrors] = useState<FormErrors>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const tipo = obterTipoRegra(values.tipoRegra);

  useEffect(() => {
    // Sincroniza o formulário quando o registro editado muda.
    // oxlint-disable-next-line react/set-state-in-effect
    setValues(criarValoresFormulario(regra));
    setErrors({});
    setErroGeral(null);
  }, [regra]);

  if (regra && !tipoRegraSuportado(regra.tipoRegra)) {
    return <div className="space-y-4 px-6 pb-6 pt-5">
      <Alert tone="warning" title="Tipo de regra não suportado"
        message={`Esta versão do painel não edita ${regra.tipoRegra}. Os parâmetros existentes serão preservados.`} />
      <Button variant="secondary" onClick={onCancel}>Fechar</Button>
    </div>;
  }

  const updateValue = <K extends keyof RegraQualidadeFormValues>(
    key: K,
    value: RegraQualidadeFormValues[K]
  ) => setValues((current) => ({ ...current, [key]: value }));

  const updateLimit = (key: 'aviso' | 'critico', value: string) => {
    updateValue('parametros', {
      ...values.parametros,
      [key]: value === '' ? Number.NaN : Number(value),
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErroGeral(null);
    const validationErrors = validarRegraQualidade(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await onSubmit(criarPayloadFormulario(values));
    } catch (error) {
      const campos = mapearErrosRegra(error);
      setErrors(campos);
      setErroGeral(Object.keys(campos).length > 0
        ? 'Revise os campos indicados. Seus valores foram mantidos.'
        : obterMensagemErro(error, 'Não foi possível salvar a regra.'));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 px-6 pb-6 pt-5" noValidate>
      {erroGeral && <Alert tone="error" title="Não foi possível salvar" message={erroGeral} />}
      <div>
        <label htmlFor="regra-tipo" className="field-label">Tipo de regra</label>
        <select id="regra-tipo" className="field" value={values.tipoRegra}
          disabled={salvando} aria-invalid={Boolean(errors.tipoRegra)}
          aria-describedby="regra-tipo-ajuda"
          onChange={(event) => {
            setValues((atual) => trocarTipoFormulario(atual, event.target.value));
            setErrors({}); setErroGeral(null);
          }}>
          {Object.entries(TIPOS_REGRA).map(([id, config]) =>
            <option key={id} value={id}>{config.nome}</option>)}
        </select>
        {errors.tipoRegra && <p className="field-error">{errors.tipoRegra}</p>}
        <p id="regra-tipo-ajuda" className="mt-2 text-xs leading-relaxed text-ink-2">
          {tipo?.descricao} {tipo?.requisito}
        </p>
      </div>
      <div>
        <label htmlFor="regra-nome" className="field-label">
          Nome
        </label>
        <input
          id="regra-nome"
          value={values.nome}
          disabled={salvando}
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
          disabled={salvando}
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
            Aviso a partir de ({tipo?.unidade})
          </label>
          <input
            id="regra-aviso"
            type="number"
            inputMode="decimal"
            step="any"
            min={tipo?.minimo}
            max={tipo?.maximo}
            disabled={salvando}
            value={Number.isNaN(values.parametros.aviso) ? '' : values.parametros.aviso}
            aria-invalid={Boolean(errors.aviso)}
            onChange={(event) => updateLimit('aviso', event.target.value)}
            className="field num"
          />
          {errors.aviso && <p className="field-error">{errors.aviso}</p>}
        </div>
        <div>
          <label htmlFor="regra-critico" className="field-label">
            Crítico a partir de ({tipo?.unidade})
          </label>
          <input
            id="regra-critico"
            type="number"
            inputMode="decimal"
            step="any"
            min={tipo?.minimo}
            max={tipo?.maximo}
            disabled={salvando}
            value={Number.isNaN(values.parametros.critico) ? '' : values.parametros.critico}
            aria-invalid={Boolean(errors.critico)}
            onChange={(event) => updateLimit('critico', event.target.value)}
            className="field num"
          />
          {errors.critico && <p className="field-error">{errors.critico}</p>}
        </div>
      </div>

      <p className="text-xs text-ink-3">
        Ao trocar o tipo, preencha novamente os limites na unidade indicada. O aviso deve ser menor que o crítico.
      </p>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
        <span id="regra-ativa-label" className="text-sm text-ink">
          Regra ativa
        </span>
        <Switch
          checked={values.ativo}
          disabled={salvando}
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
