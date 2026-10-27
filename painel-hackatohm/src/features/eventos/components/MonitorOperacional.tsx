import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatarTituloAba, tituloDaPagina } from '@/app/titulos';
import { useToast } from '@/components/ui/toastContext';
import { useMonitoramento } from '@/hooks/useMonitoramento';
import { decidirAviso } from '@/features/alertas/helpers/apresentacao';
import { useCriticosNaoReconhecidos, useIniciarAlertas } from '@/features/alertas/hooks/useAlertas';
import { alertasStore } from '@/features/alertas/store/alertasStore';
import { useAgora } from '@/features/telemetria/hooks/useAgora';
import { useTelemetriaMotores } from '@/features/telemetria/hooks/useTelemetriaStore';
import { resumirMotor } from '@/features/telemetria/helpers/resumoMotor';
import { AnunciadorSeveridade } from '@/features/telemetria/components/AnunciadorSeveridade';
import { useRegistroEventos } from '../hooks/useEventos';

/**
 * Efeitos globais de operação, sem interface própria:
 *  - alimenta o registro de conexão e o store de alertas;
 *  - um aviso (toast) por alerta de manutenção que abre ou sobe de severidade,
 *    vindo de `ReceberAlertaManutencao`: Crítico fica até ser dispensado e a
 *    previsão nova é um aviso discreto;
 *  - título da aba com os críticos em aberto ainda não reconhecidos: "(2) Harrier";
 *  - anúncio da mudança de severidade para leitores de tela (única região
 *    assertiva do painel; o toast crítico não anuncia por conta própria).
 * O painel não detecta severidade por conta própria: quem abre e encerra
 * alertas é o backend, e ele persiste o registro.
 */
export const MonitorOperacional: React.FC = () => {
  useRegistroEventos();
  useIniciarAlertas();
  const { motores } = useMonitoramento();
  const telemetria = useTelemetriaMotores();
  const agora = useAgora();
  const { mostrar } = useToast();
  const navigate = useNavigate();
  const naoReconhecidos = useCriticosNaoReconhecidos();
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
      alertasStore.aoNovoAlerta((alerta) => {
        const nome = nomes.current.get(alerta.motorId) ?? `Motor ${alerta.motorId}`;
        const aviso = decidirAviso(alerta, nome, () => irPara.current(`/motores/${alerta.motorId}`));
        if (aviso) mostrar(aviso);
      }),
    [mostrar]
  );

  useEffect(() => {
    document.title = formatarTituloAba(naoReconhecidos, tituloDaPagina(pathname));
  }, [naoReconhecidos, pathname]);

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
