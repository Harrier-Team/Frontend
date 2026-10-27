import React from 'react';
import { Clock } from 'lucide-react';
import { ParametrosRegra } from '@/features/quality-gates/types/regraQualidade';
import { TEMA_ESTADO } from '@/features/telemetria/helpers/apresentacao';
import {
  fraseCompletaPrevisao,
  fraseCurtaPrevisao,
  formatarLimitePrevisto,
  PrevisaoDaEscova,
} from '@/features/telemetria/helpers/previsao';
import { formatarDuracaoMinutos } from '@/utils/tempo';

interface PrevisaoMotorProps {
  /** Previsões ativas (o gate disparou), da menor para a maior espera. */
  previsoes: PrevisaoDaEscova[];
  /** Regras de tendência ativas do motor, para o texto calmo quando nada dispara. */
  regras: Array<ParametrosRegra & { temperaturaLimite: number }>;
  /** A regra de tendência ainda não tem leituras suficientes. */
  aguardando: boolean;
  desatualizado: boolean;
}

/**
 * Cartão "Previsão" do detalhe do motor. Com alerta de tendência mostra a
 * escova de menor tempo e lista as outras; sem alerta, uma linha calma que
 * fala do horizonte da regra (o backend não manda estimativa quando está Normal).
 * Os números são os do backend: o painel não ajusta reta.
 */
export const PrevisaoMotor: React.FC<PrevisaoMotorProps> = ({ previsoes, regras, aguardando, desatualizado }) => {
  if (previsoes.length === 0 && regras.length === 0) return null;

  if (previsoes.length === 0) {
    return (
      <section
        aria-label="Previsão"
        className="flex items-start gap-3 rounded-[var(--radius-panel)] border border-line bg-panel px-5 py-3.5"
      >
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
        <div className="min-w-0 text-[13px] text-ink-2">
          <p className="eyebrow mb-1">Previsão</p>
          {aguardando ? (
            <p>Aguardando amostras para estimar a tendência: são necessárias as primeiras 5 leituras de cada escova.</p>
          ) : (
            regras.slice(0, 2).map((regra) => (
              <p key={`${regra.temperaturaLimite}-${regra.aviso}`}>
                Sem tendência de atingir {formatarLimitePrevisto(regra.temperaturaLimite)} nos próximos{' '}
                {formatarDuracaoMinutos(regra.aviso)}.
              </p>
            ))
          )}
        </div>
      </section>
    );
  }

  const [principal, ...outras] = previsoes;
  const tema = TEMA_ESTADO[principal.severidade];
  return (
    <section
      aria-label="Previsão"
      className="relative overflow-hidden rounded-[var(--radius-panel)] border border-line bg-panel px-5 py-4"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: tema.color, opacity: desatualizado ? 0.6 : 1 }}
      />
      <div className="flex items-start gap-3">
        <Clock
          className="mt-0.5 h-[18px] w-[18px] shrink-0"
          aria-hidden="true"
          style={{ color: tema.color, opacity: desatualizado ? 0.6 : 1 }}
        />
        <div className="min-w-0">
          <p className="eyebrow mb-1">Previsão</p>
          <p className="num text-[15px] text-ink">{fraseCompletaPrevisao(principal)}</p>
          {outras.length > 0 && (
            <ul className="num mt-1.5 space-y-0.5 text-[13px] text-ink-2">
              {outras.map((item) => (
                <li key={item.numeroEscova}>{fraseCurtaPrevisao(item.numeroEscova, item.previsao)}</li>
              ))}
            </ul>
          )}
          {desatualizado && (
            <p className="mt-1 text-[13px] text-ink-3">Estimativa do último lote, desatualizada.</p>
          )}
        </div>
      </div>
    </section>
  );
};
