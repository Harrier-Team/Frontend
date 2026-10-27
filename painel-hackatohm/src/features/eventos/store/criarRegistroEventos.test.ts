import { describe, expect, it } from 'vitest';
import { StatusConexaoHub } from '@/features/telemetria/services/signalrService';
import { EstadoTelemetria, MotorTelemetria } from '@/features/telemetria/store/tipos';
import { gate, iso, leitura, status } from '@/features/telemetria/testing/fabricas';
import { criarRegistroEventos } from './criarRegistroEventos';

function motorCom(situacao: 'Online' | 'Offline' | 'Degradado', t = 0): MotorTelemetria {
  const l = leitura({ dataHora: iso(t), resultadosQualityGates: [gate()] });
  const s = status({
    situacao,
    escovas: [
      {
        sensorId: l.sensorId,
        numeroEscova: 1,
        valorCelsius: l.valorCelsius,
        severidade: 'Normal',
        dataHora: l.dataHora,
        alertaDesgaste: false,
        resultadosQualityGates: [gate()],
      },
    ],
  });
  return {
    motorId: 1,
    status: s,
    statusVersao: Date.parse(l.dataHora),
    statusAtualizadoEm: 0,
    escovas: { 1: { ultima: l, pontos: [] } },
    ultimoLoteEm: l.dataHora,
    lotesNaSessao: 1,
    carregando: false,
    carregado: true,
    erro: null,
  };
}

function montar(conexaoInicial: StatusConexaoHub = 'conectado') {
  let estado: EstadoTelemetria = { motores: {}, conexao: conexaoInicial, ultimaAtualizacao: null };
  const ouvintes = new Set<() => void>();
  const fonte = {
    subscribe: (cb: () => void) => {
      ouvintes.add(cb);
      return () => ouvintes.delete(cb);
    },
    obterEstado: () => estado,
  };
  const registro = criarRegistroEventos(fonte, () => 1000, 3);
  const notificar = () => ouvintes.forEach((cb) => cb());
  return {
    registro,
    definir(motor: MotorTelemetria | null) {
      estado = { ...estado, motores: motor ? { 1: motor } : {} };
      notificar();
    },
    conectar(conexao: StatusConexaoHub) {
      estado = { ...estado, conexao };
      notificar();
    },
  };
}

describe('registro de conexão da sessão', () => {
  it('a primeira leitura é só linha de base e não gera evento', () => {
    const { registro, definir } = montar();
    registro.iniciar();
    definir(motorCom('Offline'));
    expect(registro.obterEstado().eventos).toEqual([]);
  });

  it('registra Online para Offline', () => {
    const { registro, definir } = montar();
    registro.iniciar();
    definir(motorCom('Online', 0));
    definir(motorCom('Offline', 0));
    expect(registro.obterEstado().eventos.map((e) => [e.tipo, e.de, e.para])).toEqual([['situacao', 'Online', 'Offline']]);
  });

  it('não registra severidade: isso vem dos alertas do servidor', () => {
    const { registro, definir } = montar();
    registro.iniciar();
    definir(motorCom('Online', 0));
    const critico = motorCom('Online', 10);
    critico.status = { ...critico.status!, severidadeGeral: 'Critico' };
    critico.escovas[1].ultima = leitura({
      dataHora: iso(10),
      resultadosQualityGates: [gate({ disparouAlerta: true, severidade: 'Critico', valorObservado: 96, valorLimite: 95 })],
    });
    definir(critico);
    expect(registro.obterEstado().eventos).toEqual([]);
  });

  it('registra a queda do hub e a retomada, não a primeira conexão', () => {
    const { registro, conectar } = montar('desconectado');
    registro.iniciar();
    conectar('conectando');
    conectar('conectado');
    expect(registro.obterEstado().eventos).toEqual([]);

    conectar('reconectando');
    conectar('desconectado');
    conectar('conectado');
    expect(registro.obterEstado().eventos.map((e) => [e.tipo, e.motorId, e.para])).toEqual([
      ['hub', null, 'conectado'],
      ['hub', null, 'reconectando'],
    ]);
  });

  it('mantém no máximo o limite de eventos, descartando os mais antigos', () => {
    const { registro, definir } = montar();
    registro.iniciar();
    definir(motorCom('Online'));
    for (let i = 0; i < 5; i += 1) {
      definir(motorCom(i % 2 === 0 ? 'Offline' : 'Online', 10 * (i + 1)));
    }
    const ids = registro.obterEstado().eventos.map((e) => e.id);
    expect(ids).toEqual([5, 4, 3]);
  });

  it('para de observar quando o último usuário sai', () => {
    const { registro, definir } = montar();
    const parar = registro.iniciar();
    definir(motorCom('Online'));
    parar();
    definir(motorCom('Offline', 10));
    expect(registro.obterEstado().eventos).toEqual([]);
  });

  it('só o último usuário desliga o registro', () => {
    const { registro, definir } = montar();
    const a = registro.iniciar();
    const b = registro.iniciar();
    definir(motorCom('Online'));
    a();
    definir(motorCom('Offline', 10));
    expect(registro.obterEstado().eventos).toHaveLength(1);
    b();
  });
});
