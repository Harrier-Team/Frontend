import React, { useState } from 'react';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { QualityRuleForm } from '../components/quality-gates/QualityRuleForm';
import { QualityRuleList } from '../components/quality-gates/QualityRuleList';
import { useRegrasQualidade } from '../hooks/useRegrasQualidade';
import {
  RegraQualidade,
  RegraQualidadeRequest,
} from '../types/regraQualidade';
import { obterMensagemErro } from '../utils/errorHelper';

export const RegrasQualidade: React.FC = () => {
  const {
    regras,
    carregando,
    salvando,
    excluindoId,
    erro,
    criar,
    atualizar,
    excluir,
    alternarAtivo,
  } = useRegrasQualidade();
  const [formAberto, setFormAberto] = useState(false);
  const [regraEditando, setRegraEditando] = useState<RegraQualidade | null>(null);
  const [regraExcluindo, setRegraExcluindo] = useState<RegraQualidade | null>(null);
  const [operacaoErro, setOperacaoErro] = useState<string | null>(null);

  const abrirCriacao = () => {
    setRegraEditando(null);
    setOperacaoErro(null);
    setFormAberto(true);
  };

  const abrirEdicao = (regra: RegraQualidade) => {
    setRegraEditando(regra);
    setOperacaoErro(null);
    setFormAberto(true);
  };

  const salvar = async (payload: RegraQualidadeRequest) => {
    try {
      if (regraEditando) {
        await atualizar(regraEditando.id, payload);
      } else {
        await criar(payload);
      }
      setFormAberto(false);
      setRegraEditando(null);
      setOperacaoErro(null);
    } catch (error) {
      setOperacaoErro(obterMensagemErro(error, 'Não foi possível salvar a regra.'));
    }
  };

  const alternar = async (regra: RegraQualidade) => {
    try {
      await alternarAtivo(regra);
      setOperacaoErro(null);
    } catch (error) {
      setOperacaoErro(obterMensagemErro(error, 'Não foi possível alterar o estado da regra.'));
    }
  };

  const confirmarExclusao = async () => {
    if (!regraExcluindo) return;
    try {
      await excluir(regraExcluindo.id);
      setRegraExcluindo(null);
      setOperacaoErro(null);
    } catch (error) {
      setOperacaoErro(obterMensagemErro(error, 'Não foi possível excluir a regra.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Regras de qualidade</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie os limiares térmicos disponíveis para associação aos motores.
          </p>
        </div>
        {!formAberto && (
          <Button type="button" onClick={abrirCriacao}>
            Nova regra
          </Button>
        )}
      </div>

      {erro && (
        <Alert
          title="Não foi possível carregar o catálogo"
          message={erro}
          tone="error"
        />
      )}
      {operacaoErro && (
        <Alert title="Operação não concluída" message={operacaoErro} tone="error" />
      )}

      {formAberto && (
        <QualityRuleForm
          regra={regraEditando}
          salvando={salvando}
          onSubmit={salvar}
          onCancel={() => {
            setFormAberto(false);
            setRegraEditando(null);
          }}
        />
      )}

      {carregando ? (
        <LoadingState label="Carregando regras de qualidade..." />
      ) : regras.length === 0 ? (
        <EmptyState
          title="Nenhuma regra cadastrada"
          description="Crie a primeira regra de limiar térmico para disponibilizá-la aos motores."
          action={<Button onClick={abrirCriacao}>Criar primeira regra</Button>}
        />
      ) : (
        <Card className="p-4 sm:p-5">
          <QualityRuleList
            regras={regras}
            salvando={salvando}
            excluindoId={excluindoId}
            onEdit={abrirEdicao}
            onToggle={alternar}
            onDelete={setRegraExcluindo}
          />
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(regraExcluindo)}
        title={`Excluir a regra "${regraExcluindo?.nome}"?`}
        description="Esta ação também removerá todos os vínculos da regra com os motores e não poderá ser desfeita."
        confirmLabel="Excluir regra"
        busy={Boolean(excluindoId)}
        onCancel={() => setRegraExcluindo(null)}
        onConfirm={confirmarExclusao}
      />
    </div>
  );
};
