import { beforeEach, describe, expect, it, vi } from 'vitest';
import { regraQualidadeService } from './regraQualidadeService';
import { criarPayloadAtualizacao } from '../helpers/regraPayloadHelper';
import { TIPOS_REGRA } from '../helpers/tipoRegraHelper';
import type { RegraQualidade, TipoRegra } from '../types/regraQualidade';

const { post, put } = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn() }));
vi.mock('@/services/api', () => ({ api: { post, put } }));

describe('requisições do catálogo', () => {
  beforeEach(() => vi.clearAllMocks());
  it.each(Object.keys(TIPOS_REGRA) as TipoRegra[])(
    'envia %s explicitamente na criação, edição, pausa e reativação', async (tipoRegra) => {
      const regra: RegraQualidade = {
        id: 'abc', nome: 'Regra', descricao: null, tipoRegra, parametros: { aviso: 2, critico: 5 },
        ativo: true, severidadePadrao: 'AlertaPreditivo', criadoEm: '2026-10-26T00:00:00Z',
      };
      post.mockResolvedValue({ data: regra }); put.mockResolvedValue({ data: regra });
      await regraQualidadeService.criar(criarPayloadAtualizacao(regra));
      expect(post).toHaveBeenCalledWith('/regras-qualidade', expect.objectContaining({
        tipoRegra, parametros: { aviso: 2, critico: 5 }, ativo: true,
      }));
      for (const ativo of [true, false, true]) {
        await regraQualidadeService.atualizar(regra.id, criarPayloadAtualizacao(regra, ativo));
        expect(put).toHaveBeenLastCalledWith('/regras-qualidade/abc', expect.objectContaining({
          tipoRegra, parametros: { aviso: 2, critico: 5 }, ativo,
        }));
      }
    }
  );
  it('propaga a rejeição HTTP para que o formulário preserve os valores e exiba os campos', async () => {
    const falha = new Error('Erro de validação');
    post.mockRejectedValue(falha);
    await expect(regraQualidadeService.criar({ tipoRegra: 'temperatura.gradiente_termico',
      nome: 'Regra', parametros: { aviso: 2, critico: 5 }, ativo: true })).rejects.toBe(falha);
  });
});
