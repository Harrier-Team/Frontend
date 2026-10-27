import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ApiRequestError } from '@/types/api';
import { obterMensagemErro } from '@/utils/errorHelper';
import { alertaService } from '../services/alertaService';
import { alertasStore, reconhecimentos } from '../store/alertasStore';
import { EstadoAlertas } from '../store/criarAlertasStore';
import { contarCriticosNaoReconhecidos } from '../helpers/apresentacao';
import { ConsultaAlertas, FiltrosAlertas, montarQuery } from '../helpers/filtros';
import { PaginaAlertas } from '../types/alerta';

/** Alertas em aberto, mantidos pelo hub e pelas recargas. */
export function useAlertasAbertos(): EstadoAlertas {
  return useSyncExternalStore(alertasStore.subscribe, alertasStore.obterEstado);
}

/** Liga o store de alertas (hub, foco e primeira carga) enquanto o painel estiver aberto. */
export function useIniciarAlertas(): void {
  useEffect(() => alertasStore.iniciar(), []);
}

export function useReconhecidos(): ReadonlySet<string> {
  return useSyncExternalStore(reconhecimentos.subscribe, reconhecimentos.obterReconhecidos);
}

/** Críticos em aberto ainda não reconhecidos: contador do menu e da aba. */
export function useCriticosNaoReconhecidos(): number {
  const { abertos } = useAlertasAbertos();
  const reconhecidos = useReconhecidos();
  return useMemo(() => contarCriticosNaoReconhecidos(abertos, reconhecidos), [abertos, reconhecidos]);
}

export interface HistoricoAlertas {
  pagina: PaginaAlertas | null;
  carregando: boolean;
  erro: string | null;
  /** O backend respondeu 404: não tem `/api/alertas`. */
  indisponivel: boolean;
  recarregar: () => void;
}

/**
 * Página do histórico para os filtros dados. Refaz a consulta quando os
 * filtros mudam e quando o conjunto de alertas em aberto muda (um
 * encerramento ou uma abertura altera o histórico).
 */
export function useHistoricoAlertas(consulta: ConsultaAlertas | FiltrosAlertas, ativo = true): HistoricoAlertas {
  const chave = montarQuery(consulta);
  const { abertos } = useAlertasAbertos();
  const assinaturaAbertos = abertos.map((alerta) => alerta.id).join(',');
  const [estado, setEstado] = useState<Omit<HistoricoAlertas, 'recarregar'>>({
    pagina: null,
    carregando: ativo,
    erro: null,
    indisponivel: false,
  });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!ativo) return;
    let cancelado = false;
    // O estado de carregamento acompanha a consulta, que é externa ao React.
    // oxlint-disable-next-line react/set-state-in-effect
    setEstado((atual) => ({ ...atual, carregando: true, erro: null }));
    alertaService
      .listar(consulta)
      .then((pagina) => {
        if (!cancelado) setEstado({ pagina, carregando: false, erro: null, indisponivel: false });
      })
      .catch((error: unknown) => {
        if (cancelado) return;
        const indisponivel = error instanceof ApiRequestError && error.status === 404;
        setEstado((atual) => ({
          pagina: indisponivel ? null : atual.pagina,
          carregando: false,
          erro: indisponivel ? null : obterMensagemErro(error, 'Não foi possível carregar o histórico de alertas.'),
          indisponivel,
        }));
      });
    return () => {
      cancelado = true;
    };
    // A consulta é identificada pela `chave`; o objeto muda de identidade a cada render.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, assinaturaAbertos, tentativa, ativo]);

  const recarregar = useCallback(() => setTentativa((n) => n + 1), []);
  return { ...estado, recarregar };
}
