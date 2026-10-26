import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import {
  RegraQualidade,
  RegraQualidadeRequest,
} from '../../types/regraQualidade';
import {
  FormErrors,
  RegraQualidadeFormValues,
  validarRegraQualidade,
} from '../../utils/validationHelper';

interface QualityRuleFormProps {
  regra?: RegraQualidade | null;
  salvando: boolean;
  onSubmit: (payload: RegraQualidadeRequest) => Promise<void>;
  onCancel: () => void;
}

const valoresIniciais: RegraQualidadeFormValues = {
  nome: '',
  descricao: '',
  parametros: { aviso: 80, critico: 95 },
  ativo: true,
};

export const QualityRuleForm: React.FC<QualityRuleFormProps> = ({
  regra,
  salvando,
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<RegraQualidadeFormValues>(valoresIniciais);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setValues(
      regra
        ? {
            nome: regra.nome,
            descricao: regra.descricao ?? '',
            parametros: regra.parametros,
            ativo: regra.ativo,
          }
        : valoresIniciais
    );
    setErrors({});
  }, [regra]);

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
    const validationErrors = validarRegraQualidade(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    await onSubmit({
      nome: values.nome.trim(),
      descricao: values.descricao.trim() || null,
      parametros: values.parametros,
      ativo: values.ativo,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          {regra ? 'Editar regra' : 'Nova regra'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Tipo: temperatura.limiar_estatico
        </p>
      </div>

      <div>
        <label htmlFor="regra-nome" className="mb-1 block text-sm font-semibold text-slate-700">
          Nome
        </label>
        <input
          id="regra-nome"
          value={values.nome}
          maxLength={120}
          onChange={(event) => updateValue('nome', event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        {errors.nome && <p className="mt-1 text-xs text-rose-700">{errors.nome}</p>}
      </div>

      <div>
        <label htmlFor="regra-descricao" className="mb-1 block text-sm font-semibold text-slate-700">
          Descrição
        </label>
        <textarea
          id="regra-descricao"
          value={values.descricao}
          maxLength={255}
          rows={3}
          onChange={(event) => updateValue('descricao', event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        {errors.descricao && <p className="mt-1 text-xs text-rose-700">{errors.descricao}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="regra-aviso" className="mb-1 block text-sm font-semibold text-slate-700">
            Limite de aviso (°C)
          </label>
          <input
            id="regra-aviso"
            type="number"
            step="any"
            value={Number.isNaN(values.parametros.aviso) ? '' : values.parametros.aviso}
            onChange={(event) => updateLimit('aviso', event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {errors.aviso && <p className="mt-1 text-xs text-rose-700">{errors.aviso}</p>}
        </div>
        <div>
          <label htmlFor="regra-critico" className="mb-1 block text-sm font-semibold text-slate-700">
            Limite crítico (°C)
          </label>
          <input
            id="regra-critico"
            type="number"
            step="any"
            value={Number.isNaN(values.parametros.critico) ? '' : values.parametros.critico}
            onChange={(event) => updateLimit('critico', event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {errors.critico && <p className="mt-1 text-xs text-rose-700">{errors.critico}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={values.ativo}
          onChange={(event) => updateValue('ativo', event.target.checked)}
        />
        Regra globalmente ativa
      </label>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" busy={salvando}>
          {regra ? 'Salvar alterações' : 'Criar regra'}
        </Button>
      </div>
    </form>
  );
};
