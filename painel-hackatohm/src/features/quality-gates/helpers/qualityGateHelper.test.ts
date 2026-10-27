import { describe, expect, it } from 'vitest';
import { formatarSeveridade, normalizarResultadosQualityGates, normalizarSeveridade, obterSeveridadeGate, SEVERIDADE_THEME } from './qualityGateHelper';
import type { ResultadoGateRecebido } from '../types/qualityGate';

describe('qualityGateHelper', () => {
  it('formata severidades conhecidas', () => {
    expect(formatarSeveridade('Normal')).toBe('Normal');
    expect(formatarSeveridade('AlertaPreditivo')).toBe('Alerta preditivo');
    expect(formatarSeveridade('Critico')).toBe('Crítico');
  });

  it.each(['3', 'critico', 'Crítico', ' CRITICO '])('reconhece crítico no formato %s', (valor) => {
    expect(normalizarSeveridade(valor)).toBe('Critico');
  });

  it.each([undefined, null, 7, 'desconhecido'])('não apresenta severidade desconhecida como normal: %s', (valor) => {
    expect(normalizarSeveridade(valor)).toBe('Indisponivel');
    expect(formatarSeveridade(valor)).toBe('Sem classificação');
  });

  it.each(['TEMP_CRITICA', 'GRADIENTE_TERMICO_CRITICO', 'ASSIMETRIA_ESCOVAS_CRITICA'])(
    'respeita o código explícito %s mesmo com severidade ausente ou contraditória', (codigoRegra) => {
      expect(obterSeveridadeGate({ codigoRegra })).toBe('Critico');
      expect(obterSeveridadeGate({ severidade: 'Normal', codigoRegra })).toBe('Critico');
    }
  );

  it('mantém aviso como aviso e não infere criticidade pela mensagem', () => {
    expect(obterSeveridadeGate({ codigoRegra: 'TEMP_ALERTA_PREDITIVO' })).toBe('AlertaPreditivo');
    expect(obterSeveridadeGate({ severidade: 'Critico', codigoRegra: 'OK' })).toBe('Critico');
  });

  it.each([
    [0, 'Normal'], [1, 'Atencao'], [2, 'AlertaPreditivo'], [3, 'Critico'],
    ['Normal', 'Normal'], ['Atencao', 'Atencao'],
    ['AlertaPreditivo', 'AlertaPreditivo'], ['Critico', 'Critico'],
  ] as const)('normaliza a severidade %s para %s', (recebida, esperada) => {
    const gate: ResultadoGateRecebido = {
      regraQualidadeId: 'regra-1', nomeRegra: 'Limite',
      disparouAlerta: recebida !== 0 && recebida !== 'Normal', severidade: recebida,
      tipoRegra: 'temperatura.limiar_estatico', codigoRegra: 'TESTE',
      mensagemDiagnostico: 'Diagnostico', valorObservado: 32,
      valorLimite: 30, metadados: { origem: 'teste' },
    };
    const [normalizado] = normalizarResultadosQualityGates([gate]);
    expect(normalizado).toEqual({ ...gate, severidade: esperada });
    expect(gate.severidade).toBe(recebida);
    if (esperada === 'Critico') {
      expect(SEVERIDADE_THEME[normalizado.severidade].label).toBe('Crítico');
      expect(SEVERIDADE_THEME[normalizado.severidade].textClass).toBe('text-hot');
    }
  });
});
