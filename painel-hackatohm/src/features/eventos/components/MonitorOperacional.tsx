import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tituloDaPagina } from '@/app/titulos';
import { useToast } from '@/components/ui/toastContext';
import { useMonitoramento } from '@/hooks/useMonitoramento';
import { useAgora } from '@/features/telemetria/hooks/useAgora';
import { useTelemetriaMotores } from '@/features/telemetria/hooks/useTelemetriaStore';
import { resumirMotor } from '@/features/telemetria/helpers/resumoMotor';
import { AnunciadorSeveridade } from '@/features/telemetria/components/AnunciadorSeveridade';
import { useCriticosNaoVistos, useRegistroEventos } from '../hooks/useEventos';
import { registroEventos } from '../store/registroEventos';
import { frasearEvento } from '../helpers/apresentacao';
import { ehTransicaoParaCritico, formatarTituloAba } from '../helpers/transicoes';

/**
 * Efeitos globais de operação, sem interface própria:
 *  - alimenta o registro de eventos a partir do store de telemetria;
 *  - um aviso (toast) por motor a cada transição para Crítico;
 *  - título da aba com os críticos não vistos: "(2) Harrier";
 *  - anúncio da mudança de severidade para leitores de tela (única região
 *    assertiva do painel; o toast crítico não anuncia por conta própria).
 */
export const MonitorOperacional: React.FC = () => {
  useRegistroEventos();
  const { motores } = useMonitoramento();
  const telemetria = useTelemetriaMotores();
  const agora = useAgora();
  const { mostrar } = useToast();
  const navigate = useNavigate();
  const naoVistos = useCriticosNaoVistos();
  const { pathname } = useLocation();

  // O ouvinte vive o tempo do painel; lê nomes e navegação pela referência mais nova.
  const nomes = useRef(new Map<number, string>());
  useEffect(() => {
    nomes.current = new Map(motores.map((motor) => [motor.id, motor.nome]));
  }, [motores]);
  const irPara = useRef(navigate);
  useEffect(() => {
    irPara.current = navigate;
  }, [navigate]);

  useEffect(
    () =>
      registroEventos.aoNovosEventos((novos) => {
        const porMotor = new Map<number, typeof novos>();
        for (const evento of novos.filter(ehTransicaoParaCritico)) {
          porMotor.set(evento.motorId, [...(porMotor.get(evento.motorId) ?? []), evento]);
        }
        for (const [motorId, eventos] of porMotor) {
          const nome = nomes.current.get(motorId) ?? `Motor ${motorId}`;
          mostrar({
            tom: 'critico',
            titulo: `${nome} ficou crítico`,
            mensagem: eventos.map((e) => frasearEvento(e, nome)).join(' · '),
            acao: { rotulo: 'Abrir o motor', aoClicar: () => irPara.current(`/motores/${motorId}`) },
          });
        }
      }),
    [mostrar]
  );

  useEffect(() => {
    document.title = formatarTituloAba(naoVistos, tituloDaPagina(pathname));
  }, [naoVistos, pathname]);

  const estados = useMemo(
    () =>
      motores.map((motor) => ({
        id: motor.id,
        nome: motor.nome,
        principal: resumirMotor(telemetria[motor.id], agora).principal,
      })),
    [motores, telemetria, agora]
  );

  return <AnunciadorSeveridade motores={estados} />;
};
