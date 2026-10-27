import { describe, expect, it } from 'vitest';
import { normalizarSeveridade, normalizarStatus } from './normalizacao';
import { MotorStatusDto } from '@/features/telemetria/types/telemetria';

describe('normalizarSeveridade', () => {
  it('aceita strings e os números 0 a 3 de versões antigas', () => {
    expect(normalizarSeveridade('Critico')).toBe('Critico');
    expect(normalizarSeveridade('alertapreditivo')).toBe('AlertaPreditivo');
    expect(normalizarSeveridade(1)).toBe('Atencao');
    expect(normalizarSeveridade(3)).toBe('Critico');
    expect(normalizarSeveridade(undefined)).toBe('Normal');
  });
});

describe('normalizarStatus', () => {
  it('garante listas de gates e campos opcionais nulos', () => {
    const bruto = {
      motorId: 3,
      severidadeGeral: 'Critico',
      situacao: 'Online',
      contagem: { normal: 1, atencao: 0, alertaPreditivo: 0, critico: 1 },
      motivo: null,
      escovas: [
        {
          sensorId: 'X-1',
          numeroEscova: 1,
          valorCelsius: 70,
          severidade: 2,
          dataHora: '2026-10-26T14:30:00+00:00',
          alertaDesgaste: true,
        },
      ],
    } as unknown as MotorStatusDto;

    const status = normalizarStatus(bruto);
    expect(status.escovas[0].resultadosQualityGates).toEqual([]);
    expect(status.escovas[0].severidade).toBe('AlertaPreditivo');
    expect(status.situacao).toBe('Online');
  });
});
