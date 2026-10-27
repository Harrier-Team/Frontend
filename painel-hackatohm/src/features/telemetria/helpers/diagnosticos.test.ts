import { describe, expect, it } from 'vitest';
import { gate, gateAguardando, gateAlerta } from '@/features/telemetria/testing/fabricas';
import { agruparDiagnosticos, formatarIntervalo, metadadosDoGate, resumirDiagnosticos } from './diagnosticos';

const assimetria = (sobrescrever = {}) =>
  gate({
    regraQualidadeId: 'regra-assim',
    nomeRegra: 'Assimetria',
    tipoRegra: 'temperatura.assimetria_escovas',
    ...sobrescrever,
  });

describe('agruparDiagnosticos', () => {
  it('mostra a assimetria uma vez, no escopo do motor', () => {
    const repetida = assimetria({ severidade: 'AlertaPreditivo', valorObservado: 25.2, valorLimite: 15 });
    const grupos = agruparDiagnosticos([
      { numeroEscova: 1, resultadosQualityGates: [gate(), repetida] },
      { numeroEscova: 2, resultadosQualityGates: [gateAlerta('Critico'), repetida] },
      { numeroEscova: 3, resultadosQualityGates: [gate(), repetida] },
    ]);

    const grupoAssimetria = grupos.find((g) => g.chave === 'regra-assim')!;
    expect(grupoAssimetria.escopo).toBe('motor');
    expect(grupoAssimetria.itens).toHaveLength(1);
    expect(grupoAssimetria.itens[0].numeroEscova).toBeNull();
    expect(grupoAssimetria.severidade).toBe('AlertaPreditivo');
  });

  it('mantém um item por escova nas regras de escova e ordena por severidade', () => {
    const grupos = agruparDiagnosticos([
      { numeroEscova: 2, resultadosQualityGates: [gateAlerta('Critico')] },
      { numeroEscova: 1, resultadosQualityGates: [gate()] },
    ]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].escopo).toBe('escova');
    expect(grupos[0].itens.map((i) => i.numeroEscova)).toEqual([2, 1]);
    expect(grupos[0].severidade).toBe('Critico');
  });

  it('põe grupos mais graves antes e marca grupo só com amostras faltando', () => {
    const grupos = agruparDiagnosticos([
      {
        numeroEscova: 1,
        resultadosQualityGates: [
          gateAguardando({ regraQualidadeId: 'g' }),
          gateAlerta('AlertaPreditivo', { regraQualidadeId: 'a', nomeRegra: 'Limiar' }),
        ],
      },
    ]);
    expect(grupos[0].chave).toBe('a');
    const esperando = grupos.find((g) => g.chave === 'g')!;
    expect(esperando.aguardando).toBe(true);
    expect(esperando.severidade).toBeNull();
  });

  it('assimetria aguardando amostras não esconde o resultado avaliado de outra escova', () => {
    const grupos = agruparDiagnosticos([
      { numeroEscova: 1, resultadosQualityGates: [assimetria({ codigoRegra: 'DADOS_INSUFICIENTES' })] },
      { numeroEscova: 2, resultadosQualityGates: [assimetria()] },
    ]);
    expect(grupos[0].itens).toHaveLength(1);
    expect(grupos[0].aguardando).toBe(false);
  });

  it('sem leituras ou sem regras, nenhum grupo', () => {
    expect(agruparDiagnosticos([])).toEqual([]);
    expect(agruparDiagnosticos([{ numeroEscova: 1, resultadosQualityGates: [] }])).toEqual([]);
  });
});

describe('resumirDiagnosticos', () => {
  it('conta alertas, críticos, dentro do limite e aguardando, com assimetria uma vez', () => {
    const repetida = assimetria({ severidade: 'AlertaPreditivo' });
    const grupos = agruparDiagnosticos([
      { numeroEscova: 1, resultadosQualityGates: [gate(), gateAguardando({ regraQualidadeId: 'grad' }), repetida] },
      { numeroEscova: 2, resultadosQualityGates: [gateAlerta('Critico'), gateAguardando({ regraQualidadeId: 'grad' }), repetida] },
    ]);
    expect(resumirDiagnosticos(grupos)).toEqual({
      alertas: 2,
      criticos: 1,
      dentroDoLimite: 1,
      aguardando: 2,
      semClassificacao: 0,
    });
  });

  it('severidade desconhecida não conta como dentro do limite', () => {
    const grupos = agruparDiagnosticos([
      { numeroEscova: 1, resultadosQualityGates: [gate({ severidade: 'SemClassificacao' })] },
    ]);
    expect(resumirDiagnosticos(grupos)).toMatchObject({ dentroDoLimite: 0, semClassificacao: 1, alertas: 0 });
  });
});

describe('metadadosDoGate', () => {
  it('gradiente mostra temperatura anterior e intervalo', () => {
    const itens = metadadosDoGate(
      gate({
        tipoRegra: 'temperatura.gradiente_termico',
        metadados: { temperaturaAnterior: 72.1, intervaloSegundos: 3 },
      })
    );
    expect(itens).toEqual([
      { rotulo: 'Temperatura anterior', valor: '72,1 °C' },
      { rotulo: 'Intervalo entre amostras', valor: '3 s' },
    ]);
  });

  it('assimetria mostra mínima e máxima', () => {
    const itens = metadadosDoGate(
      assimetria({ metadados: { temperaturaMinima: 40, temperaturaMaxima: 58 } })
    );
    expect(itens.map((i) => i.valor)).toEqual(['40,0 °C', '58,0 °C']);
  });

  it('chaves ausentes ou inválidas são omitidas sem quebrar', () => {
    expect(metadadosDoGate(gate({ tipoRegra: 'temperatura.gradiente_termico', metadados: null }))).toEqual([]);
    expect(
      metadadosDoGate(
        gate({ tipoRegra: 'temperatura.gradiente_termico', metadados: { temperaturaAnterior: 'x', intervaloSegundos: 5 } })
      )
    ).toEqual([{ rotulo: 'Intervalo entre amostras', valor: '5 s' }]);
    expect(metadadosDoGate(gate({ metadados: { temperaturaAnterior: 50 } }))).toEqual([]);
    expect(metadadosDoGate(gateAguardando())).toEqual([]);
  });

  it('formata intervalos', () => {
    expect(formatarIntervalo(1.5)).toBe('1,5 s');
    expect(formatarIntervalo(120)).toBe('2 min');
    expect(formatarIntervalo(125)).toBe('2 min 5 s');
  });
});
