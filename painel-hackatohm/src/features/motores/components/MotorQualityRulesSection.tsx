import React, { useMemo, useState } from 'react';
import { Link2, Power, Trash2 } from 'lucide-react';
import { useRegrasQualidade } from '@/features/quality-gates/hooks/useRegrasQualidade';
import { useRegrasQualidadeMotor } from '../hooks/useRegrasQualidadeMotor';
import { RegraQualidade, VinculoRegraQualidade } from '@/features/quality-gates/types/regraQualidade';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingState } from '../../../components/ui/LoadingState';

interface MotorQualityRulesSectionProps {
  motorId: number;
}

export const MotorQualityRulesSection: React.FC<MotorQualityRulesSectionProps> = ({
  motorId,
}) => {
  const {
    vinculos,
    carregando,
    operando,
    erro,
    associar,
    alternar,
    remover,
  } = useRegrasQualidadeMotor(motorId);
  const { regras } = useRegrasQualidade();
  const [regraSelecionada, setRegraSelecionada] = useState('');
  const [vinculoRemovendo, setVinculoRemovendo] =
    useState<VinculoRegraQualidade | null>(null);
  const [operacaoErro, setOperacaoErro] = useState<string | null>(null);

  const disponiveis = useMemo(() => {
    const idsVinculados = new Set(vinculos.map((vinculo) => vinculo.regraQualidadeId));
    return regras.filter((regra) => !idsVinculados.has(regra.id));
  }, [regras, vinculos]);

  const handleAssociar = async () => {
    if (!regraSelecionada) return;
    try {
      await associar(regraSelecionada);
      setRegraSelecionada('');
      setOperacaoErro(null);
    } catch {
      setOperacaoErro('A regra pode já estar vinculada a este motor. Atualize a seção e tente novamente.');
    }
  };

  const handleAlternar = async (vinculo: VinculoRegraQualidade) => {
    try {
      await alternar(vinculo);
      setOperacaoErro(null);
    } catch {
      setOperacaoErro('Não foi possível alterar o estado deste vínculo.');
    }
  };

  const handleRemover = async () => {
    if (!vinculoRemovendo) return;
    try {
      await remover(vinculoRemovendo);
      setVinculoRemovendo(null);
      setOperacaoErro(null);
    } catch {
      setOperacaoErro('Não foi possível remover este vínculo.');
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Regras de qualidade</h2>
          <p className="mt-1 text-sm text-slate-500">
            Regras ativas no motor são avaliadas junto às leituras em tempo real.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Regra disponível para associar"
            value={regraSelecionada}
            onChange={(event) => setRegraSelecionada(event.target.value)}
            className="max-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Selecionar regra</option>
            {disponiveis.map((regra) => (
              <option key={regra.id} value={regra.id}>
                {regra.nome}
              </option>
            ))}
          </select>
          <Button
            type="button"
            className="px-3 py-2 text-xs"
            disabled={!regraSelecionada}
            busy={operando}
            onClick={handleAssociar}
          >
            <Link2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Associar
          </Button>
        </div>
      </div>

      {erro && <Alert title="Falha ao carregar vínculos" message={erro} tone="error" />}
      {operacaoErro && (
        <Alert title="Operação não concluída" message={operacaoErro} tone="error" />
      )}

      {carregando ? (
        <LoadingState label="Carregando regras do motor..." />
      ) : vinculos.length === 0 ? (
        <EmptyState
          title="Nenhuma regra vinculada"
          description="Associe uma regra do catálogo para habilitar a avaliação neste motor."
        />
      ) : (
        <div className="space-y-3">
          {vinculos.map((vinculo) => (
            <VinculoCard
              key={vinculo.regraQualidadeId}
              vinculo={vinculo}
              operando={operando}
              onToggle={handleAlternar}
              onRemove={setVinculoRemovendo}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(vinculoRemovendo)}
        title={`Remover "${vinculoRemovendo?.regra.nome}" deste motor?`}
        description="A regra continuará disponível no catálogo e será removido somente este vínculo."
        confirmLabel="Remover vínculo"
        busy={operando}
        onCancel={() => setVinculoRemovendo(null)}
        onConfirm={handleRemover}
      />
    </section>
  );
};

interface VinculoCardProps {
  vinculo: VinculoRegraQualidade;
  operando: boolean;
  onToggle: (vinculo: VinculoRegraQualidade) => void;
  onRemove: (vinculo: VinculoRegraQualidade) => void;
}

const VinculoCard: React.FC<VinculoCardProps> = ({
  vinculo,
  operando,
  onToggle,
  onRemove,
}) => {
  const regra: RegraQualidade | null = vinculo.regra ?? null;
  if (!regra) {
    return (
      <article className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        A API retornou um vínculo sem os dados da regra. Atualize a página ou tente
        novamente.
      </article>
    );
  }
  const executando = regra.ativo && vinculo.ativo;

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-800">{regra.nome}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              executando
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {executando ? 'Executando' : 'Não executada'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Aviso: {regra.parametros.aviso} °C · Crítico: {regra.parametros.critico} °C
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Vínculo: {vinculo.ativo ? 'ativo' : 'inativo'} · Regra global:{' '}
            {regra.ativo ? 'ativa' : 'inativa'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-2 text-xs"
            busy={operando}
            onClick={() => onToggle(vinculo)}
          >
            <Power className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {vinculo.ativo ? 'Desativar vínculo' : 'Ativar vínculo'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="px-3 py-2 text-xs text-rose-700 hover:bg-rose-50"
            disabled={operando}
            onClick={() => onRemove(vinculo)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Remover
          </Button>
        </div>
      </div>
    </article>
  );
};
