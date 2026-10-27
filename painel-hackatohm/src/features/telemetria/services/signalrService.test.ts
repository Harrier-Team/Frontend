import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { signalRService } from './signalrService';
import type { TelemetriaRealtimeDto, TelemetriaRecebidaDto } from '../types/telemetria';
import type { CodigoSeveridade } from '@/features/quality-gates/types/qualityGate';
import { classificarSensor, calcularStatusGeralDoMotor } from '../helpers/statusHelper';
import { QualityGateResult } from '@/features/quality-gates/components/QualityGateResult';
import { QualityGateResultList } from '@/features/quality-gates/components/QualityGateResultList';

const { handlers, connection } = vi.hoisted(() => {
  const handlers = new Map<string, (payload: unknown) => void>();
  return {
    handlers,
    connection: {
      state: 'Disconnected',
      on: vi.fn((event: string, callback: (payload: unknown) => void) => handlers.set(event, callback)),
      onreconnecting: vi.fn(), onreconnected: vi.fn(), onclose: vi.fn(),
      start: vi.fn(async () => {}), stop: vi.fn(async () => {}),
    },
  };
});

vi.mock('@microsoft/signalr', () => ({
  HubConnectionState: { Disconnected: 'Disconnected', Connected: 'Connected' },
  LogLevel: { Information: 2 },
  HubConnectionBuilder: class {
    withUrl() { return this; }
    withAutomaticReconnect() { return this; }
    configureLogging() { return this; }
    build() { return connection; }
  },
}));

function leitura(severidade: CodigoSeveridade): TelemetriaRecebidaDto {
  return {
    sensorId: 'AA:BB:CC:DD:EE:FF_Escova1', espMacAddress: 'AA:BB:CC:DD:EE:FF',
    numeroEscova: 1, motorId: 1, valorCelsius: 32,
    dataHora: '2026-10-26T20:00:00Z', alertaDesgaste: severidade !== 0,
    resultadosQualityGates: [{
      regraQualidadeId: 'regra-1', nomeRegra: 'Limite',
      severidade, disparouAlerta: severidade !== 0,
      tipoRegra: 'temperatura.limiar_estatico', codigoRegra: 'TESTE',
      mensagemDiagnostico: 'Diagnostico', valorObservado: 32,
      valorLimite: 30, metadados: null,
    }],
  };
}

describe('severidade recebida pelo SignalR', () => {
  beforeAll(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    signalRService.iniciar();
  });
  afterAll(() => {
    signalRService.parar();
    vi.restoreAllMocks();
  });

  it.each(['ReceberTelemetria', 'ReceberLoteTelemetria'])(
    '%s atualiza aviso → crítico → normal na escova, no motor e no diagnóstico',
    (event) => {
      const recebidas: TelemetriaRealtimeDto[] = [];
      const unsubscribe = event === 'ReceberTelemetria'
        ? signalRService.onTelemetria((item) => recebidas.push(item))
        : signalRService.onLoteTelemetria((items) => recebidas.push(...items));

      try {
        for (const [codigo, severidade, esperado] of [
          [2, 'AlertaPreditivo', 'warning'],
          [3, 'Critico', 'perigo'],
          [0, 'Normal', 'normal'],
        ] as const) {
          const raw = leitura(codigo);
          handlers.get(event)!(event === 'ReceberTelemetria' ? raw : [raw]);
          const recebida = recebidas.at(-1)!;
          expect(recebida.resultadosQualityGates?.[0].severidade).toBe(severidade);
          const status = classificarSensor(recebida.valorCelsius, true, recebida.resultadosQualityGates);
          expect(status).toBe(esperado);
          expect(calcularStatusGeralDoMotor([
            { id: recebida.sensorId, numeroEscova: 1, modelo: 'MLX', status },
          ])).toBe(esperado);
          if (codigo === 3) {
            const html = renderToStaticMarkup(createElement(QualityGateResult, {
              resultado: recebida.resultadosQualityGates![0],
            }));
            expect(html).toContain('Crítico');
            expect(html).toContain('text-hot');
          }
          if (codigo === 0) {
            const html = renderToStaticMarkup(createElement(QualityGateResultList, {
              resultados: recebida.resultadosQualityGates!,
            }));
            expect(html).toContain('1 regra dentro do limite');
          }
        }
      } finally {
        unsubscribe();
      }
    }
  );
});
