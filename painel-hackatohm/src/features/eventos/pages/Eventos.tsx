import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, CircleSlash2, Wifi, WifiOff } from 'lucide-react';
import { useMonitoramento } from '@/hooks/useMonitoramento';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SeveritySymbol } from '@/features/telemetria/components/SeveritySymbol';
import { TEMA_ESTADO } from '@/features/telemetria/helpers/apresentacao';
import { formatarHora } from '@/features/telemetria/helpers/statusHelper';
import { formatarValorGate, obterTipoRegra } from '@/features/quality-gates/helpers/tiposRegra';
import { descreverTransicao, estadoDaPonta, rotuloDaPonta } from '../helpers/apresentacao';
import { contarCriticosNaoVistos, EventoSessao } from '../helpers/transicoes';
import { LIMITE_EVENTOS } from '../store/criarRegistroEventos';
import { registroEventos } from '../store/registroEventos';
import { useEventosSessao } from '../hooks/useEventos';

const CORES_PONTA = {
  online: 'var(--color-ink-2)',
} as const;

/** Uma ponta da transição: símbolo + texto, nunca só cor. */
const Ponta: React.FC<{ evento: EventoSessao; valor: string | null }> = ({ evento, valor }) => {
  const estado = estadoDaPonta(evento, valor);
  const texto = rotuloDaPonta(evento, valor);
  let marca: React.ReactNode = null;
  if (estado === 'online') marca = <Wifi width={14} height={14} aria-hidden="true" style={{ color: CORES_PONTA.online }} />;
  else if (estado === 'offline') marca = <WifiOff width={14} height={14} aria-hidden="true" style={{ color: 'var(--color-data-off)' }} />;
  else if (estado === 'degradado') marca = <CircleSlash2 width={14} height={14} aria-hidden="true" style={{ color: 'var(--color-data-off)' }} />;
  else if (estado !== null) marca = <SeveritySymbol estado={estado} size={14} decorativo />;

  const cor =
    estado !== null && estado !== 'online' && ['Atencao', 'AlertaPreditivo', 'Critico'].includes(estado)
      ? TEMA_ESTADO[estado].color
      : 'var(--color-ink-2)';
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" style={{ color: cor }}>
      {marca}
      {texto}
    </span>
  );
};

function TextoRegra({ evento }: { evento: EventoSessao }) {
  const regra = evento.evidencia;
  if (!regra) return <>—</>;
  return <>{obterTipoRegra(regra.tipoRegra).rotulo}</>;
}

export const Eventos: React.FC = () => {
  const { eventos, vistoAte } = useEventosSessao();
  const { motores } = useMonitoramento();
  const nomes = useMemo(() => new Map(motores.map((m) => [m.id, m.nome])), [motores]);
  const naoVistos = contarCriticosNaoVistos(eventos, vistoAte);
  const temNovos = eventos.some((e) => e.id > vistoAte);
  const nomeDe = (id: number) => nomes.get(id) ?? `Motor ${id}`;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Eventos da sessão</p>
          <h1 className="display mt-2 text-[28px] leading-tight sm:text-[34px]">
            {eventos.length === 0
              ? 'Nenhuma transição nesta sessão'
              : naoVistos > 0
                ? `${naoVistos} ${naoVistos === 1 ? 'crítico não visto' : 'críticos não vistos'}`
                : `${eventos.length} ${eventos.length === 1 ? 'transição' : 'transições'} nesta sessão`}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink-2">
            Este registro vale só para esta sessão do navegador: fica em memória, guarda as últimas{' '}
            {LIMITE_EVENTOS} transições e some ao recarregar a página. O servidor não guarda histórico de eventos.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => registroEventos.marcarComoVisto()}
          disabled={!temNovos}
          className="self-start"
        >
          <CheckCheck className="h-4 w-4" aria-hidden="true" />
          Marcar como visto
        </Button>
      </header>

      {eventos.length === 0 ? (
        <EmptyState
          title="Tudo igual desde que a página abriu"
          description="Só mudanças aparecem aqui: severidade de motor ou escova, e situação Online, Degradado ou Offline. Leituras repetidas no mesmo estado não geram evento."
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-panel">
          <table className="w-full border-collapse text-left text-[14px]">
            <caption className="sr-only">
              Transições de estado desta sessão, da mais recente para a mais antiga
            </caption>
            <thead>
              <tr className="border-b border-line">
                {['Hora', 'Motor', 'Escova', 'Transição'].map((titulo) => (
                  <th key={titulo} scope="col" className="eyebrow px-4 py-3 font-medium sm:px-5">
                    {titulo}
                  </th>
                ))}
                {['Regra', 'Valor', 'Limite'].map((titulo) => (
                  <th key={titulo} scope="col" className="eyebrow hidden px-4 py-3 font-medium md:table-cell">
                    {titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {eventos.map((evento) => {
                const novo = evento.id > vistoAte;
                const regra = evento.evidencia;
                const valor = regra ? formatarValorGate(regra.tipoRegra, regra.valor) : '—';
                const limite = regra ? formatarValorGate(regra.tipoRegra, regra.limite, 'limite') : '—';
                return (
                  <tr key={evento.id} className={novo ? 'bg-raised/40' : undefined}>
                    <td className="num whitespace-nowrap px-4 py-3 align-top text-ink-2 sm:px-5">
                      {novo && (
                        <>
                          <span
                            aria-hidden="true"
                            className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-flare align-middle"
                          />
                          <span className="sr-only">Não visto. </span>
                        </>
                      )}
                      {formatarHora(new Date(evento.em).toISOString())}
                    </td>
                    <td className="px-4 py-3 align-top sm:px-5">
                      <Link to={`/motores/${evento.motorId}`} className="rounded-sm text-ink underline-offset-2 hover:underline">
                        {nomeDe(evento.motorId)}
                      </Link>
                    </td>
                    <td className="num px-4 py-3 align-top text-ink-2 sm:px-5">
                      {evento.numeroEscova ?? '—'}
                      <span className="sr-only">{evento.numeroEscova === null ? ' (motor inteiro)' : ''}</span>
                    </td>
                    <td className="px-4 py-3 align-top sm:px-5">
                      <span className="sr-only">{descreverTransicao(evento)}</span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5" aria-hidden="true">
                        <Ponta evento={evento} valor={evento.de} />
                        <span className="text-ink-3">→</span>
                        <Ponta evento={evento} valor={evento.para} />
                      </span>
                      {regra && (
                        <span className="num mt-1 block text-[13px] text-ink-3 md:hidden" aria-hidden="true">
                          <TextoRegra evento={evento} />: {valor} ≥ {limite}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 align-top text-ink-2 md:table-cell">
                      <TextoRegra evento={evento} />
                    </td>
                    <td className="num hidden whitespace-nowrap px-4 py-3 align-top text-ink md:table-cell">{valor}</td>
                    <td className="num hidden whitespace-nowrap px-4 py-3 align-top text-ink-2 md:table-cell">{limite}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
