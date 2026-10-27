import { ehPrevisao } from '@/features/quality-gates/helpers/tiposRegra';
import { NivelSeveridade, ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { formatarHorarioPrevisto, formatarMinutos } from '@/utils/tempo';
import { MotorTelemetria } from '../store/tipos';
import { estadoResultado } from './estadoHelper';

/**
 * Previsão por tendência, lida do resultado do gate. A estimativa vem do
 * backend (`valorObservado` em minutos, `metadados` com a inclinação e a
 * temperatura limite): o painel nunca ajusta reta nem classifica.
 */
export interface Previsao {
  /** Minutos estimados até o limite; 0 = a reta já passou dele. */
  minutos: number;
  /** Horizonte atingido (`aviso` ou `critico`), em minutos; null se o backend não mandou. */
  horizonte: number | null;
  /** Temperatura limite, em °C. */
  limiteC: number;
  /** Inclinação da reta, em °C por minuto (positiva). */
  inclinacao: number;
  /** Leituras usadas no ajuste; null se o backend não mandou. */
  amostras: number | null;
}

const numeroFinito = (valor: unknown): number | null =>
  typeof valor === 'number' && Number.isFinite(valor) ? valor : null;

/**
 * Previsão do resultado de um gate de tendência, ou null quando não há
 * estimativa: outro tipo, aguardando amostras, Normal (o backend não manda
 * valores) ou metadados ausentes e inválidos.
 */
export function lerPrevisao(gate: ResultadoGateRealtime): Previsao | null {
  if (!ehPrevisao(gate.tipoRegra)) return null;
  if (estadoResultado(gate) === 'aguardando-amostras') return null;
  const minutos = numeroFinito(gate.valorObservado);
  const meta = gate.metadados;
  if (minutos === null || minutos < 0 || !meta) return null;
  const inclinacao = numeroFinito(meta.inclinacaoCelsiusPorMinuto);
  const limiteC = numeroFinito(meta.temperaturaLimite);
  if (inclinacao === null || inclinacao <= 0 || limiteC === null) return null;
  return {
    minutos,
    horizonte: numeroFinito(gate.valorLimite),
    limiteC,
    inclinacao,
    amostras: numeroFinito(meta.amostras),
  };
}

/** Previsão ativa de uma escova: o gate disparou e o backend mandou a estimativa. */
export interface PrevisaoDaEscova {
  numeroEscova: number;
  previsao: Previsao;
  severidade: NivelSeveridade;
  /** `dataHora` do lote que originou a estimativa (âncora do horário previsto). */
  dataHora: string;
}

/**
 * Previsões ativas das escovas, da menor para a maior espera (a mais urgente
 * primeiro). Só entra o que a última leitura de cada escova traz.
 */
export function previsoesDoMotor(escovas: MotorTelemetria['escovas'] | undefined): PrevisaoDaEscova[] {
  const lista: PrevisaoDaEscova[] = [];
  for (const serie of Object.values(escovas ?? {})) {
    const leitura = serie.ultima;
    if (!leitura) continue;
    for (const gate of leitura.resultadosQualityGates) {
      if (!gate.disparouAlerta) continue;
      const previsao = lerPrevisao(gate);
      if (previsao) {
        lista.push({
          numeroEscova: leitura.numeroEscova,
          previsao,
          severidade: gate.severidade,
          dataHora: leitura.dataHora,
        });
      }
    }
  }
  return lista.sort((a, b) => a.previsao.minutos - b.previsao.minutos || a.numeroEscova - b.numeroEscova);
}

/** "2,1" ou "0,04": a inclinação pode ser pequena, então até duas casas. */
export function formatarInclinacao(inclinacao: number): string {
  return inclinacao.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

/** Texto da temperatura limite: "95 °C" (sem casa decimal inútil). */
export function formatarLimitePrevisto(limiteC: number): string {
  return `${limiteC.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} °C`;
}

/** "Escova 2 → 95 °C em ~8 min" (ou "agora"): a frase curta do modo TV, da linha do motor e dos avisos. */
export function fraseCurtaPrevisao(numeroEscova: number | null, previsao: Pick<Previsao, 'minutos' | 'limiteC'>): string {
  const quando = previsao.minutos === 0 ? 'agora' : `em ${formatarMinutos(previsao.minutos)}`;
  const alvo = `${formatarLimitePrevisto(previsao.limiteC)} ${quando}`;
  return numeroEscova === null ? alvo : `Escova ${numeroEscova} → ${alvo}`;
}

/**
 * Frase do cartão "Previsão": "Escova 2 deve atingir 95 °C às ≈ 14:38 (~8 min) ·
 * subindo 2,1 °C/min · 12 leituras". Com 0 minutos não há horário a prever.
 */
export function fraseCompletaPrevisao(item: PrevisaoDaEscova, fusoHorario?: string): string {
  const { previsao } = item;
  const horario = previsao.minutos > 0 ? formatarHorarioPrevisto(item.dataHora, previsao.minutos, fusoHorario) : null;
  const quando =
    previsao.minutos === 0
      ? 'agora'
      : horario
        ? `às ≈ ${horario} (${formatarMinutos(previsao.minutos)})`
        : `em ${formatarMinutos(previsao.minutos)}`;
  const partes = [
    `Escova ${item.numeroEscova} deve atingir ${formatarLimitePrevisto(previsao.limiteC)} ${quando}`,
    `subindo ${formatarInclinacao(previsao.inclinacao)} °C/min`,
  ];
  if (previsao.amostras !== null) partes.push(`${previsao.amostras} leituras`);
  return partes.join(' · ');
}
