import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '@/types/api';
import { listarErrosDeCampo, obterMensagemErro } from './errorHelper';

describe('erros do cadastro', () => {
  it('traduz o código de sensores já cadastrados', () => {
    const erro = new ApiRequestError('x', { status: 409, code: 'sensors_already_registered' });
    expect(obterMensagemErro(erro)).toContain('já está cadastrado');
  });

  it('lista as mensagens por campo sem repetir', () => {
    const erro = new ApiRequestError('x', {
      status: 400,
      code: 'invalid_payload',
      errors: { Nome: ['O nome é obrigatório.'], Tipo: ['O nome é obrigatório.', 'Tipo inválido.'] },
    });
    expect(listarErrosDeCampo(erro)).toEqual(['O nome é obrigatório.', 'Tipo inválido.']);
    expect(listarErrosDeCampo(new Error('x'))).toEqual([]);
  });
});
