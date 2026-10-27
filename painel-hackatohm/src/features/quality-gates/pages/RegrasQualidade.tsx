import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { ApiErrorState } from '@/components/ui/ApiErrorState';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { QualityRuleForm } from '@/features/quality-gates/components/QualityRuleForm';
import { QualityRuleList } from '@/features/quality-gates/components/QualityRuleList';
import { useRegrasQualidade } from '@/features/quality-gates/hooks/useRegrasQualidade';
import { useUsoDasRegras } from '@/features/quality-gates/hooks/useUsoDasRegras';
import {
  RegraQualidade,
  RegraQualidadeRequest,
} from '@/features/quality-gates/types/regraQualidade';
import { obterErrosDeCampo, obterMensagemErro } from '@/utils/errorHelper';
import { errosDoServidorParaFormulario } from '@/features/quality-gates/helpers/validationHelper';

export const RegrasQualidade: React.FC = () => {
  const {
    regras,
    carregando,
    salvando,
    excluindoId,
    erro,
    recarregar,
    criar,
    atualizar,
    excluir,
    alternarAtivo,
  } = useRegrasQualidade();
  const uso = useUsoDasRegras();
  const [formAberto, setFormAberto] = useState(false);
  const [regraEditando, setRegraEditando] = useState<RegraQualidade | null>(null);
  const [regraExcluindo, setRegraExcluindo] = useState<RegraQualidade | null>(null);
  const [operacaoErro, setOperacaoErro] = useState<string | null>(null);
  const [errosCampo, setErrosCampo] = useState<Record<string, string[]> | null>(null);

  const fecharForm = () => {
    setFormAberto(false);
    setRegraEditando(null);
    setOperacaoErro(null);
    setErrosCampo(null);
  };

  const abrirCriacao = () => {
    setRegraEditando(null);
    setOperacaoErro(null);
    setErrosCampo(null);
    setFormAberto(true);
  };

  const abrirEdicao = (regra: RegraQualidade) => {
    setRegraEditando(regra);
    setOperacaoErro(null);
    setErrosCampo(null);
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
      setErrosCampo(null);
    } catch (error) {
      // O modal e os valores digitados ficam; erros de campo vão para o campo.
      const campos = obterErrosDeCampo(error);
      setErrosCampo(Object.keys(campos).length > 0 ? campos : null);
      const nosCampos = Object.keys(errosDoServidorParaFormulario(campos)).length > 0;
      setOperacaoErro(
        nosCampos ? 'Revise os campos destacados.' : obterMensagemErro(error, 'Não foi possível salvar a regra.')
      );
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
    <div className="space-y-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-[28px] leading-tight sm:text-[34px]">Quality gates</h1>
          <p className="mt-2 text-[15px] text-ink-2">
            Regras de temperatura avaliadas a cada lote: limiar estático, gradiente térmico e assimetria entre escovas.
          </p>
        </div>
        {regras.length > 0 && (
          <Button onClick={abrirCriacao} className="self-start sm:self-auto">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nova regra
          </Button>
        )}
      </header>

      {erro && regras.length > 0 && (
        <Alert tone="error" title="Não foi possível atualizar as regras" message={erro} />
      )}
      {operacaoErro && !formAberto && (
        <Alert tone="error" title="Operação não concluída" message={operacaoErro} />
      )}

      {carregando ? (
        <LoadingState label="Carregando regras" />
      ) : regras.length === 0 && erro ? (
        <ApiErrorState
          title="Não foi possível carregar as regras"
          message={erro}
          onRetry={() => void recarregar()}
        />
      ) : regras.length === 0 ? (
        <EmptyState
          title="Nenhuma regra ainda"
          description="Defina limites de temperatura, de subida por minuto ou de diferença entre escovas."
          action={
            <Button onClick={abrirCriacao}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Criar regra
            </Button>
          }
        />
      ) : (
        <QualityRuleList
          regras={regras}
          uso={uso}
          salvando={salvando}
          excluindoId={excluindoId}
          onEdit={abrirEdicao}
          onToggle={alternar}
          onDelete={setRegraExcluindo}
        />
      )}

      <Dialog
        open={formAberto}
        title={regraEditando ? 'Editar regra' : 'Nova regra'}
        onClose={fecharForm}
        locked={salvando}
      >
        {formAberto && (
          <>
            {operacaoErro && (
              <div className="px-6 pt-4">
                <Alert tone="error" title="Não foi possível salvar" message={operacaoErro} />
              </div>
            )}
            <QualityRuleForm
              key={regraEditando?.id ?? 'nova'}
              regra={regraEditando}
              salvando={salvando}
              errosServidor={errosCampo}
              onSubmit={salvar}
              onCancel={fecharForm}
            />
          </>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(regraExcluindo)}
        title={`Excluir ${regraExcluindo?.nome ?? 'regra'}?`}
        description="A regra também sai de todos os motores que a usam. Não dá para desfazer."
        confirmLabel="Excluir regra"
        busy={Boolean(excluindoId)}
        onCancel={() => setRegraExcluindo(null)}
        onConfirm={confirmarExclusao}
      />
    </div>
  );
};
