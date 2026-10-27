import {
  NivelSeveridade,
  ResultadoGateRealtime,
} from '@/features/quality-gates/types/qualityGate';
import { SituacaoMotor } from '@/features/telemetria/types/telemetria';

/**
 * Modelo de estados do painel. São três eixos independentes:
 *  1. severidade: vem sempre do backend (Normal, Atencao, AlertaPreditivo, Critico);
 *  2. avaliação: a regra pôde ou não ser avaliada (aguardando amostras, sem regras, sem leitura);
 *  3. dado: frescor e conectividade (ao vivo, atrasado, degradado, offline).
 * Nenhuma função daqui classifica por temperatura.
 */

export const CODIGO_DADOS_INSUFICIENTES = 'DADOS_INSUFICIENTES';

/** Sem lote há mais que isso: o dado está atrasado (3x a cadência de ~10 s). */
export const LIMITE_ATRASO_SEGUNDOS = 30;

/* ---------- Severidade ---------- */

export const RANK_SEVERIDADE: Record<NivelSeveridade, number> = {
  Normal: 0,
  Atencao: 1,
  AlertaPreditivo: 2,
  Critico: 3,
};

export function ehSeveridadeAnormal(severidade: NivelSeveridade | null | undefined): boolean {
  return Boolean(severidade) && severidade !== 'Normal';
}

/** A maior severidade da lista; ignora ausentes. Retorna null se não houver nenhuma. */
export function maiorSeveridade(
  severidades: Array<NivelSeveridade | null | undefined>
): NivelSeveridade | null {
  let maior: NivelSeveridade | null = null;
  for (const severidade of severidades) {
    if (!severidade) continue;
    if (maior === null || RANK_SEVERIDADE[severidade] > RANK_SEVERIDADE[maior]) {
      maior = severidade;
    }
  }
  return maior;
}

/* ---------- Avaliação ---------- */

export type EstadoResultado = 'aguardando-amostras' | 'avaliado';
export type EstadoAvaliacao = 'sem-leitura' | 'sem-regras' | 'aguardando-amostras' | 'avaliada';

/**
 * `DADOS_INSUFICIENTES` ou `metadados.avaliacaoConcluida === false`: faltam
 * amostras. A severidade `Normal` desse resultado só preserva o enum, não
 * atesta normalidade.
 */
export function estadoResultado(resultado: ResultadoGateRealtime): EstadoResultado {
  const incompleto =
    resultado.codigoRegra === CODIGO_DADOS_INSUFICIENTES ||
    resultado.metadados?.avaliacaoConcluida === false;
  return incompleto ? 'aguardando-amostras' : 'avaliado';
}

/** Estado de avaliação de uma lista de resultados (uma escova ou o motor todo). */
export function estadoAvaliacao(
  resultados: ResultadoGateRealtime[] | null | undefined,
  temLeitura = true
): EstadoAvaliacao {
  if (!temLeitura) return 'sem-leitura';
  const lista = Array.isArray(resultados) ? resultados : [];
  if (lista.length === 0) return 'sem-regras';
  if (lista.every((r) => estadoResultado(r) === 'aguardando-amostras')) {
    return 'aguardando-amostras';
  }
  return 'avaliada';
}

/**
 * Maior severidade entre os resultados efetivamente avaliados.
 * Retorna null quando não há nenhum (sem regras ou só aguardando amostras).
 */
export function consolidarSeveridade(
  resultados: ResultadoGateRealtime[] | null | undefined
): NivelSeveridade | null {
  const lista = Array.isArray(resultados) ? resultados : [];
  return maiorSeveridade(
    lista.filter((r) => estadoResultado(r) === 'avaliado').map((r) => r.severidade)
  );
}

/* ---------- Dado (frescor e conectividade) ---------- */

export type Frescor = 'ao-vivo' | 'atrasado' | 'sem-leitura';
export type EstadoDado = 'ao-vivo' | 'atrasado' | 'degradado' | 'offline' | 'sem-leitura';

/** Idade em segundos de um instante ISO; null se ausente ou inválido. */
export function idadeEmSegundos(dataHora: string | null | undefined, agora: number): number | null {
  if (!dataHora) return null;
  const instante = Date.parse(dataHora);
  if (Number.isNaN(instante)) return null;
  return Math.max(0, (agora - instante) / 1000);
}

/** Ao vivo: último lote há menos de 30 s. Atrasado: 30 s ou mais. */
export function frescor(dataHora: string | null | undefined, agora: number): Frescor {
  const idade = idadeEmSegundos(dataHora, agora);
  if (idade === null) return 'sem-leitura';
  return idade < LIMITE_ATRASO_SEGUNDOS ? 'ao-vivo' : 'atrasado';
}

/**
 * Combina o frescor local com a `situacao` do backend. Degradado e Offline
 * vêm do servidor; o atraso entre 30 s e o limite de offline é local.
 */
export function estadoDado(
  ultimoLoteEm: string | null | undefined,
  situacao: SituacaoMotor | null | undefined,
  agora: number
): EstadoDado {
  const base = frescor(ultimoLoteEm, agora);
  if (base === 'sem-leitura') return 'sem-leitura';
  if (situacao === 'Offline') return 'offline';
  if (situacao === 'Degradado') return 'degradado';
  return base;
}

/** Dado que merece o aviso "desatualizado" (silêncio não é normalidade). */
export function estaDesatualizado(dado: EstadoDado): boolean {
  return dado === 'atrasado' || dado === 'offline';
}

/* ---------- Estado principal (ordenação e filtros da visão geral) ---------- */

export type EstadoPrincipal =
  | NivelSeveridade
  | 'offline'
  | 'degradado'
  | 'aguardando-amostras'
  | 'sem-regras'
  | 'sem-leitura';

/** Maior = mais urgente. Crítico > Alerta > Atenção > Offline > Degradado > Aguardando > Sem regras > Sem leitura > Normal. */
export const PRIORIDADE_ESTADO: Record<EstadoPrincipal, number> = {
  Critico: 9,
  AlertaPreditivo: 8,
  Atencao: 7,
  offline: 6,
  degradado: 5,
  'aguardando-amostras': 4,
  'sem-regras': 3,
  'sem-leitura': 2,
  Normal: 1,
};

/**
 * Severidade anormal sempre prevalece (inclusive em dado desatualizado: era
 * crítico e continua crítico). Sem severidade anormal, a falta de dado e depois
 * a falta de avaliação explicam por que o motor não está "Normal".
 */
export function estadoPrincipal(
  severidade: NivelSeveridade | null,
  avaliacao: EstadoAvaliacao,
  dado: EstadoDado
): EstadoPrincipal {
  if (ehSeveridadeAnormal(severidade)) return severidade as NivelSeveridade;
  if (dado === 'offline') return 'offline';
  if (dado === 'degradado') return 'degradado';
  if (avaliacao === 'sem-leitura' || dado === 'sem-leitura') return 'sem-leitura';
  if (avaliacao === 'aguardando-amostras') return 'aguardando-amostras';
  if (avaliacao === 'sem-regras') return 'sem-regras';
  return 'Normal';
}

export function compararPorUrgencia(a: EstadoPrincipal, b: EstadoPrincipal): number {
  return PRIORIDADE_ESTADO[b] - PRIORIDADE_ESTADO[a];
}
