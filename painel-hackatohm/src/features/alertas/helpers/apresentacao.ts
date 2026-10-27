import { ToastEntrada } from '@/components/ui/toastContext';
import {
  ehCategoriaRegra,
  ehPrevisao,
  ROTULO_CATEGORIA,
} from '@/features/quality-gates/helpers/tiposRegra';
import { RANK_SEVERIDADE } from '@/features/telemetria/helpers/estadoHelper';
import { descreverMotivo } from '@/features/telemetria/helpers/linhaMotor';
import { fraseCurtaPrevisao } from '@/features/telemetria/helpers/previsao';
import { formatarDuracaoMinutos } from '@/utils/tempo';
import { AlertaManutencao } from '../types/alerta';

/** Categoria por extenso; uma categoria que o painel não conhece aparece como veio do backend. */
export function rotuloCategoria(categoria: string): string {
  if (ehCategoriaRegra(categoria)) return ROTULO_CATEGORIA[categoria];
  return categoria || 'Sem categoria';
}

/** "Motor inteiro" quando a escova é nula (assimetria); senão "Escova 2". */
export function escopoDoAlerta(alerta: Pick<AlertaManutencao, 'numeroEscova'>): string {
  return alerta.numeroEscova === null ? 'Motor inteiro' : `Escova ${alerta.numeroEscova}`;
}

/**
 * Mais grave primeiro; na mesma severidade, o mais recente. A ordem da lista
 * em aberto é por severidade e depois por `iniciadoEm`.
 */
export function ordenarAlertas<T extends Pick<AlertaManutencao, 'severidade' | 'iniciadoEm' | 'id'>>(lista: T[]): T[] {
  return [...lista].sort(
    (a, b) =>
      RANK_SEVERIDADE[b.severidade] - RANK_SEVERIDADE[a.severidade] ||
      Date.parse(b.iniciadoEm) - Date.parse(a.iniciadoEm) ||
      b.id - a.id
  );
}

/**
 * A mensagem do backend traz a temperatura limite da previsão com ponto
 * decimal ("atingir 95.0 °C em ~8 min"). O alerta não tem esse campo
 * estruturado, então o painel lê só o número para montar o próprio texto.
 */
export function limiteDaMensagem(mensagem: string | null | undefined): number | null {
  const achado = /atingir\s+(-?[0-9]+(?:[.,][0-9]+)?)\s*°C/i.exec(mensagem ?? '');
  if (!achado) return null;
  const valor = Number(achado[1].replace(',', '.'));
  return Number.isFinite(valor) ? valor : null;
}

/**
 * Texto principal do alerta (o quê, onde, quanto), montado pelo painel para
 * manter a vírgula decimal e a unidade do tipo: "Escova 2 de Motor C: limite
 * de temperatura, 96,1 °C ≥ 95 °C". A mensagem do backend fica como detalhe.
 */
export function descreverAlerta(alerta: AlertaManutencao, nomeMotor: string): string {
  const previsao =
    ehPrevisao(alerta.tipoRegra) && alerta.valorObservado !== null
      ? { minutos: alerta.valorObservado, limiteC: limiteDaMensagem(alerta.mensagem) }
      : null;
  return descreverMotivo(
    {
      numeroEscova: alerta.numeroEscova ?? 0,
      nomeRegra: alerta.nomeRegra,
      tipoRegra: alerta.tipoRegra,
      codigoRegra: alerta.codigoRegra,
      valorObservado: alerta.valorObservado,
      valorLimite: alerta.valorLimite,
      mensagemDiagnostico: null,
    },
    nomeMotor,
    previsao && previsao.limiteC !== null ? { minutos: previsao.minutos, limiteC: previsao.limiteC } : null
  );
}

/** "aberto há 12 min" para o alerta em aberto, "durou 4 min" para o encerrado. */
export function descreverDuracao(alerta: Pick<AlertaManutencao, 'iniciadoEm' | 'resolvidoEm' | 'ativo'>, agora: number): string {
  const inicio = Date.parse(alerta.iniciadoEm);
  if (Number.isNaN(inicio)) return '—';
  const fim = alerta.ativo || !alerta.resolvidoEm ? agora : Date.parse(alerta.resolvidoEm);
  if (Number.isNaN(fim)) return '—';
  const minutos = Math.max(0, (fim - inicio) / 60_000);
  const duracao = formatarDuracaoMinutos(minutos);
  return alerta.ativo ? `aberto há ${duracao}` : `durou ${duracao}`;
}

/**
 * Aviso que um alerta novo (ou que subiu de severidade) merece, ou null:
 *  - Crítico: toast crítico, que fica até ser dispensado;
 *  - preditivo (previsão por tendência) que não é crítico: toast discreto
 *    "Previsão: Motor A, escova 2 → 95 °C em ~8 min";
 *  - o resto aparece na lista, sem aviso.
 */
export function decidirAviso(
  alerta: AlertaManutencao,
  nomeMotor: string,
  abrirMotor: () => void
): ToastEntrada | null {
  const acao = { rotulo: 'Abrir o motor', aoClicar: abrirMotor };
  if (alerta.severidade === 'Critico') {
    return {
      tom: 'critico',
      titulo: `${nomeMotor} ficou crítico`,
      mensagem: descreverAlerta(alerta, nomeMotor),
      acao,
    };
  }
  if (alerta.categoria === 'Preditivo') {
    const limiteC = limiteDaMensagem(alerta.mensagem);
    const alvo =
      alerta.valorObservado !== null && limiteC !== null
        ? fraseCurtaPrevisao(alerta.numeroEscova, { minutos: alerta.valorObservado, limiteC })
        : null;
    const escova = alerta.numeroEscova === null ? '' : `, escova ${alerta.numeroEscova}`;
    const texto = alvo
      ? `Previsão: ${nomeMotor}, ${alvo.charAt(0).toLowerCase()}${alvo.slice(1)}`
      : `Previsão: ${nomeMotor}${escova} tende a atingir o limite`;
    return { tom: 'info', titulo: texto, acao };
  }
  return null;
}

/** Alertas críticos em aberto que ainda não foram reconhecidos neste navegador. */
export function contarCriticosNaoReconhecidos(
  abertos: AlertaManutencao[],
  reconhecidos: ReadonlySet<string>
): number {
  return abertos.reduce(
    (n, alerta) => n + (alerta.ativo && alerta.severidade === 'Critico' && !reconhecidos.has(chaveDoAlerta(alerta)) ? 1 : 0),
    0
  );
}

/** `id@iniciadoEm`: se o banco do backend for recriado e os ids repetirem, o início distingue o alerta. */
export function chaveDoAlerta(alerta: Pick<AlertaManutencao, 'id' | 'iniciadoEm'>): string {
  return `${alerta.id}@${alerta.iniciadoEm}`;
}
