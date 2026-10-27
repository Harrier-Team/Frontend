import { describe, expect, it } from 'vitest';
import { mesclarLeitura, SERIE_VAZIA } from '@/features/telemetria/store/mesclagem';
import { MotorTelemetria } from '@/features/telemetria/store/tipos';
import { leitura } from '@/features/telemetria/testing/fabricas';
import { escolherMac } from './macMotor';

const motorCom = (mac: string | undefined): MotorTelemetria =>
  ({
    escovas: { 1: mesclarLeitura(SERIE_VAZIA, leitura({ espMacAddress: mac })).serie },
  }) as unknown as MotorTelemetria;

describe('escolherMac', () => {
  it('prefere o MAC do lote ao informado no cadastro', () => {
    expect(escolherMac(motorCom('AA:AA:AA:AA:AA:AA'), 'BB:BB:BB:BB:BB:BB')).toBe('AA:AA:AA:AA:AA:AA');
  });

  it('usa o informado quando o lote não traz MAC (status por HTTP)', () => {
    expect(escolherMac(motorCom(undefined), 'BB:BB:BB:BB:BB:BB')).toBe('BB:BB:BB:BB:BB:BB');
    expect(escolherMac(undefined, 'BB:BB:BB:BB:BB:BB')).toBe('BB:BB:BB:BB:BB:BB');
  });

  it('sem nenhuma fonte, nulo', () => {
    expect(escolherMac(undefined, null)).toBeNull();
  });
});
