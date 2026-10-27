import { normalizarSeveridade } from '@/features/telemetria/helpers/normalizacao';
import { obterTipoRegra } from '@/features/quality-gates/helpers/tiposRegra';
import { AlertaManutencao, PaginaAlertas } from '../types/alerta';

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : '');
const numeroOuNulo = (valor: unknown): number | null =>
  typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
const textoOuNulo = (valor: unknown): string | null =>
  typeof valor === 'string' && valor !== '' ? valor : null;

/**
 * Alerta do backend para o modelo do painel. Severidade desconhecida vira
 * "Sem classificação"; categoria desconhecida é mantida como veio (ou, se
 * ausente, deduzida do tipo da regra). Sem `id` ou `motorId` o item é inútil
 * e vira null, sem derrubar a lista.
 */
export function normalizarAlerta(bruto: unknown): AlertaManutencao | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const b = bruto as Record<string, unknown>;
  const id = numeroOuNulo(b.id);
  const motorId = numeroOuNulo(b.motorId);
  if (id === null || motorId === null) return null;

  const tipoRegra = texto(b.tipoRegra);
  const resolvidoEm = textoOuNulo(b.resolvidoEm);
  const iniciadoEm = texto(b.iniciadoEm);
  return {
    id,
    motorId,
    sensorId: textoOuNulo(b.sensorId),
    numeroEscova: numeroOuNulo(b.numeroEscova),
    regraQualidadeId: textoOuNulo(b.regraQualidadeId),
    nomeRegra: texto(b.nomeRegra),
    tipoRegra,
    categoria: textoOuNulo(b.categoria) ?? obterTipoRegra(tipoRegra).categoria ?? '',
    codigoRegra: texto(b.codigoRegra),
    severidade: normalizarSeveridade(b.severidade),
    valorObservado: numeroOuNulo(b.valorObservado),
    valorLimite: numeroOuNulo(b.valorLimite),
    mensagem: texto(b.mensagem),
    iniciadoEm,
    atualizadoEm: textoOuNulo(b.atualizadoEm) ?? iniciadoEm,
    resolvidoEm,
    ativo: typeof b.ativo === 'boolean' ? b.ativo : resolvidoEm === null,
  };
}

export function normalizarPagina(bruto: unknown): PaginaAlertas {
  const b = (typeof bruto === 'object' && bruto !== null ? bruto : {}) as Record<string, unknown>;
  const itens = (Array.isArray(b.itens) ? b.itens : [])
    .map(normalizarAlerta)
    .filter((alerta): alerta is AlertaManutencao => alerta !== null);
  return {
    itens,
    pagina: numeroOuNulo(b.pagina) ?? 1,
    tamanho: numeroOuNulo(b.tamanho) ?? itens.length,
    total: numeroOuNulo(b.total) ?? itens.length,
  };
}
