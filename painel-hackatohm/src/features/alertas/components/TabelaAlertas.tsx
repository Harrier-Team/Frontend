import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SeverityBadge } from '@/features/telemetria/components/SeverityBadge';
import { ehSeveridadeAnormal } from '@/features/telemetria/helpers/estadoHelper';
import { ehPrevisao, formatarValorELimite, nomeRegraDistinto, obterTipoRegra } from '@/features/quality-gates/helpers/tiposRegra';
import {
  chaveDoAlerta,
  descreverAlerta,
  descreverDuracao,
  escopoDoAlerta,
  rotuloCategoria,
} from '../helpers/apresentacao';
import { AlertaManutencao } from '../types/alerta';

interface TabelaAlertasProps {
  alertas: AlertaManutencao[];
  /** Relógio global (`useAgora`), para "aberto há 12 min". */
  agora: number;
  nomeDoMotor: (motorId: number) => string;
  /** Legenda para leitores de tela. */
  legenda: string;
  /** Sem a coluna de motor (a página já é de um motor). */
  semMotor?: boolean;
  /** Presente na lista em aberto: reconhecer um crítico (só neste navegador). */
  reconhecidos?: ReadonlySet<string>;
  onReconhecer?: (alerta: AlertaManutencao) => void;
}

const formatoInicio = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const Categoria: React.FC<{ categoria: string }> = ({ categoria }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-line-strong px-2 py-px text-[11px] text-ink-2">
    {categoria === 'Preditivo' && <Clock className="h-3 w-3" aria-hidden="true" />}
    {rotuloCategoria(categoria)}
  </span>
);

/**
 * Lista de alertas de manutenção. O texto principal é montado pelo painel
 * (vírgula decimal e a unidade do tipo); a mensagem do backend fica como
 * detalhe técnico recolhido. Tipo ou categoria desconhecidos aparecem pelo
 * identificador, com o número sem unidade.
 */
export const TabelaAlertas: React.FC<TabelaAlertasProps> = ({
  alertas,
  agora,
  nomeDoMotor,
  legenda,
  semMotor = false,
  reconhecidos,
  onReconhecer,
}) => {
  const comAcao = Boolean(onReconhecer);
  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-panel">
      <table className="w-full border-collapse text-left text-[14px]">
        <caption className="sr-only">{legenda}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="eyebrow px-4 py-3 font-medium sm:px-5">
              Severidade
            </th>
            <th scope="col" className="eyebrow px-4 py-3 font-medium">
              Alerta
            </th>
            {!semMotor && (
              <th scope="col" className="eyebrow hidden px-4 py-3 font-medium md:table-cell">
                Motor
              </th>
            )}
            <th scope="col" className="eyebrow hidden px-4 py-3 font-medium lg:table-cell">
              Valor
            </th>
            <th scope="col" className="eyebrow hidden px-4 py-3 font-medium md:table-cell">
              Início
            </th>
            <th scope="col" className="eyebrow hidden px-4 py-3 font-medium sm:table-cell">
              Duração
            </th>
            {comAcao && (
              <th scope="col" className="px-4 py-3 sm:px-5">
                <span className="sr-only">Ação</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {alertas.map((alerta) => {
            const motor = nomeDoMotor(alerta.motorId);
            const tipo = obterTipoRegra(alerta.tipoRegra);
            const nome = nomeRegraDistinto(alerta.nomeRegra, tipo);
            const critico = alerta.severidade === 'Critico' && alerta.ativo;
            const reconhecido = reconhecidos?.has(chaveDoAlerta(alerta)) ?? false;
            const temValores = alerta.valorObservado !== null;
            return (
              <tr
                key={alerta.id}
                style={{
                  background:
                    critico && !reconhecido
                      ? 'color-mix(in srgb, var(--color-sev-critico) 7%, var(--color-panel))'
                      : undefined,
                }}
              >
                <td className="whitespace-nowrap px-4 py-3 align-top sm:px-5">
                  <SeverityBadge estado={alerta.severidade} compacto esmaecido={!alerta.ativo && ehSeveridadeAnormal(alerta.severidade)} />
                </td>
                <td className="min-w-0 px-4 py-3 align-top">
                  <p className="text-ink">{descreverAlerta(alerta, motor)}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-3">
                    <Categoria categoria={alerta.categoria} />
                    <span>
                      {nome ?? tipo.rotulo}
                      {alerta.regraQualidadeId === null && <span className="italic"> · regra excluída</span>}
                    </span>
                  </p>
                  {/* Sem as colunas de motor, valor e início (telas estreitas), a identificação vem aqui. */}
                  <p className="num mt-1 text-[13px] text-ink-3 md:hidden">
                    {!semMotor && (
                      <Link to={`/motores/${alerta.motorId}`} className="text-ink-2 underline-offset-2 hover:underline">
                        {motor}
                      </Link>
                    )}
                    {!semMotor && ' · '}
                    {escopoDoAlerta(alerta)} · {formatoInicio.format(Date.parse(alerta.iniciadoEm))}
                  </p>
                  <details className="mt-1.5 text-[13px] text-ink-3">
                    <summary className="cursor-pointer select-none">Detalhe técnico</summary>
                    <dl className="num mt-1.5 space-y-0.5">
                      {alerta.mensagem && (
                        <div className="flex gap-1.5">
                          <dt>Mensagem</dt>
                          <dd className="text-ink-2">{alerta.mensagem}</dd>
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <dt>Código</dt>
                        <dd className="font-mono text-ink-2">{alerta.codigoRegra || '—'}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt>Tipo</dt>
                        <dd className="font-mono text-ink-2">{alerta.tipoRegra || '—'}</dd>
                      </div>
                      {alerta.resolvidoEm && (
                        <div className="flex gap-1.5">
                          <dt>Encerrado</dt>
                          <dd className="text-ink-2">{formatoInicio.format(Date.parse(alerta.resolvidoEm))}</dd>
                        </div>
                      )}
                    </dl>
                  </details>
                </td>
                {!semMotor && (
                  <td className="hidden px-4 py-3 align-top md:table-cell">
                    <Link to={`/motores/${alerta.motorId}`} className="rounded-sm text-ink underline-offset-2 hover:underline">
                      {motor}
                    </Link>
                    <p className="text-[13px] text-ink-3">{escopoDoAlerta(alerta)}</p>
                  </td>
                )}
                <td className="num hidden whitespace-nowrap px-4 py-3 align-top text-ink lg:table-cell">
                  {temValores ? (
                    <>
                      {formatarValorELimite(alerta.tipoRegra, alerta.valorObservado, alerta.valorLimite)}
                      {ehPrevisao(alerta.tipoRegra) && <span className="sr-only"> (estimativa em minutos)</span>}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="num hidden whitespace-nowrap px-4 py-3 align-top text-ink-2 md:table-cell">
                  {formatoInicio.format(Date.parse(alerta.iniciadoEm))}
                </td>
                <td className="num hidden whitespace-nowrap px-4 py-3 align-top text-ink-2 sm:table-cell">
                  {descreverDuracao(alerta, agora)}
                </td>
                {comAcao && (
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top sm:px-5">
                    {critico &&
                      (reconhecido ? (
                        <span className="inline-flex items-center gap-1 text-[13px] text-ink-3">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Reconhecido
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onReconhecer?.(alerta)}
                          aria-label={`Reconhecer alerta crítico de ${motor}, ${escopoDoAlerta(alerta).toLowerCase()}`}
                        >
                          Reconhecer
                        </Button>
                      ))}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
