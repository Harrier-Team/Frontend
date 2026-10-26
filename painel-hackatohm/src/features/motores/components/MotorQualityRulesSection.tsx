import React, { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRegrasQualidade } from '@/features/quality-gates/hooks/useRegrasQualidade';
import { useRegrasQualidadeMotor } from '../hooks/useRegrasQualidadeMotor';
import { RegraQualidade, VinculoRegraQualidade } from '@/features/quality-gates/types/regraQualidade';
import { Alert } from '../../../components/ui/Alert';
import { Button, IconButton } from '../../../components/ui/Button';
import { Panel } from '../../../components/ui/Panel';
import { Switch } from '../../../components/ui/Switch';
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
      setOperacaoErro('Não foi possível associar. A regra pode já estar vinculada a este motor.');
    }
  };

  const handleAlternar = async (vinculo: VinculoRegraQualidade) => {
    try {
      await alternar(vinculo);
      setOperacaoErro(null);
    } catch {
      setOperacaoErro('Não foi possível alterar a regra neste motor.');
    }
  };

  const handleRemover = async () => {
    if (!vinculoRemovendo) return;
    try {
      await remover(vinculoRemovendo);
      setVinculoRemovendo(null);
      setOperacaoErro(null);
    } catch {
      setOperacaoErro('Não foi possível remover a regra deste motor.');
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="gates">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 id="gates" className="display text-base">
          Regras de qualidade<span className="num ml-2 text-ink-3">{vinculos.length}</span>
        </h2>
        <div className="flex min-w-0 flex-wrap gap-2">
          <select
            aria-label="Regra para associar"
            value={regraSelecionada}
            onChange={(event) => setRegraSelecionada(event.target.value)}
            disabled={disponiveis.length === 0}
            className="field min-h-9 w-auto min-w-0 max-w-full flex-1 py-1 text-[13px] sm:max-w-56"
          >
            <option value="">
              {disponiveis.length === 0 ? 'Nenhuma regra disponível' : 'Escolher regra'}
            </option>
            {disponiveis.map((regra) => (
              <option key={regra.id} value={regra.id}>
                {regra.nome}
              </option>
            ))}
          </select>
          <Button size="sm" variant="secondary" disabled={!regraSelecionada} busy={operando} onClick={handleAssociar}>
            Associar
          </Button>
        </div>
      </div>

      {erro && <Alert tone="error" title="Não foi possível carregar as regras" message={erro} />}
      {operacaoErro && <Alert tone="error" title="Operação não concluída" message={operacaoErro} />}

      {carregando ? (
        <LoadingState label="Carregando regras" rows={2} />
      ) : vinculos.length === 0 ? (
        <EmptyState
          title="Nenhuma regra neste motor"
          description="Associe uma regra para avaliar cada leitura contra os limites."
        />
      ) : (
        <Panel>
          {vinculos.map((vinculo) => (
            <VinculoRow
              key={vinculo.regraQualidadeId}
              vinculo={vinculo}
              operando={operando}
              onToggle={handleAlternar}
              onRemove={setVinculoRemovendo}
            />
          ))}
        </Panel>
      )}

      <ConfirmDialog
        open={Boolean(vinculoRemovendo)}
        title={`Remover ${vinculoRemovendo?.regra.nome ?? 'regra'} deste motor?`}
        description="A regra continua disponível em Regras de qualidade. Só o vínculo com este motor é removido."
        confirmLabel="Remover"
        busy={operando}
        onCancel={() => setVinculoRemovendo(null)}
        onConfirm={handleRemover}
      />
    </section>
  );
};

interface VinculoRowProps {
  vinculo: VinculoRegraQualidade;
  operando: boolean;
  onToggle: (vinculo: VinculoRegraQualidade) => void;
  onRemove: (vinculo: VinculoRegraQualidade) => void;
}

const VinculoRow: React.FC<VinculoRowProps> = ({ vinculo, operando, onToggle, onRemove }) => {
  const regra: RegraQualidade | null = vinculo.regra ?? null;
  if (!regra) {
    return (
      <div className="px-5 py-4 text-sm text-hot">
        A API retornou um vínculo sem os dados da regra. Atualize a página.
      </div>
    );
  }
  const executando = regra.ativo && vinculo.ativo;

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className={`min-w-0 flex-1 ${executando ? '' : 'opacity-60'}`}>
        <h3 className="truncate text-[15px] text-ink">{regra.nome}</h3>
        <p className="num mt-0.5 text-[13px] text-ink-2">
          Aviso em {regra.parametros.aviso} °C, crítico em {regra.parametros.critico} °C
        </p>
        {vinculo.ativo && !regra.ativo && (
          <p className="mt-1 text-[13px] text-warn">Desativada em Regras de qualidade, não está sendo avaliada.</p>
        )}
      </div>
      <Switch
        checked={vinculo.ativo}
        disabled={operando}
        label={vinculo.ativo ? 'Pausar neste motor' : 'Avaliar neste motor'}
        onChange={() => onToggle(vinculo)}
      />
      <IconButton label="Remover do motor" disabled={operando} onClick={() => onRemove(vinculo)}>
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </IconButton>
    </div>
  );
};
