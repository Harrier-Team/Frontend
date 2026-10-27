import { describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/types/api';
import { LeituraEscova, MotorStatusDto } from '@/features/telemetria/types/telemetria';
import { StatusConexaoHub } from '@/features/telemetria/services/signalrService';
import { criarTelemetriaStore, HubTelemetria } from './criarTelemetriaStore';
import { gateAlerta, iso, leitura, status, T0 } from '../testing/fabricas';

function montar(ids = [1, 2]) {
  let agora = T0;
  const callbacks = {
    lote: [] as Array<(l: LeituraEscova[]) => void>,
    status: [] as Array<(s: MotorStatusDto) => void>,
    conexao: [] as Array<(s: StatusConexaoHub) => void>,
  };
  const hub: HubTelemetria = {
    iniciar: vi.fn(),
    onLoteTelemetria: (cb) => {
      callbacks.lote.push(cb);
      return () => undefined;
    },
    onStatusMotor: (cb) => {
      callbacks.status.push(cb);
      return () => undefined;
    },
    onStatusMudou: (cb) => {
      callbacks.conexao.push(cb);
      return () => undefined;
    },
  };
  const obterStatus = vi.fn(async (motorId: number) => status({ motorId }));
  const store = criarTelemetriaStore({
    obterStatus,
    agora: () => agora,
    hub,
    agendarVigia: false,
  });
  store.definirMotores(ids);
  store.iniciar();
  obterStatus.mockClear();

  return {
    store,
    hub,
    obterStatus,
    callbacks,
    avancar: (segundos: number) => {
      agora += segundos * 1000;
    },
    emitirLote: (leituras: LeituraEscova[]) => callbacks.lote.forEach((cb) => cb(leituras)),
    emitirConexao: (s: StatusConexaoHub) => callbacks.conexao.forEach((cb) => cb(s)),
  };
}

const esperar = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('telemetriaStore: lotes', () => {
  it('conta cada lote do hub uma vez e deduplica pontos pelo instante', () => {
    const { store, emitirLote } = montar();
    const lote = [leitura({ numeroEscova: 1 }), leitura({ numeroEscova: 2, sensorId: 'x-2' })];

    emitirLote(lote);
    emitirLote(lote);

    const motor = store.obterMotor(1)!;
    expect(motor.lotesNaSessao).toBe(1);
    expect(motor.escovas[1].pontos).toHaveLength(1);
    expect(motor.escovas[2].pontos).toHaveLength(1);

    emitirLote([leitura({ numeroEscova: 1, dataHora: iso(10) })]);
    expect(store.obterMotor(1)!.lotesNaSessao).toBe(2);
    expect(store.obterMotor(1)!.escovas[1].pontos).toHaveLength(2);
  });

  it('filtra por motorId: ignora motor desconhecido e leitura sem motor', () => {
    const { store, emitirLote } = montar([1]);
    emitirLote([leitura({ motorId: 99 }), leitura({ motorId: null })]);
    expect(store.obterMotor(1)!.lotesNaSessao).toBe(0);
    expect(store.obterMotor(99)).toBeUndefined();
  });

  it('casa a escova por motorId + numeroEscova, sem olhar o sensorId', () => {
    const { store, emitirLote } = montar([1]);
    emitirLote([leitura({ numeroEscova: 3, sensorId: 'formato-qualquer-3' })]);
    expect(store.obterMotor(1)!.escovas[3].ultima?.sensorId).toBe('formato-qualquer-3');
  });

  it('mantém no máximo ~360 pontos por escova', () => {
    const { store, emitirLote } = montar([1]);
    for (let i = 0; i < 400; i++) emitirLote([leitura({ dataHora: iso(i * 10) })]);
    expect(store.obterMotor(1)!.escovas[1].pontos).toHaveLength(360);
    expect(store.obterMotor(1)!.lotesNaSessao).toBe(400);
  });
});

describe('telemetriaStore: monotonicidade', () => {
  it('status HTTP antigo não sobrescreve leitura nem status recentes do hub', async () => {
    const { store, emitirLote, callbacks } = montar([1]);

    emitirLote([leitura({ dataHora: iso(20), valorCelsius: 90 })]);
    callbacks.status.forEach((cb) =>
      cb(
        status({
          severidadeGeral: 'Critico',
          escovas: [
            {
              sensorId: 'a',
              numeroEscova: 1,
              valorCelsius: 90,
              severidade: 'Critico',
              dataHora: iso(20),
              alertaDesgaste: true,
              resultadosQualityGates: [gateAlerta('Critico')],
            },
          ],
        })
      )
    );

    // GET atrasado devolve o estado de 20 s antes.
    const antigo = status({ severidadeGeral: 'Normal' });
    const aceito = store.aplicarStatus(antigo);

    expect(aceito).toBe(false);
    const motor = store.obterMotor(1)!;
    expect(motor.status?.severidadeGeral).toBe('Critico');
    expect(motor.escovas[1].ultima?.valorCelsius).toBe(90);
    // O ponto antigo entra na curva, em ordem, sem virar "atual".
    expect(motor.escovas[1].pontos.map((p) => p.v)).toEqual([90]);
  });

  it('descarta a resposta de uma consulta anterior que chega depois da mais nova', async () => {
    const { store, obterStatus } = montar([1]);
    let resolverPrimeira!: (s: MotorStatusDto) => void;
    obterStatus
      .mockImplementationOnce(() => new Promise<MotorStatusDto>((r) => (resolverPrimeira = r)))
      .mockImplementationOnce(async () => status({ severidadeGeral: 'Critico' }));

    const primeira = store.carregarStatus(1);
    await store.carregarStatus(1);
    expect(store.obterMotor(1)!.status?.severidadeGeral).toBe('Critico');

    resolverPrimeira(status({ severidadeGeral: 'Normal' }));
    await primeira;
    expect(store.obterMotor(1)!.status?.severidadeGeral).toBe('Critico');
  });

  it('aceita o mesmo instante com gates reavaliados (após editar regras)', async () => {
    const { store, obterStatus } = montar([1]);
    await store.carregarStatus(1);
    expect(store.obterMotor(1)!.escovas[1].ultima?.resultadosQualityGates[0].severidade).toBe('Normal');

    obterStatus.mockResolvedValueOnce(
      status({
        severidadeGeral: 'Critico',
        escovas: [
          {
            sensorId: 'a',
            numeroEscova: 1,
            valorCelsius: 50,
            severidade: 'Critico',
            dataHora: iso(0),
            alertaDesgaste: true,
            resultadosQualityGates: [gateAlerta('Critico')],
          },
        ],
      })
    );
    await store.carregarStatus(1);

    const motor = store.obterMotor(1)!;
    expect(motor.status?.severidadeGeral).toBe('Critico');
    expect(motor.escovas[1].ultima?.resultadosQualityGates[0].severidade).toBe('Critico');
    expect(motor.escovas[1].pontos).toHaveLength(1);
    expect(motor.lotesNaSessao).toBe(0);
  });
});

describe('telemetriaStore: conexão e recarga', () => {
  it('carrega o status de todos os motores ao conectar e ao reconectar', async () => {
    const { obterStatus, emitirConexao } = montar([1, 2]);

    emitirConexao('conectando');
    expect(obterStatus).not.toHaveBeenCalled();

    emitirConexao('conectado');
    await esperar();
    expect(obterStatus.mock.calls.map((c) => c[0]).sort()).toEqual([1, 2]);

    obterStatus.mockClear();
    emitirConexao('reconectando');
    emitirConexao('conectado');
    await esperar();
    expect(obterStatus.mock.calls.map((c) => c[0]).sort()).toEqual([1, 2]);
  });

  it('carrega o status de motores novos assim que são cadastrados', () => {
    const { store, obterStatus } = montar([1]);
    store.definirMotores([1, 2]);
    expect(obterStatus).toHaveBeenCalledTimes(1);
    expect(obterStatus).toHaveBeenCalledWith(2);
  });

  it('reconexão não duplica pontos nem lotes', async () => {
    const { store, emitirLote, emitirConexao } = montar([1]);
    emitirLote([leitura({ dataHora: iso(0) })]);

    emitirConexao('conectado');
    await esperar();

    const motor = store.obterMotor(1)!;
    expect(motor.escovas[1].pontos).toHaveLength(1);
    expect(motor.lotesNaSessao).toBe(1);
  });
});

describe('telemetriaStore: erros', () => {
  it('404 do status não é falha: motor ainda sem leitura', async () => {
    const { store, obterStatus } = montar([1]);
    obterStatus.mockRejectedValueOnce(new ApiRequestError('x', { status: 404 }));
    await store.carregarStatus(1);
    const motor = store.obterMotor(1)!;
    expect(motor.erro).toBeNull();
    expect(motor.carregado).toBe(true);
  });

  it('falha de rede vira mensagem amigável e preserva o último dado', async () => {
    const { store, obterStatus } = montar([1]);
    await store.carregarStatus(1);
    obterStatus.mockRejectedValueOnce(new ApiRequestError('Network Error', {}));
    await store.carregarStatus(1);

    const motor = store.obterMotor(1)!;
    expect(motor.erro).toContain('API');
    expect(motor.erro).not.toContain('Network Error');
    expect(motor.status).not.toBeNull();
  });
});

describe('telemetriaStore: vigia de silêncio', () => {
  it('consulta o status após mais de 30 s sem lote, no máximo uma vez a cada 30 s', async () => {
    const { store, obterStatus, avancar, emitirLote } = montar([1]);
    emitirLote([leitura({ dataHora: iso(0) })]);
    await store.carregarStatus(1);
    obterStatus.mockClear();

    avancar(20);
    store.verificarSilencio();
    expect(obterStatus).not.toHaveBeenCalled();

    avancar(11); // 31 s sem lote, mas a última consulta foi há 31 s
    store.verificarSilencio();
    await esperar();
    expect(obterStatus).toHaveBeenCalledTimes(1);

    avancar(10); // ainda em silêncio, mas consultou há 10 s
    store.verificarSilencio();
    expect(obterStatus).toHaveBeenCalledTimes(1);

    avancar(21);
    store.verificarSilencio();
    await esperar();
    expect(obterStatus).toHaveBeenCalledTimes(2);
  });

  it('não consulta enquanto os lotes continuam chegando', async () => {
    const { store, obterStatus, avancar, emitirLote } = montar([1]);
    await store.carregarStatus(1);
    obterStatus.mockClear();

    for (let i = 1; i <= 6; i++) {
      avancar(10);
      emitirLote([leitura({ dataHora: iso(i * 10) })]);
      store.verificarSilencio();
    }
    expect(obterStatus).not.toHaveBeenCalled();
  });

  it('tenta reiniciar o hub quando ele ficou desconectado', () => {
    const { store, hub, emitirConexao } = montar([1]);
    expect(hub.iniciar).toHaveBeenCalledTimes(1);

    emitirConexao('conectado');
    store.verificarSilencio();
    expect(hub.iniciar).toHaveBeenCalledTimes(1);

    emitirConexao('desconectado');
    store.verificarSilencio();
    expect(hub.iniciar).toHaveBeenCalledTimes(2);
  });
});

describe('telemetriaStore: gates sem leitura ainda', () => {
  it('mantém gates vazios como lista, nunca indefinidos', async () => {
    const { store, obterStatus } = montar([1]);
    obterStatus.mockResolvedValueOnce(
      status({
        escovas: [
          {
            sensorId: 'a',
            numeroEscova: 1,
            valorCelsius: 40,
            severidade: 'Normal',
            dataHora: iso(0),
            alertaDesgaste: false,
            resultadosQualityGates: [],
          },
        ],
      })
    );
    await store.carregarStatus(1);
    expect(store.obterMotor(1)!.escovas[1].ultima?.resultadosQualityGates).toEqual([]);
  });
});
