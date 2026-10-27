import { LIMITE_ATRASO_SEGUNDOS } from '@/features/telemetria/helpers/estadoHelper';
import type { StatusConexaoHub } from '@/features/telemetria/services/signalrService';
import { itemDeSaude, ResultadoSaude } from './saude';

export type EstadoEstagio = 'ok' | 'atencao' | 'falha' | 'desconhecido';

export type IdEstagio = 'esp' | 'api' | 'fila' | 'banco' | 'hub' | 'painel';

export interface EstagioPipeline {
  id: IdEstagio;
  nome: string;
  /** Uma linha: o que esta etapa faz. */
  explicacao: string;
  estado: EstadoEstagio;
  /** O que foi observado (ou por que não dá para saber). */
  detalhe: string;
}

export const ROTULO_ESTAGIO: Record<EstadoEstagio, string> = {
  ok: 'Operando',
  atencao: 'Atenção',
  falha: 'Com falha',
  desconhecido: 'Não verificado',
};

/** Sem lote há tanto tempo o backend já considera o ESP offline (`Telemetria:OfflineAfterSeconds`). */
const LIMITE_OFFLINE_SEGUNDOS = 120;

export interface EntradaPipeline {
  live: ResultadoSaude | null;
  ready: ResultadoSaude | null;
  hub: StatusConexaoHub;
  /** Idade do lote mais recente entre todos os motores; null = nenhum lote. */
  idadeUltimoLoteSegundos: number | null;
  lotesNaSessao: number;
}

function estadoDe(saude: ResultadoSaude['estado']): EstadoEstagio {
  return saude === 'saudavel' ? 'ok' : saude === 'degradado' ? 'atencao' : 'falha';
}

function segundos(valor: number): string {
  return valor < 60 ? `${Math.round(valor)} s` : `${Math.floor(valor / 60)} min`;
}

/**
 * Estado de cada etapa do caminho ESP → API → Fila → Banco → Hub → Painel.
 * Etapa que o painel não consegue observar fica "Não verificado": ausência de
 * informação nunca vira verde.
 */
export function montarPipeline(e: EntradaPipeline): EstagioPipeline[] {
  const { live, ready } = e;
  const apiRespondeu = live !== null && live.httpStatus !== null;

  const esp = ((): Pick<EstagioPipeline, 'estado' | 'detalhe'> => {
    const idade = e.idadeUltimoLoteSegundos;
    if (idade === null) return { estado: 'desconhecido', detalhe: 'Nenhum lote recebido nesta sessão.' };
    if (idade < LIMITE_ATRASO_SEGUNDOS) return { estado: 'ok', detalhe: `Último lote há ${segundos(idade)}.` };
    if (idade < LIMITE_OFFLINE_SEGUNDOS) return { estado: 'atencao', detalhe: `Sem lote há ${segundos(idade)}.` };
    return { estado: 'falha', detalhe: `Sem lote há ${segundos(idade)}.` };
  })();

  const api = ((): Pick<EstagioPipeline, 'estado' | 'detalhe'> => {
    if (live === null) return { estado: 'desconhecido', detalhe: 'Consultando…' };
    if (!apiRespondeu) return { estado: 'falha', detalhe: 'A API não respondeu.' };
    return { estado: 'ok', detalhe: `Respondeu (HTTP ${live.httpStatus}).` };
  })();

  const fila = ((): Pick<EstagioPipeline, 'estado' | 'detalhe'> => {
    if (!apiRespondeu) return { estado: 'desconhecido', detalhe: 'Depende da resposta da API.' };
    const item = itemDeSaude(live, 'queue') ?? itemDeSaude(live, 'fila');
    const estado = estadoDe((item ?? live!).estado);
    const detalhe =
      item?.descricao ??
      (estado === 'ok' ? 'Dentro da capacidade.' : estado === 'atencao' ? 'Perto da capacidade máxima.' : 'Indisponível.');
    return { estado, detalhe };
  })();

  const banco = ((): Pick<EstagioPipeline, 'estado' | 'detalhe'> => {
    if (ready === null || ready.httpStatus === null) {
      return { estado: 'desconhecido', detalhe: 'Depende da resposta da API.' };
    }
    const item = itemDeSaude(ready, 'postgres') ?? itemDeSaude(ready, 'banco');
    if (item) return { estado: estadoDe(item.estado), detalhe: item.descricao ?? 'Conexão verificada.' };
    // Texto puro: só "indisponível" aponta o banco (a fila apenas degrada).
    return ready.estado === 'indisponivel'
      ? { estado: 'falha', detalhe: 'Não foi possível conectar ao PostgreSQL.' }
      : { estado: 'ok', detalhe: 'Conexão verificada.' };
  })();

  const hub = ((): Pick<EstagioPipeline, 'estado' | 'detalhe'> => {
    switch (e.hub) {
      case 'conectado':
        return { estado: 'ok', detalhe: 'Conectado.' };
      case 'conectando':
        return { estado: 'atencao', detalhe: 'Conectando…' };
      case 'reconectando':
        return { estado: 'atencao', detalhe: 'Reconectando…' };
      default:
        return { estado: 'falha', detalhe: 'Sem conexão com o hub.' };
    }
  })();

  const painel = ((): Pick<EstagioPipeline, 'estado' | 'detalhe'> => {
    if (e.hub !== 'conectado') return { estado: 'atencao', detalhe: 'Sem eventos ao vivo.' };
    if (e.lotesNaSessao === 0) return { estado: 'atencao', detalhe: 'Ainda sem lotes.' };
    return { estado: 'ok', detalhe: `${e.lotesNaSessao} ${e.lotesNaSessao === 1 ? 'lote' : 'lotes'} nesta sessão.` };
  })();

  return [
    { id: 'esp', nome: 'ESP', explicacao: 'Lê a temperatura das escovas e envia um lote a cada ~10 s.', ...esp },
    { id: 'api', nome: 'API', explicacao: 'Recebe o lote, confere o cadastro e responde ao ESP.', ...api },
    { id: 'fila', nome: 'Fila', explicacao: 'Guarda os lotes em memória até serem processados.', ...fila },
    { id: 'banco', nome: 'Banco', explicacao: 'PostgreSQL: grava cadastros, regras e leituras.', ...banco },
    { id: 'hub', nome: 'Hub', explicacao: 'SignalR: empurra lotes e status para os painéis abertos.', ...hub },
    { id: 'painel', nome: 'Painel', explicacao: 'Reúne lotes e status e mostra o estado de cada motor.', ...painel },
  ];
}
