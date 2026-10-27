import { describe, expect, it } from 'vitest';
import type { RegraQualidade, TipoRegra } from '../types/regraQualidade';
import { TIPOS_REGRA, formatarValorRegra, formatarLimitesRegra } from './tipoRegraHelper';
import { criarValoresFormulario, criarPayloadFormulario, trocarTipoFormulario } from './regraFormHelper';
import { criarPayloadAtualizacao } from './regraPayloadHelper';
import { validarRegraQualidade } from './validationHelper';

export const criarRegraTeste = (tipoRegra: string): RegraQualidade => ({
  id: 'regra-1', nome: 'Regra de teste', descricao: 'Descrição', tipoRegra,
  severidadePadrao: 'AlertaPreditivo', parametros: { aviso: 2, critico: 5 },
  ativo: true, criadoEm: '2026-10-26T12:00:00Z',
});

describe('formulário e preservação de tipos', () => {
  it.each(Object.keys(TIPOS_REGRA) as TipoRegra[])(
    'preserva %s na edição, pausa e reativação', (tipo) => {
      const regra = criarRegraTeste(tipo);
      const valores = criarValoresFormulario(regra);
      expect(validarRegraQualidade(valores)).toEqual({});
      expect(criarPayloadFormulario(valores)).toEqual({
        nome: regra.nome, descricao: regra.descricao, tipoRegra: tipo,
        parametros: regra.parametros, ativo: true,
      });
      expect(criarPayloadAtualizacao(regra, false)).toEqual({
        nome: regra.nome, descricao: regra.descricao, tipoRegra: tipo,
        parametros: regra.parametros, ativo: false,
      });
      expect(criarPayloadAtualizacao({ ...regra, ativo: false }, true).tipoRegra).toBe(tipo);
      expect(regra.ativo).toBe(true);
    }
  );

  it('não sugere limites operacionais e limpa os números ao trocar unidade', () => {
    const inicial = criarValoresFormulario();
    expect(Number.isNaN(inicial.parametros.aviso)).toBe(true);
    const editando = criarValoresFormulario(criarRegraTeste('temperatura.limiar_estatico'));
    const novo = trocarTipoFormulario(editando, 'temperatura.gradiente_termico');
    expect(novo.nome).toBe(editando.nome); expect(novo.descricao).toBe(editando.descricao);
    expect(Number.isNaN(novo.parametros.aviso)).toBe(true);
    expect(Number.isNaN(novo.parametros.critico)).toBe(true);
    expect(validarRegraQualidade(novo).aviso).toBeDefined();
    expect(editando.parametros.aviso).toBe(2);
  });

  it('bloqueia atualizações de tipos futuros sem converter seus parâmetros', () => {
    const regra = criarRegraTeste('temperatura.futura');
    expect(() => criarPayloadAtualizacao(regra)).toThrow('Atualize');
    expect(() => criarPayloadFormulario(criarValoresFormulario(regra))).toThrow('não suportado');
  });

  it('envia campos explícitos, nome sem espaços e descrição vazia como null', () => {
    const values = { ...criarValoresFormulario(criarRegraTeste('temperatura.gradiente_termico')),
      nome: '  Tendência  ', descricao: '  ' };
    expect(criarPayloadFormulario(values)).toMatchObject({
      nome: 'Tendência', descricao: null, tipoRegra: 'temperatura.gradiente_termico',
    });
  });

  it('formata a unidade da grandeza e não inventa unidade para tipo desconhecido', () => {
    expect(formatarValorRegra(5.25, 'temperatura.gradiente_termico')).toBe('5,25 °C/min');
    expect(formatarValorRegra(5, 'temperatura.assimetria_escovas')).toBe('5,0 °C de diferença');
    expect(formatarValorRegra(null, 'temperatura.limiar_estatico')).toBe('--');
    expect(formatarValorRegra(5, 'tipo.futuro')).toBe('5,0');
    expect(formatarLimitesRegra(criarRegraTeste('tipo.futuro'))).toContain('não suportado');
  });
});
