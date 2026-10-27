import { descreverMotivo } from '@/features/telemetria/helpers/linhaMotor';
import { TEMA_ESTADO } from '@/features/telemetria/helpers/apresentacao';
import { EstadoPrincipal } from '@/features/telemetria/helpers/estadoHelper';
import { EventoSessao } from './transicoes';

/** Estado visual de uma ponta da transição; Online não tem símbolo de alerta. */
export function estadoDaPonta(evento: Pick<EventoSessao, 'tipo'>, valor: string | null): EstadoPrincipal | 'online' | null {
  if (valor === null) return null;
  if (evento.tipo === 'situacao') {
    if (valor === 'Offline') return 'offline';
    if (valor === 'Degradado') return 'degradado';
    return 'online';
  }
  return valor in TEMA_ESTADO ? (valor as EstadoPrincipal) : 'SemClassificacao';
}

export function rotuloDaPonta(evento: Pick<EventoSessao, 'tipo'>, valor: string | null): string {
  const estado = estadoDaPonta(evento, valor);
  if (estado === null) return 'Sem avaliação';
  if (estado === 'online') return 'Online';
  return TEMA_ESTADO[estado].label;
}

/** "Normal → Crítico" para ler em voz alta ou em uma linha. */
export function descreverTransicao(evento: EventoSessao): string {
  return `${rotuloDaPonta(evento, evento.de)} → ${rotuloDaPonta(evento, evento.para)}`;
}

/**
 * Frase curta de uma transição (o quê, onde, quanto), para toast e leitor de
 * tela: "Escova 2 de Motor C: limite de temperatura, 96,1 °C ≥ 95 °C".
 */
export function frasearEvento(evento: EventoSessao, nomeMotor: string): string {
  if (evento.tipo === 'situacao') return `${nomeMotor}: ${descreverTransicao(evento)}`;
  const regra = evento.evidencia;
  if (!regra) {
    const onde = evento.numeroEscova !== null ? `escova ${evento.numeroEscova} de ${nomeMotor}` : nomeMotor;
    return `${onde[0].toUpperCase()}${onde.slice(1)}: ${rotuloDaPonta(evento, evento.para).toLowerCase()}`;
  }
  return descreverMotivo(
    {
      numeroEscova: evento.numeroEscova ?? 0,
      nomeRegra: regra.nomeRegra,
      tipoRegra: regra.tipoRegra,
      codigoRegra: '',
      valorObservado: regra.valor,
      valorLimite: regra.limite,
      mensagemDiagnostico: null,
    },
    nomeMotor
  );
}
