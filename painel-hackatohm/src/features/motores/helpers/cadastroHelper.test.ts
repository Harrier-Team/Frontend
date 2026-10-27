import { describe, expect, it } from 'vitest';
import {
  macValido,
  normalizarMac,
  proximoNumeroEscova,
  temErros,
  validarCadastroMotor,
  validarMac,
} from './cadastroHelper';

const escova = (numeroEscova: number | null, modelo = 'DS18B20') => ({ numeroEscova, modelo });

describe('MAC do ESP', () => {
  it('aceita AA:BB:CC:DD:EE:FF em maiúsculas ou minúsculas', () => {
    expect(macValido('AA:BB:CC:DD:EE:FF')).toBe(true);
    expect(macValido('aa:bb:cc:dd:ee:ff')).toBe(true);
    expect(macValido('  24:DC:C3:9C:12:34 ')).toBe(true);
  });

  it('normaliza hífen, ponto e ausência de separador para o formato canônico', () => {
    expect(normalizarMac('aa-bb-cc-dd-ee-ff')).toBe('AA:BB:CC:DD:EE:FF');
    expect(normalizarMac('aabb.ccdd.eeff')).toBe('AA:BB:CC:DD:EE:FF');
    expect(normalizarMac('aabbccddeeff')).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('rejeita MAC incompleto, longo demais ou com caracteres não hexadecimais', () => {
    expect(macValido('AA:BB:CC:DD:EE')).toBe(false);
    expect(macValido('AA:BB:CC:DD:EE:FF:00')).toBe(false);
    expect(macValido('GG:BB:CC:DD:EE:FF')).toBe(false);
    expect(macValido('')).toBe(false);
    expect(macValido('AABBCCDDEEF')).toBe(false);
  });

  it('retorna mensagem para vazio e para formato inválido', () => {
    expect(validarMac('')).toContain('Informe');
    expect(validarMac('12:34')).toContain('AA:BB:CC:DD:EE:FF');
    expect(validarMac('AA:BB:CC:DD:EE:FF')).toBeNull();
  });
});

describe('validarCadastroMotor', () => {
  const base = {
    nome: 'Motor A',
    tipo: 'Trifásico',
    mac: 'AA:BB:CC:DD:EE:FF',
    escovas: [escova(1), escova(2)],
  };

  it('aceita um motor com um MAC e escovas únicas', () => {
    expect(temErros(validarCadastroMotor(base))).toBe(false);
  });

  it('exige nome, tipo e MAC', () => {
    const erros = validarCadastroMotor({ ...base, nome: ' ', tipo: '', mac: '' });
    expect(erros.nome).toBeDefined();
    expect(erros.tipo).toBeDefined();
    expect(erros.mac).toBeDefined();
  });

  it('exige números de escova positivos, inteiros e únicos', () => {
    expect(validarCadastroMotor({ ...base, escovas: [escova(0)] }).escovas).toContain('positivo');
    expect(validarCadastroMotor({ ...base, escovas: [escova(-1)] }).escovas).toContain('positivo');
    expect(validarCadastroMotor({ ...base, escovas: [escova(1.5)] }).escovas).toContain('positivo');
    expect(validarCadastroMotor({ ...base, escovas: [escova(null)] }).escovas).toContain('positivo');
    expect(validarCadastroMotor({ ...base, escovas: [escova(1), escova(1)] }).escovas).toContain(
      'diferente'
    );
  });

  it('exige modelo em cada escova e ao menos uma escova', () => {
    expect(validarCadastroMotor({ ...base, escovas: [escova(1, ' ')] }).escovas).toContain('modelo');
    expect(validarCadastroMotor({ ...base, escovas: [] }).escovas).toContain('ao menos uma');
  });
});

describe('proximoNumeroEscova', () => {
  it('sugere em sequência e preenche lacunas', () => {
    expect(proximoNumeroEscova([])).toBe(1);
    expect(proximoNumeroEscova([escova(1), escova(2)])).toBe(3);
    expect(proximoNumeroEscova([escova(1), escova(3)])).toBe(2);
  });
});
