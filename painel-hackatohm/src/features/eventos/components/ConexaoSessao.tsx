import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CircleSlash2, Wifi, WifiOff } from 'lucide-react';
import { useMonitoramento } from '@/hooks/useMonitoramento';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatarHora } from '@/features/telemetria/helpers/statusHelper';
import { descreverTransicao, estadoDaPonta, PontaEvento, rotuloDaPonta } from '../helpers/apresentacao';
import { EventoSessao } from '../helpers/transicoes';
import { LIMITE_EVENTOS } from '../store/criarRegistroEventos';
import { useEventosSessao } from '../hooks/useEventos';

const COR_NEUTRA = 'var(--color-ink-2)';
const COR_SEM_DADO = 'var(--color-data-off)';

/** Uma ponta da transição: símbolo + texto, nunca só cor. */
const Ponta: React.FC<{ evento: EventoSessao; valor: string | null }> = ({ evento, valor }) => {
  const estado: PontaEvento | null = estadoDaPonta(evento, valor);
  const texto = rotuloDaPonta(evento, valor);
  const icone = (Icone: typeof Wifi, cor: string) => <Icone width={14} height={14} aria-hidden="true" style={{ color: cor }} />;
  let marca: React.ReactNode = null;
  if (estado === 'online' || estado === 'hub-conectado') marca = icone(Wifi, COR_NEUTRA);
  else if (estado === 'offline' || estado === 'hub-desconectado') marca = icone(WifiOff, COR_SEM_DADO);
  else if (estado === 'degradado') marca = icone(CircleSlash2, COR_SEM_DADO);
  else if (estado === 'hub-reconectando') marca = icone(WifiOff, 'var(--color-sev-atencao)');
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      style={{ color: estado === 'hub-reconectando' ? 'var(--color-sev-atencao)' : COR_NEUTRA }}
    >
      {marca}
      {texto}
    </span>
  );
};

/**
 * Registro de conexão desta sessão: situação do motor (Online, Degradado,
 * Offline) e quedas do hub. É o que o servidor não registra; severidade e
 * alertas ficam na lista de alertas. Em memória: some ao recarregar a página.
 */
export const ConexaoSessao: React.FC = () => {
  const { eventos } = useEventosSessao();
  const { motores } = useMonitoramento();
  const nomes = useMemo(() => new Map(motores.map((m) => [m.id, m.nome])), [motores]);
  const nomeDe = (id: number) => nomes.get(id) ?? `Motor ${id}`;

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-[15px] text-ink-2">
        Vale só para esta sessão do navegador: fica em memória, guarda as últimas {LIMITE_EVENTOS} mudanças e some ao
        recarregar a página. Mostra a conexão do motor (Online, Degradado ou Offline) e as quedas do servidor, que os
        alertas não registram.
      </p>

      {eventos.length === 0 ? (
        <EmptyState
          title="Conexão estável desde que a página abriu"
          description="Só mudanças aparecem aqui. Leituras repetidas no mesmo estado não geram registro."
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-panel">
          <table className="w-full border-collapse text-left text-[14px]">
            <caption className="sr-only">
              Mudanças de conexão desta sessão, da mais recente para a mais antiga
            </caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="eyebrow px-4 py-3 font-medium sm:px-5">
                  Hora
                </th>
                <th scope="col" className="eyebrow px-4 py-3 font-medium sm:px-5">
                  Onde
                </th>
                <th scope="col" className="eyebrow px-4 py-3 font-medium sm:px-5">
                  Mudança
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {eventos.map((evento) => (
                <tr key={evento.id}>
                  <td className="num whitespace-nowrap px-4 py-3 align-top text-ink-2 sm:px-5">
                    {formatarHora(new Date(evento.em).toISOString())}
                  </td>
                  <td className="px-4 py-3 align-top sm:px-5">
                    {evento.motorId === null ? (
                      <span className="text-ink-2">Servidor</span>
                    ) : (
                      <Link
                        to={`/motores/${evento.motorId}`}
                        className="rounded-sm text-ink underline-offset-2 hover:underline"
                      >
                        {nomeDe(evento.motorId)}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top sm:px-5">
                    <span className="sr-only">{descreverTransicao(evento)}</span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5" aria-hidden="true">
                      {evento.tipo === 'hub' ? (
                        <Ponta evento={evento} valor={evento.para} />
                      ) : (
                        <>
                          <Ponta evento={evento} valor={evento.de} />
                          <span className="text-ink-3">→</span>
                          <Ponta evento={evento} valor={evento.para} />
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
