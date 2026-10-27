import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { enderecoDosAlertasDoMotor } from '../helpers/filtros';
import { useAlertasAbertos, useHistoricoAlertas, useReconhecidos } from '../hooks/useAlertas';
import { reconhecimentos } from '../store/alertasStore';
import { TabelaAlertas } from './TabelaAlertas';

interface AlertasDoMotorProps {
  motorId: number;
  nomeDoMotor: string;
  agora: number;
}

const ENCERRADOS_RECENTES = { ativo: false, pagina: 1, tamanho: 10 } as const;

/**
 * Seção "Alertas" do detalhe do motor: os em aberto e os 10 últimos
 * encerrados, com o link para ver todos. Some quando a API não tem alertas.
 */
export const AlertasDoMotor: React.FC<AlertasDoMotorProps> = ({ motorId, nomeDoMotor, agora }) => {
  const { abertos: todosAbertos, situacao } = useAlertasAbertos();
  const reconhecidos = useReconhecidos();
  const abertos = useMemo(() => todosAbertos.filter((alerta) => alerta.motorId === motorId), [todosAbertos, motorId]);
  const consulta = useMemo(() => ({ ...ENCERRADOS_RECENTES, motorId }), [motorId]);
  const encerrados = useHistoricoAlertas(consulta, situacao !== 'indisponivel');

  if (situacao === 'indisponivel' || encerrados.indisponivel) return null;

  const recentes = encerrados.pagina?.itens ?? [];
  const nomeDe = () => nomeDoMotor;
  const carregando = (situacao === 'inicial' || situacao === 'carregando') && abertos.length === 0;

  return (
    <section aria-labelledby="alertas-do-motor" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="alertas-do-motor" className="display text-base">
          Alertas<span className="num ml-2 text-ink-3">{abertos.length}</span>
        </h2>
        <Link
          to={enderecoDosAlertasDoMotor(motorId)}
          className="inline-flex items-center gap-0.5 text-[13px] text-ink-2 underline underline-offset-2 hover:text-ink"
        >
          Ver todos
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {abertos.length === 0 && recentes.length === 0 ? (
        <p className="rounded-[var(--radius-panel)] border border-line bg-panel px-5 py-4 text-sm text-ink-2">
          {carregando || encerrados.carregando ? 'Carregando alertas…' : 'Nenhum alerta deste motor, em aberto ou encerrado.'}
        </p>
      ) : (
        <>
          {abertos.length > 0 && (
            <div className="space-y-2">
              <p className="eyebrow">Em aberto</p>
              <TabelaAlertas
                alertas={abertos}
                agora={agora}
                nomeDoMotor={nomeDe}
                legenda={`Alertas em aberto de ${nomeDoMotor}`}
                semMotor
                reconhecidos={reconhecidos}
                onReconhecer={(alerta) => reconhecimentos.reconhecer([alerta])}
              />
            </div>
          )}
          {recentes.length > 0 && (
            <div className="space-y-2">
              <p className="eyebrow">Encerrados recentemente</p>
              <TabelaAlertas
                alertas={recentes}
                agora={agora}
                nomeDoMotor={nomeDe}
                legenda={`Últimos alertas encerrados de ${nomeDoMotor}`}
                semMotor
              />
            </div>
          )}
        </>
      )}
      {encerrados.erro && (
        <p role="status" className="text-[13px] text-sev-atencao">
          Não foi possível atualizar os alertas encerrados.
        </p>
      )}
    </section>
  );
};
