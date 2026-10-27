import { EventoSessao } from './transicoes';

export type PontaEvento = 'online' | 'degradado' | 'offline' | 'hub-conectado' | 'hub-reconectando' | 'hub-desconectado';

const ROTULO: Record<PontaEvento, string> = {
  online: 'Online',
  degradado: 'Degradado',
  offline: 'Offline',
  'hub-conectado': 'Hub conectado',
  'hub-reconectando': 'Reconectando',
  'hub-desconectado': 'Sem conexão',
};

/** Estado visual de uma ponta da transição; null quando não havia estado anterior. */
export function estadoDaPonta(evento: Pick<EventoSessao, 'tipo'>, valor: string | null): PontaEvento | null {
  if (valor === null) return null;
  if (evento.tipo === 'hub') {
    if (valor === 'conectado') return 'hub-conectado';
    return valor === 'desconectado' ? 'hub-desconectado' : 'hub-reconectando';
  }
  if (valor === 'Offline') return 'offline';
  return valor === 'Degradado' ? 'degradado' : 'online';
}

export function rotuloDaPonta(evento: Pick<EventoSessao, 'tipo'>, valor: string | null): string {
  const estado = estadoDaPonta(evento, valor);
  return estado === null ? 'Sem informação' : ROTULO[estado];
}

/** "Online → Offline" para ler em voz alta ou em uma linha. */
export function descreverTransicao(evento: EventoSessao): string {
  if (evento.tipo === 'hub') {
    return evento.para === 'conectado' ? 'Conexão com o servidor restabelecida' : `Conexão com o servidor perdida (${rotuloDaPonta(evento, evento.para)})`;
  }
  return `${rotuloDaPonta(evento, evento.de)} → ${rotuloDaPonta(evento, evento.para)}`;
}
