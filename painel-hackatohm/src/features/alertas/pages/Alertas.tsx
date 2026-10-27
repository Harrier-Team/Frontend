import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { ApiErrorState } from '@/components/ui/ApiErrorState';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Tabs } from '@/components/ui/Tabs';
import { idDaAba, idDoPainel } from '@/components/ui/tabsIds';
import { useMonitoramento } from '@/hooks/useMonitoramento';
import { ConexaoSessao } from '@/features/eventos/components/ConexaoSessao';
import { useAgora } from '@/features/telemetria/hooks/useAgora';
import { FiltrosDosAlertas } from '../components/FiltrosDosAlertas';
import { PaginacaoAlertas } from '../components/PaginacaoAlertas';
import { TabelaAlertas } from '../components/TabelaAlertas';
import { chaveDoAlerta, filtrarAlertas, tituloDosAlertas } from '../helpers/apresentacao';
import {
  AbaAlertas,
  escreverParametros,
  FILTROS_PADRAO,
  FiltrosAlertas,
  lerAba,
  lerFiltros,
} from '../helpers/filtros';
import { useAlertasAbertos, useHistoricoAlertas, useReconhecidos } from '../hooks/useAlertas';
import { alertasStore, reconhecimentos } from '../store/alertasStore';

const ABAS_COMPLETAS: Array<{ id: AbaAlertas; rotulo: string }> = [
  { id: 'abertos', rotulo: 'Em aberto' },
  { id: 'historico', rotulo: 'Histórico' },
  { id: 'conexao', rotulo: 'Conexão' },
];

/**
 * Alertas de manutenção, persistidos pelo backend: sobrevivem ao recarregamento
 * e não dependem de quem estava olhando. Em aberto (lista viva), histórico
 * (paginado, com filtros na URL) e a conexão desta sessão. Se a API ainda não
 * tem `/api/alertas`, só o registro de conexão fica disponível.
 */
export const Alertas: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const aba = lerAba(params);
  const filtros = lerFiltros(params);
  const { motores } = useMonitoramento();
  const agora = useAgora();
  const estado = useAlertasAbertos();
  const reconhecidos = useReconhecidos();
  const nomes = useMemo(() => new Map(motores.map((m) => [m.id, m.nome])), [motores]);
  const nomeDoMotor = (id: number) => nomes.get(id) ?? `Motor ${id}`;

  const historico = useHistoricoAlertas(filtros, aba === 'historico' && estado.situacao !== 'indisponivel');

  const navegar = (proximaAba: AbaAlertas, proximos: FiltrosAlertas) =>
    setParams(escreverParametros(proximaAba, proximos), { replace: true });
  const mudarFiltros = (alteracao: Partial<FiltrosAlertas>) =>
    navegar(aba, { ...filtros, ...alteracao, pagina: 'pagina' in alteracao ? (alteracao.pagina as number) : 1 });
  const limpar = () => navegar(aba, FILTROS_PADRAO);

  const indisponivel = estado.situacao === 'indisponivel';
  const abertosFiltrados = filtrarAlertas(estado.abertos, filtros);
  const criticosPendentes = estado.abertos.filter(
    (a) => a.severidade === 'Critico' && !reconhecidos.has(chaveDoAlerta(a))
  );

  const cabecalho = (
    <header className="space-y-2">
      <p className="eyebrow">Alertas de manutenção</p>
      <h1 className="display text-[28px] leading-tight sm:text-[34px]">
        {indisponivel ? 'Alertas indisponíveis nesta versão da API' : tituloDosAlertas(estado.abertos)}
      </h1>
      {!indisponivel && (
        <p className="max-w-2xl text-[15px] text-ink-2">
          O servidor registra cada alerta quando uma regra passa a disparar e o encerra quando ela para. Por isso a lista
          continua aqui ao recarregar a página.
        </p>
      )}
    </header>
  );

  if (indisponivel) {
    return (
      <div className="space-y-8">
        {cabecalho}
        <Alert
          tone="warning"
          title="Alertas indisponíveis nesta versão da API"
          message="O servidor ainda não oferece a lista de alertas de manutenção. O painel continua monitorando os motores normalmente; abaixo fica o registro de conexão desta sessão."
        />
        <Button variant="secondary" onClick={() => void alertasStore.recarregar()}>
          Tentar de novo
        </Button>
        <section aria-labelledby="titulo-conexao" className="space-y-3">
          <h2 id="titulo-conexao" className="display text-base">
            Conexão desta sessão
          </h2>
          <ConexaoSessao />
        </section>
      </div>
    );
  }

  const carregandoAbertos = estado.situacao === 'inicial' || (estado.situacao === 'carregando' && estado.abertos.length === 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        {cabecalho}
        {aba === 'abertos' && criticosPendentes.length > 0 && (
          <Button variant="secondary" onClick={() => reconhecimentos.reconhecer(criticosPendentes)} className="self-start">
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Reconhecer críticos ({criticosPendentes.length})
          </Button>
        )}
      </div>

      <Tabs
        label="Seções dos alertas"
        prefixo="alertas"
        valor={aba}
        onChange={(id) => navegar(id as AbaAlertas, id === 'conexao' ? FILTROS_PADRAO : { ...filtros, pagina: 1 })}
        itens={ABAS_COMPLETAS.map((a) => (a.id === 'abertos' ? { ...a, contagem: estado.abertos.length } : a))}
      />

      <div
        role="tabpanel"
        id={idDoPainel('alertas', aba)}
        aria-labelledby={idDaAba('alertas', aba)}
        tabIndex={0}
        className="space-y-5 outline-offset-8"
      >
        {aba !== 'conexao' && (
          <FiltrosDosAlertas
            filtros={filtros}
            motores={motores}
            comSituacao={aba === 'historico'}
            onChange={mudarFiltros}
            onLimpar={limpar}
          />
        )}

        {aba === 'abertos' && (
          <>
            {estado.situacao === 'erro' && estado.abertos.length > 0 && (
              <Alert
                tone="warning"
                title="Não foi possível atualizar a lista"
                message={`${estado.erro ?? ''} Os alertas abaixo podem estar desatualizados.`}
              />
            )}
            {carregandoAbertos ? (
              <LoadingState label="Carregando alertas" rows={3} />
            ) : estado.situacao === 'erro' && estado.abertos.length === 0 ? (
              <ApiErrorState
                title="Não foi possível carregar os alertas"
                message={estado.erro ?? 'Tente de novo em instantes.'}
                onRetry={() => void alertasStore.recarregar()}
              />
            ) : abertosFiltrados.length === 0 ? (
              <EmptyState
                title={estado.abertos.length === 0 ? 'Nenhum alerta em aberto' : 'Nenhum alerta com estes filtros'}
                description={
                  estado.abertos.length === 0
                    ? 'Quando uma regra passar a disparar, o alerta aparece aqui e fica até ela parar. Os já encerrados estão no histórico.'
                    : 'Limpe os filtros para ver todos os alertas em aberto.'
                }
              />
            ) : (
              <TabelaAlertas
                alertas={abertosFiltrados}
                agora={agora}
                nomeDoMotor={nomeDoMotor}
                legenda="Alertas de manutenção em aberto, dos mais graves aos menos graves"
                reconhecidos={reconhecidos}
                onReconhecer={(alerta) => reconhecimentos.reconhecer([alerta])}
              />
            )}
          </>
        )}

        {aba === 'historico' && (
          <>
            {historico.erro && !historico.carregando && (
              <ApiErrorState
                title="Não foi possível carregar o histórico"
                message={historico.erro}
                onRetry={historico.recarregar}
              />
            )}
            {!historico.pagina && historico.carregando && <LoadingState label="Carregando histórico" rows={3} />}
            {historico.pagina && (
              <div className={historico.carregando ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={historico.carregando}>
                {historico.pagina.itens.length === 0 ? (
                  <EmptyState
                    title="Nenhum alerta encontrado"
                    description="Nenhum alerta corresponde a estes filtros. Tente ampliar a busca."
                  />
                ) : (
                  <div className="space-y-4">
                    <TabelaAlertas
                      alertas={historico.pagina.itens}
                      agora={agora}
                      nomeDoMotor={nomeDoMotor}
                      legenda="Histórico de alertas de manutenção, do mais recente ao mais antigo"
                    />
                    <PaginacaoAlertas
                      pagina={historico.pagina.pagina}
                      tamanho={historico.pagina.tamanho}
                      total={historico.pagina.total}
                      ocupado={historico.carregando}
                      onMudar={(pagina) => mudarFiltros({ pagina })}
                    />
                  </div>
                )}
              </div>
            )}
            <p className="text-[13px] text-ink-3">
              O servidor não filtra por período: a lista vai do alerta mais recente ao mais antigo.
            </p>
          </>
        )}

        {aba === 'conexao' && <ConexaoSessao />}
      </div>
    </div>
  );
};
