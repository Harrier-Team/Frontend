import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ResultadoGateRealtime } from '../types/qualityGate';
import { normalizarResultadosQualityGates } from '../helpers/qualityGateHelper';
import { QualityGateResultList } from './QualityGateResultList';
import { QualityGateResult } from './QualityGateResult';
import { EscovaItem } from '@/features/motores/components/EscovaItem';
import { classificarSensor, reclassificarMotor } from '@/features/telemetria/helpers/statusHelper';
import { MotorRow } from '@/features/motores/components/MotorRow';
import { MemoryRouter } from 'react-router-dom';

const critico: ResultadoGateRealtime = {
  regraQualidadeId: 'regra-1', nomeRegra: 'Limite temperatura Máxima',
  disparouAlerta: true, severidade: 'Critico',
  tipoRegra: 'temperatura.limiar_estatico', codigoRegra: 'TEMP_CRITICA',
  mensagemDiagnostico: 'Escova 1 atingiu temperatura crítica de 37,5 °C.',
  valorObservado: 37.5, valorLimite: 35, metadados: null,
};

describe('apresentação dos quality gates', () => {
  it.each([3, '3', 'Crítico', 'Critico', undefined, 'Normal'])(
    'reproduz a captura de 37,5 °C / limite 35 °C com severidade %s sem ocultar o crítico',
    (severidade) => {
      const raw = { ...critico, severidade };
      const resultados = normalizarResultadosQualityGates([raw]);
      const status = classificarSensor(37.5, true, resultados);
      expect(status).toBe('perigo');
      const html = renderToStaticMarkup(createElement(EscovaItem, { sensor: {
        id: 'sensor-1', numeroEscova: 1, modelo: 'MLX', status,
        ultimaLeitura: { sensorId: 'sensor-1', valorCelsius: 37.5,
          dataHora: '2026-10-26T21:00:00Z', alertaDesgaste: true,
          resultadosQualityGates: resultados },
      } }));
      expect(html).toContain('data-severidade="Critico"');
      expect(html).toContain('Gates em alerta');
      expect(html).toContain('var(--color-hot)');
      expect(html).toContain('>Crítico<');
      expect(html).not.toContain('>Normal<');
      expect(html).not.toContain('>Atenção<');
      expect(html).not.toContain('role="meter"');
    }
  );

  it('resolve também uma leitura antiga que ainda está em memória com severidade numérica', () => {
    const antigo = { ...critico, severidade: 3 } as unknown as ResultadoGateRealtime;
    expect(classificarSensor(37.5, true, [antigo])).toBe('perigo');
    const html = renderToStaticMarkup(createElement(QualityGateResult, { resultado: antigo }));
    expect(html).toContain('>Crítico<');
    expect(html).not.toContain('>Normal<');
  });

  it('reclassifica uma escova e um motor que estavam guardados como atenção', () => {
    const motor = reclassificarMotor({
      id: 1, nome: 'Motor', tipo: 'Teste', statusGeral: 'warning',
      temperaturaMaxima: 37.5, totalAlertas: 0,
      sensores: [{ id: 'sensor-1', numeroEscova: 1, modelo: 'MLX', status: 'warning',
        ultimaLeitura: { sensorId: 'sensor-1', valorCelsius: 37.5,
          dataHora: '2026-10-26T21:00:00Z', alertaDesgaste: true,
          resultadosQualityGates: [{ ...critico, severidade: 'Normal' }] },
      }],
    });
    expect(motor.sensores[0].status).toBe('perigo');
    expect(motor.statusGeral).toBe('perigo');
    expect(motor.totalAlertas).toBe(1);
  });

  it('destaca críticos antes dos avisos e mantém normais na lista completa com sua cor', () => {
    const normal = { ...critico, nomeRegra: 'Gate verde', severidade: 'Normal' as const,
      codigoRegra: 'OK', disparouAlerta: false };
    const aviso = { ...critico, nomeRegra: 'Gate amarelo', severidade: 'AlertaPreditivo' as const,
      codigoRegra: 'TEMP_ALERTA_PREDITIVO' };
    const html = renderToStaticMarkup(createElement(QualityGateResultList, {
      resultados: [normal, aviso, { ...critico, nomeRegra: 'Gate vermelho' }],
    }));
    const [destaques, todas] = html.split('<details');
    expect(destaques.indexOf('Gate vermelho')).toBeLessThan(destaques.indexOf('Gate amarelo'));
    expect(destaques).not.toContain('Gate verde');
    expect(todas).toContain('Gate verde');
    expect(todas).toContain('data-severidade="Normal"');
    expect(todas).toContain('var(--color-ok)');
    expect(destaques).toContain('data-severidade="AlertaPreditivo"');
    expect(destaques).toContain('var(--color-warn)');
    expect(html).toContain('Todas as regras desta leitura (3)');
  });

  it('não rotula um resultado desconhecido como tudo normal', () => {
    const [resultado] = normalizarResultadosQualityGates([
      { ...critico, severidade: 'nova-severidade', codigoRegra: 'NOVO_CODIGO' },
    ]);
    const html = renderToStaticMarkup(createElement(QualityGateResult, { resultado }));
    expect(html).toContain('Sem classificação');
    expect(html).not.toContain('>Normal<');
  });

  it('exibe a temperatura sem barra nem avaliação inventada quando não há gates', () => {
    const motor = reclassificarMotor({
      id: 1, nome: 'Motor', tipo: 'Teste', statusGeral: 'perigo',
      temperaturaMaxima: 150, totalAlertas: 1,
      sensores: [{ id: 'sensor-1', numeroEscova: 1, modelo: 'MLX', status: 'perigo',
        ultimaLeitura: { sensorId: 'sensor-1', valorCelsius: 150,
          dataHora: '2026-10-26T21:00:00Z', alertaDesgaste: true,
          resultadosQualityGates: [] },
      }],
    });
    expect(motor.statusGeral).toBe('sem_avaliacao');
    expect(motor.totalAlertas).toBe(0);
    const detalhe = renderToStaticMarkup(createElement(EscovaItem, { sensor: motor.sensores[0] }));
    const linha = renderToStaticMarkup(createElement(MemoryRouter, null,
      createElement(MotorRow, { motor })));
    for (const html of [detalhe, linha]) {
      expect(html).toContain('150,0');
      expect(html).toContain('Sem avaliação');
      expect(html).not.toContain('role="meter"');
      expect(html).not.toContain('>Crítico<');
    }
  });
});
