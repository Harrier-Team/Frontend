import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { QualityRuleForm } from './QualityRuleForm';
import { QualityRuleList } from './QualityRuleList';
import { QualityGateResultList } from './QualityGateResultList';
import { QualityGateResult } from './QualityGateResult';
import { TIPOS_REGRA } from '../helpers/tipoRegraHelper';
import { normalizarResultadosQualityGates } from '../helpers/qualityGateHelper';
import { classificarSensor } from '@/features/telemetria/helpers/statusHelper';
import type { RegraQualidade, TipoRegra } from '../types/regraQualidade';
import type { ResultadoGateRealtime } from '../types/qualityGate';

const regra = (tipoRegra: string): RegraQualidade => ({
  id: 'regra-1', nome: 'Regra', descricao: null, tipoRegra, parametros: { aviso: 3, critico: 7 },
  ativo: true, severidadePadrao: 'AlertaPreditivo', criadoEm: '2026-10-26T12:00:00Z',
});
const resultado = (tipoRegra: string): ResultadoGateRealtime => ({
  regraQualidadeId: 'regra-1', nomeRegra: 'Regra', tipoRegra, severidade: 'AlertaPreditivo',
  disparouAlerta: true, codigoRegra: 'TESTE', mensagemDiagnostico: 'Diagnóstico do servidor',
  valorObservado: 5.25, valorLimite: 3, metadados: null,
});

describe('interface dos três tipos de regra', () => {
  it.each(Object.keys(TIPOS_REGRA) as TipoRegra[])(
    'edita %s com seletor, valores existentes e unidade correta', (tipo) => {
      const html = renderToStaticMarkup(createElement(QualityRuleForm, {
        regra: regra(tipo), salvando: false, onSubmit: vi.fn(), onCancel: vi.fn(),
      }));
      expect(html).toContain('Tipo de regra');
      expect(html).toContain(`value="${tipo}" selected`);
      expect(html).toContain(TIPOS_REGRA[tipo].unidade);
      expect(html).toContain('value="3"'); expect(html).toContain('value="7"');
      expect(html).toContain(TIPOS_REGRA[tipo].requisito);
      const lista = renderToStaticMarkup(createElement(QualityRuleList, {
        regras: [regra(tipo)], salvando: false, excluindoId: null,
        onEdit: vi.fn(), onDelete: vi.fn(), onToggle: vi.fn(),
      }));
      expect(lista).toContain(TIPOS_REGRA[tipo].nome);
      expect(lista).toContain(TIPOS_REGRA[tipo].unidade);
    }
  );

  it('protege um formulário com tipo futuro sem permitir envio', () => {
    const html = renderToStaticMarkup(createElement(QualityRuleForm, {
      regra: regra('tipo.futuro'), salvando: false, onSubmit: vi.fn(), onCancel: vi.fn(),
    }));
    expect(html).toContain('Tipo de regra não suportado');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('type="submit"');
  });

  it('exibe gradiente e contexto em unidades distintas sem confundir taxa e temperatura', () => {
    const html = renderToStaticMarkup(createElement(QualityGateResult, { resultado: {
      ...resultado('temperatura.gradiente_termico'),
      metadados: { temperaturaAnterior: 40, intervaloSegundos: 120 },
    } }));
    expect(html).toContain('5,25 °C/min');
    expect(html).toContain('40 °C'); expect(html).toContain('120 s');
    expect(html).toContain('Temperatura anterior');
  });

  it('exibe a diferença e temperaturas mínima e máxima da assimetria', () => {
    const html = renderToStaticMarkup(createElement(QualityGateResult, { resultado: {
      ...resultado('temperatura.assimetria_escovas'),
      metadados: { temperaturaMinima: 40, temperaturaMaxima: 45.25 },
    } }));
    expect(html).toContain('5,25 °C de diferença');
    expect(html).toContain('40 °C'); expect(html).toContain('45,25 °C');
    expect(html).toContain('Menor temperatura');
  });

  it('preserva dados ausentes e não inventa unidade em um tipo futuro', () => {
    const html = renderToStaticMarkup(createElement(QualityGateResult, { resultado: {
      ...resultado('tipo.futuro'), valorObservado: null,
    } }));
    expect(html).toContain('--'); expect(html).toContain('tipo.futuro');
    expect(html).toContain('Unidade não informada'); expect(html).not.toContain('°C');
  });

  it.each(['temperatura.gradiente_termico', 'temperatura.assimetria_escovas'])(
    '%s sem contexto aparece como dados insuficientes, sem dizer normal ou alerta', (tipo) => {
      const resultados = normalizarResultadosQualityGates([{
        ...resultado(tipo), severidade: 0, disparouAlerta: false,
        codigoRegra: 'DADOS_INSUFICIENTES', valorObservado: null, valorLimite: null,
        metadados: { avaliacaoConcluida: false },
      }]);
      expect(classificarSensor(40, true, resultados)).toBe('sem_avaliacao');
      const html = renderToStaticMarkup(createElement(QualityGateResultList, { resultados }));
      expect(html).toContain('Dados insuficientes');
      expect(html).toContain('Avaliação indisponível');
      expect(html).not.toContain('Gates em alerta');
      expect(html).not.toContain('>Normal<');
      expect(html).not.toContain('regra dentro do limite');
    }
  );
});
