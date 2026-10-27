import { describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/types/api';
import { MotorStatusDto } from '@/features/telemetria/types/telemetria';
import { StatusConexaoHub } from '@/features/telemetria/services/signalrService';
import { alerta, alertaCritico } from '../testing/fabricas';
import { AlertaManutencao } from '../types/alerta';
import { criarAlertasStore, ESPERA_RECARGA_MS, HubAlertas } from './criarAlertasStore';

function montar(inicial: AlertaManutencao[] = []) {
  const ouvintes = {
    alerta: [] as Array<(a: AlertaManutencao) => void>,
    status: [] as Array<(s: MotorStatusDto) => void>,
    conexao: [] as Array<(s: StatusConexaoHub) => void>,
    foco: [] as Array<() => void>,
  };
  const hub: HubAlertas = {
    onAlertaManutencao: (cb) => {
      ouvintes.alerta.push(cb);
      return () => undefined;
    },
    onStatusMotor: (cb) => {
      ouvintes.status.push(cb);
      return () => undefined;
    },
    onStatusMudou: (cb) => {
      ouvintes.conexao.push(cb);
      return () => undefined;
    },
  };
  let resposta: AlertaManutencao[] = inicial;
  const listarAbertos = vi.fn(async () => resposta);
  const esperas: Array<{ fn: () => void; ms: number }> = [];
  const store = criarAlertasStore({
    listarAbertos,
    hub,
    agendar: (fn, ms) => {
      const item = { fn, ms };
      esperas.push(item);
      return () => {
        esperas.splice(esperas.indexOf(item), 1);
      };
    },
    aoVoltarFoco: (cb) => {
      ouvintes.foco.push(cb);
      return () => undefined;
    },
  });
  const avisos: Array<[number, string]> = [];
  store.aoNovoAlerta((a, motivo) => avisos.push([a.id, motivo]));
  return {
    store,
    listarAbertos,
    avisos,
    esperas,
    responder: (lista: AlertaManutencao[]) => {
      resposta = lista;
    },
    emitirAlerta: (a: AlertaManutencao) => ouvintes.alerta.forEach((cb) => cb(a)),
    emitirStatus: (motorId: number) => ouvintes.status.forEach((cb) => cb({ motorId } as MotorStatusDto)),
    emitirConexao: (s: StatusConexaoHub) => ouvintes.conexao.forEach((cb) => cb(s)),
    voltarFoco: () => ouvintes.foco.forEach((cb) => cb()),
  };
}

const assentar = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('alertasStore: carga e evento', () => {
  it('carrega os abertos ao iniciar, do mais grave ao menos grave', async () => {
    const { store, listarAbertos } = montar([alerta(), alertaCritico()]);
    store.iniciar();
    await assentar();
    expect(listarAbertos).toHaveBeenCalledTimes(1);
    expect(store.obterEstado().situacao).toBe('pronto');
    expect(store.obterEstado().abertos.map((a) => a.id)).toEqual([42, 41]);
  });

  it('o evento insere e atualiza pelo id, sem duplicar', async () => {
    const { store, emitirAlerta } = montar();
    store.iniciar();
    await assentar();
    emitirAlerta(alerta());
    emitirAlerta(alerta({ severidade: 'Critico', atualizadoEm: '2026-10-27T14:31:00+00:00', valorObservado: 3 }));
    const { abertos } = store.obterEstado();
    expect(abertos).toHaveLength(1);
    expect(abertos[0]).toMatchObject({ id: 41, severidade: 'Critico', valorObservado: 3 });
  });

  it('um evento atrasado não sobrescreve uma versão mais nova', async () => {
    const { store, emitirAlerta } = montar();
    store.iniciar();
    await assentar();
    emitirAlerta(alerta({ atualizadoEm: '2026-10-27T14:31:00+00:00', valorObservado: 3 }));
    emitirAlerta(alerta({ atualizadoEm: '2026-10-27T14:30:00+00:00', valorObservado: 9 }));
    expect(store.obterEstado().abertos[0].valorObservado).toBe(3);
  });

  it('avisa uma vez por alerta que abre ou sobe de severidade, e nunca por um que continua aberto', async () => {
    const { store, emitirAlerta, avisos } = montar();
    store.iniciar();
    await assentar();
    emitirAlerta(alerta());
    emitirAlerta(alerta({ atualizadoEm: '2026-10-27T14:30:10+00:00' }));
    emitirAlerta(alerta({ atualizadoEm: '2026-10-27T14:30:20+00:00' }));
    expect(avisos).toEqual([[41, 'aberto']]);

    emitirAlerta(alerta({ severidade: 'Critico', atualizadoEm: '2026-10-27T14:31:00+00:00' }));
    emitirAlerta(alerta({ severidade: 'Critico', atualizadoEm: '2026-10-27T14:31:10+00:00' }));
    expect(avisos).toEqual([
      [41, 'aberto'],
      [41, 'subiu'],
    ]);
  });

  it('alertas que já vieram da lista não geram aviso', async () => {
    const { store, emitirAlerta, avisos } = montar([alerta()]);
    store.iniciar();
    await assentar();
    emitirAlerta(alerta());
    expect(avisos).toEqual([]);
  });

  it('um evento que chega durante a consulta não se perde, mesmo que a resposta seja mais antiga', async () => {
    const { store, emitirAlerta } = montar([]);
    store.iniciar();
    emitirAlerta(alertaCritico());
    await assentar();
    expect(store.obterEstado().abertos.map((a) => a.id)).toEqual([42]);
  });
});

describe('alertasStore: recargas', () => {
  it('recarrega ao conectar e ao reconectar o hub, e o encerramento some da lista', async () => {
    const { store, listarAbertos, responder, emitirConexao } = montar([alerta()]);
    store.iniciar();
    await assentar();
    listarAbertos.mockClear();

    emitirConexao('conectando');
    emitirConexao('conectado');
    await assentar();
    expect(listarAbertos).toHaveBeenCalledTimes(1);

    responder([]);
    emitirConexao('reconectando');
    emitirConexao('conectado');
    await assentar();
    expect(listarAbertos).toHaveBeenCalledTimes(2);
    expect(store.obterEstado().abertos).toEqual([]);
  });

  it('não recarrega por sinais repetidos de conectado', async () => {
    const { store, listarAbertos, emitirConexao } = montar();
    store.iniciar();
    await assentar();
    emitirConexao('conectado');
    await assentar();
    listarAbertos.mockClear();
    emitirConexao('conectado');
    await assentar();
    expect(listarAbertos).not.toHaveBeenCalled();
  });

  it('o status de motor com alerta aberto agenda uma recarga única de 2 s', async () => {
    const { store, listarAbertos, esperas, emitirStatus } = montar([alerta()]);
    store.iniciar();
    await assentar();
    listarAbertos.mockClear();

    emitirStatus(3);
    emitirStatus(3);
    emitirStatus(3);
    expect(esperas).toHaveLength(1);
    expect(esperas[0].ms).toBe(ESPERA_RECARGA_MS);
    esperas[0].fn();
    await assentar();
    expect(listarAbertos).toHaveBeenCalledTimes(1);
  });

  it('status de motor sem alerta aberto não recarrega', async () => {
    const { store, esperas, emitirStatus } = montar([alerta()]);
    store.iniciar();
    await assentar();
    emitirStatus(99);
    expect(esperas).toHaveLength(0);
  });

  it('recarrega ao voltar o foco para a aba', async () => {
    const { store, listarAbertos, voltarFoco } = montar();
    store.iniciar();
    await assentar();
    listarAbertos.mockClear();
    voltarFoco();
    await assentar();
    expect(listarAbertos).toHaveBeenCalledTimes(1);
  });

  it('consultas simultâneas viram uma, mais uma ao final', async () => {
    const { store, listarAbertos } = montar();
    store.iniciar();
    void store.carregar();
    void store.carregar();
    await assentar();
    await assentar();
    expect(listarAbertos).toHaveBeenCalledTimes(2);
  });
});

describe('alertasStore: API sem alertas', () => {
  it('404 deixa o store indisponível, sem insistir', async () => {
    const { store, listarAbertos } = montar();
    listarAbertos.mockRejectedValue(new ApiRequestError('Not Found', { status: 404 }));
    store.iniciar();
    await assentar();
    expect(store.obterEstado().situacao).toBe('indisponivel');
    expect(store.obterEstado().abertos).toEqual([]);

    listarAbertos.mockClear();
    void store.carregar();
    await assentar();
    expect(listarAbertos).not.toHaveBeenCalled();

    void store.recarregar();
    await assentar();
    expect(listarAbertos).toHaveBeenCalledTimes(1);
  });

  it('falha de rede mantém a lista que já havia e marca o erro', async () => {
    const { store, listarAbertos, emitirAlerta } = montar();
    store.iniciar();
    await assentar();
    emitirAlerta(alerta());
    listarAbertos.mockRejectedValue(new ApiRequestError('Falha', {}));
    await store.recarregar();
    expect(store.obterEstado().situacao).toBe('erro');
    expect(store.obterEstado().erro).toBeTruthy();
    expect(store.obterEstado().abertos).toHaveLength(1);
  });
});

describe('alertasStore: ciclo de vida', () => {
  it('o último a sair desliga a espera pendente', async () => {
    const { store, esperas, emitirStatus } = montar([alerta()]);
    const parar = store.iniciar();
    await assentar();
    emitirStatus(3);
    expect(esperas).toHaveLength(1);
    parar();
    expect(esperas).toHaveLength(0);
  });
});
