import { describe, expect, it } from 'vitest';
import { adicionarPonto, MAX_PONTOS, mesclarLeitura, SERIE_VAZIA } from './mesclagem';
import { gateAlerta, iso, leitura } from '../testing/fabricas';

describe('adicionarPonto', () => {
  it('deduplica pelo instante e substitui o ponto existente', () => {
    const a = adicionarPonto([], { t: 1000, v: 50, severidade: null });
    const b = adicionarPonto(a.pontos, { t: 1000, v: 51, severidade: 'Normal' });
    expect(b.duplicado).toBe(true);
    expect(b.pontos).toEqual([{ t: 1000, v: 51, severidade: 'Normal' }]);
  });

  it('mantém ordem cronológica quando chega um ponto antigo', () => {
    const base = [
      { t: 1000, v: 1, severidade: null },
      { t: 3000, v: 3, severidade: null },
    ];
    const { pontos } = adicionarPonto(base, { t: 2000, v: 2, severidade: null });
    expect(pontos.map((p) => p.t)).toEqual([1000, 2000, 3000]);
  });

  it('descarta os pontos mais antigos acima do limite do buffer', () => {
    let pontos: ReturnType<typeof adicionarPonto>['pontos'] = [];
    for (let i = 0; i < MAX_PONTOS + 10; i++) {
      pontos = adicionarPonto(pontos, { t: i * 1000, v: i, severidade: null }).pontos;
    }
    expect(pontos).toHaveLength(MAX_PONTOS);
    expect(pontos[0].t).toBe(10 * 1000);
    expect(pontos[pontos.length - 1].v).toBe(MAX_PONTOS + 9);
  });
});

describe('mesclarLeitura', () => {
  it('registra a primeira leitura como nova amostra e última', () => {
    const r = mesclarLeitura(SERIE_VAZIA, leitura({ dataHora: iso(0) }));
    expect(r.novaAmostra).toBe(true);
    expect(r.substituiuUltima).toBe(true);
    expect(r.serie.pontos).toHaveLength(1);
  });

  it('leitura mais antiga (HTTP atrasado) não sobrescreve a atual, mas entra na curva', () => {
    const nova = mesclarLeitura(SERIE_VAZIA, leitura({ dataHora: iso(10), valorCelsius: 70 })).serie;
    const r = mesclarLeitura(nova, leitura({ dataHora: iso(0), valorCelsius: 40 }));
    expect(r.substituiuUltima).toBe(false);
    expect(r.serie.ultima?.valorCelsius).toBe(70);
    expect(r.serie.pontos.map((p) => p.v)).toEqual([40, 70]);
  });

  it('mesmo instante não duplica ponto, mas atualiza os gates reavaliados', () => {
    const primeira = mesclarLeitura(SERIE_VAZIA, leitura({ dataHora: iso(0) })).serie;
    const r = mesclarLeitura(
      primeira,
      leitura({ dataHora: iso(0), resultadosQualityGates: [gateAlerta('Critico')] })
    );
    expect(r.novaAmostra).toBe(false);
    expect(r.serie.pontos).toHaveLength(1);
    expect(r.serie.pontos[0].severidade).toBe('Critico');
    expect(r.serie.ultima?.resultadosQualityGates[0].severidade).toBe('Critico');
  });

  it('ignora leitura com instante ou valor inválido', () => {
    const r = mesclarLeitura(SERIE_VAZIA, leitura({ dataHora: 'x' }));
    expect(r.serie).toBe(SERIE_VAZIA);
    expect(mesclarLeitura(SERIE_VAZIA, leitura({ valorCelsius: Number.NaN })).serie).toBe(
      SERIE_VAZIA
    );
  });
});
