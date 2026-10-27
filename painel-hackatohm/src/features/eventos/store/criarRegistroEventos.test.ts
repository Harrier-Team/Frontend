import { describe, expect, it, vi } from 'vitest';
import { EstadoTelemetria, MotorTelemetria } from '@/features/telemetria/store/tipos';
import { gate, gateAlerta, iso, leitura, status } from '@/features/telemetria/testing/fabricas';
import { criarRegistroEventos } from './criarRegistroEventos';

function motorCom(severidade: 'Normal' | 'Critico', situacao: 'Online' | 'Offline' = 'Online', t = 0): MotorTelemetria {
  const gates = severidade === 'Critico' ? [gateAlerta('Critico')] : [gate()];
  const l = leitura({ dataHora: iso(t), valorCelsius: severidade === 'Critico' ? 96.1 : 50, resultadosQualityGates: gates });
  const s = status({
    severidadeGeral: severidade,
    situacao,
    motivo:
      severidade === 'Critico'
        ? {
            numeroEscova: 1,
            nomeRegra: 'Limiar estático',
            tipoRegra: 'temperatura.limiar_estatico',
            codigoRegra: 'TEMP_CRITICA',
            valorObservado: 96.1,
            valorLimite: 95,
            mensagemDiagnostico: null,
          }
        : null,
    escovas: [
      {
        sensorId: l.sensorId,
        numeroEscova: 1,
        valorCelsius: l.valorCelsius,
        severidade,
        dataHora: l.dataHora,
        alertaDesgaste: severidade === 'Critico',
        resultadosQualityGates: gates,
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

function montar() {
  let estado: EstadoTelemetria = { motores: {}, conexao: 'conectado', ultimaAtualizacao: null };
  const ouvintes = new Set<() => void>();
  const fonte = {
    subscribe: (cb: () => void) => {
      ouvintes.add(cb);
      return () => ouvintes.delete(cb);
    },
    obterEstado: () => estado,
  };
  const registro = criarRegistroEventos(fonte, () => 1000, 3);
  return {
    registro,
    definir(motor: MotorTelemetria | null) {
      estado = { ...estado, motores: motor ? { 1: motor } : {} };
      ouvintes.forEach((cb) => cb());
    },
  };
}

describe('registro de eventos', () => {
  it('a primeira leitura é só linha de base e não gera evento', () => {
    const { registro, definir } = montar();
    registro.iniciar();
    definir(motorCom('Critico'));
    expect(registro.obterEstado().eventos).toEqual([]);
  });

  it('registra Normal para Crítico uma vez e avisa os ouvintes', () => {
    const { registro, definir } = montar();
    const aviso = vi.fn();
    registro.aoNovosEventos(aviso);
    registro.iniciar();
    definir(motorCom('Normal', 'Online', 0));
    definir(motorCom('Critico', 'Online', 10));
    definir(motorCom('Critico', 'Online', 20));

    const { eventos } = registro.obterEstado();
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({ tipo: 'escova', de: 'Normal', para: 'Critico', numeroEscova: 1 });
    expect(eventos[0].evidencia).toMatchObject({ valor: 96.1, limite: 95 });
    expect(aviso).toHaveBeenCalledTimes(1);
  });

  it('registra Online para Offline', () => {
    const { registro, definir } = montar();
    registro.iniciar();
    definir(motorCom('Normal', 'Online', 0));
    definir(motorCom('Normal', 'Offline', 0));
    expect(registro.obterEstado().eventos.map((e) => [e.tipo, e.de, e.para])).toEqual([['situacao', 'Online', 'Offline']]);
  });

  it('marcar como visto avança o marcador e não apaga eventos', () => {
    const { registro, definir } = montar();
    registro.iniciar();
    definir(motorCom('Normal'));
    definir(motorCom('Critico', 'Online', 10));
    expect(registro.obterEstado().vistoAte).toBe(0);
    registro.marcarComoVisto();
    expect(registro.obterEstado().vistoAte).toBe(1);
    expect(registro.obterEstado().eventos).toHaveLength(1);
  });

  it('mantém no máximo o limite de eventos, descartando os mais antigos', () => {
    const { registro, definir } = montar();
    registro.iniciar();
    definir(motorCom('Normal'));
    for (let i = 0; i < 5; i += 1) {
      definir(motorCom(i % 2 === 0 ? 'Critico' : 'Normal', 'Online', 10 * (i + 1)));
    }
    const ids = registro.obterEstado().eventos.map((e) => e.id);
    expect(ids).toEqual([5, 4, 3]);
  });

  it('para de observar quando o último usuário sai', () => {
    const { registro, definir } = montar();
    const parar = registro.iniciar();
    definir(motorCom('Normal'));
    parar();
    definir(motorCom('Critico', 'Online', 10));
    expect(registro.obterEstado().eventos).toEqual([]);
  });
});
