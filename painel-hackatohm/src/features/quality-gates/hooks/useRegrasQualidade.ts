import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '@/types/api';
import {
  RegraQualidade,
  RegraQualidadeRequest,
} from '@/features/quality-gates/types/regraQualidade';
import { regraQualidadeService } from '@/features/quality-gates/services/regraQualidadeService';
import { obterMensagemErro } from '@/utils/errorHelper';
import { criarPayloadAtualizacao } from '../helpers/regraPayloadHelper';

export function useRegrasQualidade() {
  const [regras, setRegras] = useState<RegraQualidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      setRegras(await regraQualidadeService.listar());
    } catch (error) {
      setErro(obterMensagemErro(error, 'Não foi possível carregar as regras.'));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    // O catálogo precisa sincronizar seu estado com a API ao montar.
    // oxlint-disable-next-line react/set-state-in-effect
    void recarregar();
  }, [recarregar]);

  const criar = async (payload: RegraQualidadeRequest) => {
    setSalvando(true);
    setErro(null);
    try {
      const criada = await regraQualidadeService.criar(payload);
      setRegras((anteriores) =>
        [...anteriores, criada].sort((a, b) => a.nome.localeCompare(b.nome))
      );
      return criada;
    } catch (error) {
      setErro(obterMensagemErro(error, 'Não foi possível criar a regra.'));
      throw error;
    } finally {
      setSalvando(false);
    }
  };

  const atualizar = async (id: string, payload: RegraQualidadeRequest) => {
    setSalvando(true);
    setErro(null);
    try {
      const atualizada = await regraQualidadeService.atualizar(id, payload);
      setRegras((anteriores) =>
        anteriores
          .map((regra) => (regra.id === id ? atualizada : regra))
          .sort((a, b) => a.nome.localeCompare(b.nome))
      );
      return atualizada;
    } catch (error) {
      setErro(obterMensagemErro(error, 'Não foi possível atualizar a regra.'));
      throw error;
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: string) => {
    setExcluindoId(id);
    setErro(null);
    try {
      await regraQualidadeService.excluir(id);
      setRegras((anteriores) => anteriores.filter((regra) => regra.id !== id));
    } catch (error) {
      setErro(obterMensagemErro(error, 'Não foi possível excluir a regra.'));
      throw error;
    } finally {
      setExcluindoId(null);
    }
  };

  const alternarAtivo = async (regra: RegraQualidade) =>
    atualizar(regra.id, criarPayloadAtualizacao(regra, !regra.ativo));

  return {
    regras,
    carregando,
    salvando,
    excluindoId,
    erro,
    recarregar,
    criar,
    atualizar,
    excluir,
    alternarAtivo,
    isConflict: (error: unknown) =>
      error instanceof ApiRequestError && error.status === 409,
  };
}
