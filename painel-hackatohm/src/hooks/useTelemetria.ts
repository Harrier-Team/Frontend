import { useState, useEffect, useRef } from 'react';
import { MotorResponse } from '../features/motores/types/motor';
import {
  MotorComStatus,
  SensorComTelemetria,
  NivelStatus,
  TelemetriaRealtimeDto,
} from '../types/telemetria';
import { signalRService, StatusConexaoHub } from '../services/signalrService';
import {
  classificarSensor,
  calcularStatusGeralDoMotor,
} from '../utils/statusHelper';
import { leituraService } from '../services/leituraService';

// Função utilitária para normalizar MAC addresses (remove : - e espaços)
function normalizarMac(mac?: string | null): string {
  if (!mac) return '';
  return mac.replace(/[-:_ ]/g, '').toUpperCase().trim();
}

// Verifica se uma leitura recebida do SignalR corresponde a um sensor cadastrado
function ehMesmoSensor(
  sensorId: string,
  numeroEscova: number,
  dto: TelemetriaRealtimeDto
): boolean {
  // 1. Comparação direta de sensorId (ex: "24:DC:C3:9C:12:34_Escova1")
  if (
    normalizarMac(sensorId) === normalizarMac(dto.sensorId)
  ) {
    return true;
  }

  // 2. Comparação por MAC + Número da Escova
  const macDoSensor = normalizarMac(sensorId.split('_Escova')[0]);
  const macDoDto = normalizarMac(dto.espMacAddress);

  if (macDoSensor && macDoDto && macDoSensor === macDoDto && numeroEscova === dto.numeroEscova) {
    return true;
  }

  return false;
}

export function useTelemetria(motores: MotorResponse[]) {
  const [motoresComStatus, setMotoresComStatus] = useState<MotorComStatus[]>([]);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [statusConexaoHub, setStatusConexaoHub] = useState<StatusConexaoHub>('desconectado');
  const leiturasIniciaisSolicitadas = useRef(new Set<string>());

  // 1. Inicializa o estado dos motores imediatamente na tela (sem disparar loop de GETs lentos)
  useEffect(() => {
    if (!motores || motores.length === 0) {
      setMotoresComStatus([]);
      return;
    }

    setMotoresComStatus((anteriores) => {
      // Preserva leituras já recebidas em tempo real se o motor já existia no estado
      return motores.map((motor) => {
        const motorAnterior = anteriores.find((m) => m.id === motor.id);

        const sensoresProcessados: SensorComTelemetria[] = (motor.sensores || []).map(
          (sensor) => {
            const sensorAnterior = motorAnterior?.sensores.find(
              (s) => s.id === sensor.id
            );

            if (sensorAnterior?.ultimaLeitura) {
              return {
                ...sensor,
                ultimaLeitura: sensorAnterior.ultimaLeitura,
                status: sensorAnterior.status,
              };
            }

            const statusInicial: NivelStatus = sensor.ipAtual ? 'normal' : 'offline';
            return {
              id: sensor.id,
              numeroEscova: sensor.numeroEscova,
              modelo: sensor.modelo,
              ipAtual: sensor.ipAtual,
              ultimaConexao: sensor.ultimaConexao,
              status: statusInicial,
            };
          }
        );

        const statusGeral = calcularStatusGeralDoMotor(sensoresProcessados);
        const temperaturas = sensoresProcessados
          .map((s) => s.ultimaLeitura?.valorCelsius)
          .filter((t): t is number => typeof t === 'number' && !isNaN(t));

        return {
          id: motor.id,
          nome: motor.nome,
          tipo: motor.tipo,
          sensores: sensoresProcessados,
          statusGeral,
          temperaturaMaxima: temperaturas.length > 0 ? Math.max(...temperaturas) : null,
          totalAlertas: sensoresProcessados.filter((s) => s.status === 'perigo').length,
        };
      });
    });
  }, [motores]);

  useEffect(() => {
    const sensores = motores.flatMap((motor) => motor.sensores || []);
    const sensoresPendentes = sensores.filter((sensor) => {
      if (leiturasIniciaisSolicitadas.current.has(sensor.id)) return false;
      leiturasIniciaisSolicitadas.current.add(sensor.id);
      return true;
    });

    if (sensoresPendentes.length === 0) return;

    let cancelado = false;
    void Promise.all(
      sensoresPendentes.map(async (sensor) => {
        const macAddress = leituraService.extrairMacAddress(sensor.id);
        const leitura = await leituraService.obterUltimaLeitura(
          macAddress,
          sensor.numeroEscova
        );
        if (cancelado || !leitura) return;

        setMotoresComStatus((anteriores) =>
          anteriores.map((motor) => {
            const sensorAtual = motor.sensores.find((item) => item.id === sensor.id);
            if (!sensorAtual || sensorAtual.ultimaLeitura) return motor;

            const sensoresAtualizados = motor.sensores.map((item) =>
              item.id === sensor.id
                ? {
                    ...item,
                    ultimaLeitura: {
                      ...leitura,
                      resultadosQualityGates: leitura.resultadosQualityGates ?? [],
                    },
                    status: classificarSensor(
                      leitura.valorCelsius,
                      leitura.alertaDesgaste,
                      true
                    ),
                  }
                : item
            );
            const temperaturas = sensoresAtualizados
              .map((item) => item.ultimaLeitura?.valorCelsius)
              .filter((value): value is number => typeof value === 'number');

            return {
              ...motor,
              sensores: sensoresAtualizados,
              statusGeral: calcularStatusGeralDoMotor(sensoresAtualizados),
              temperaturaMaxima:
                temperaturas.length > 0 ? Math.max(...temperaturas) : null,
              totalAlertas: sensoresAtualizados.filter(
                (item) => item.status === 'perigo'
              ).length,
            };
          })
        );
      })
    );

    return () => {
      cancelado = true;
    };
  }, [motores]);

  // 2. Conexão WebSocket via SignalR e aplicação direta dos pushes em tempo real
  useEffect(() => {
    signalRService.iniciar();

    const unsubStatus = signalRService.onStatusMudou((novoStatus) => {
      setStatusConexaoHub(novoStatus);
    });

    const processarNovasLeituras = (novasLeituras: TelemetriaRealtimeDto[]) => {
      if (!novasLeituras || novasLeituras.length === 0) return;

      console.info(
        `[useTelemetria] Atualizando tela com ${novasLeituras.length} leitura(s) recebida(s) via SignalR...`
      );

      setMotoresComStatus((anteriores) => {
        return anteriores.map((motor) => {
          let houveAlteracao = false;
          const leiturasDoMotor = novasLeituras.filter(
            (leitura) => leitura.motorId === motor.id
          );

          const sensoresAtualizados = motor.sensores.map((sensor) => {
            const leituraMatch = leiturasDoMotor.find((dto) =>
              ehMesmoSensor(sensor.id, sensor.numeroEscova, dto)
            );

            if (!leituraMatch) return sensor;

            houveAlteracao = true;
            const status = classificarSensor(
              leituraMatch.valorCelsius,
              leituraMatch.alertaDesgaste,
              true
            );

            return {
              ...sensor,
              ultimaLeitura: {
                sensorId: leituraMatch.sensorId,
                valorCelsius: leituraMatch.valorCelsius,
                dataHora: leituraMatch.dataHora,
                alertaDesgaste: leituraMatch.alertaDesgaste,
                resultadosQualityGates: leituraMatch.resultadosQualityGates ?? [],
              },
              status,
            };
          });

          if (!houveAlteracao) return motor;

          const statusGeral = calcularStatusGeralDoMotor(sensoresAtualizados);
          const temperaturas = sensoresAtualizados
            .map((s) => s.ultimaLeitura?.valorCelsius)
            .filter((t): t is number => typeof t === 'number' && !isNaN(t));

          return {
            ...motor,
            sensores: sensoresAtualizados,
            statusGeral,
            temperaturaMaxima:
              temperaturas.length > 0 ? Math.max(...temperaturas) : null,
            totalAlertas: sensoresAtualizados.filter((s) => s.status === 'perigo').length,
          };
        });
      });

      setUltimaAtualizacao(new Date());
    };

    const unsubLote = signalRService.onLoteTelemetria(processarNovasLeituras);
    const unsubIndividual = signalRService.onTelemetria((leitura) =>
      processarNovasLeituras([leitura])
    );

    return () => {
      unsubStatus();
      unsubLote();
      unsubIndividual();
    };
  }, []);

  // Métricas globais consolidadas para os KPIs da tela
  const kpis = {
    totalMotores: motoresComStatus.length,
    normais: motoresComStatus.filter((m) => m.statusGeral === 'normal').length,
    atencao: motoresComStatus.filter((m) => m.statusGeral === 'warning').length,
    perigo: motoresComStatus.filter((m) => m.statusGeral === 'perigo').length,
    offline: motoresComStatus.filter((m) => m.statusGeral === 'offline').length,
    totalSensores: motoresComStatus.reduce(
      (acc, m) => acc + (m.sensores?.length || 0),
      0
    ),
  };

  return {
    motoresComStatus,
    kpis,
    ultimaAtualizacao,
    statusConexaoHub,
  };
}
