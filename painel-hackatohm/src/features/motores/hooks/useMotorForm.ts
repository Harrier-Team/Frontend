import { useState } from 'react';
import { EscovaForm, MotorInput } from '../types/motor';
import {
  DadosCadastro,
  ErrosCadastro,
  normalizarMac,
  proximoNumeroEscova,
  temErros,
  validarCadastroMotor,
} from '../helpers/cadastroHelper';

const MODELO_PADRAO = 'MLX90614';

const escovaInicial = (): EscovaForm => ({ numeroEscova: 1, modelo: MODELO_PADRAO });

export function useMotorForm() {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [mac, setMac] = useState('');
  const [escovas, setEscovas] = useState<EscovaForm[]>([escovaInicial()]);

  const atualizarEscova = <K extends keyof EscovaForm>(
    index: number,
    campo: K,
    valor: EscovaForm[K]
  ) => {
    setEscovas((atuais) =>
      atuais.map((escova, i) => (i === index ? { ...escova, [campo]: valor } : escova))
    );
  };

  const adicionarEscova = () => {
    setEscovas((atuais) => [
      ...atuais,
      { numeroEscova: proximoNumeroEscova(atuais), modelo: atuais.at(-1)?.modelo || MODELO_PADRAO },
    ]);
  };

  const removerEscova = (index: number) => {
    setEscovas((atuais) => (atuais.length > 1 ? atuais.filter((_, i) => i !== index) : atuais));
  };

  const dados = (): DadosCadastro => ({ nome, tipo, mac, escovas });

  /** Erros do formulário atual; vazio quando pode enviar. */
  const validar = (): ErrosCadastro => validarCadastroMotor(dados());

  /** O backend ainda pede o MAC em cada sensor: repete o único MAC do ESP. */
  const criarPayload = (): MotorInput => {
    const macAddress = normalizarMac(mac);
    return {
      nome: nome.trim(),
      tipo: tipo.trim(),
      sensoresIniciais: escovas.map((escova) => ({
        macAddress,
        numeroEscova: Number(escova.numeroEscova),
        modelo: escova.modelo.trim(),
      })),
    };
  };

  const limpar = () => {
    setNome('');
    setTipo('');
    setMac('');
    setEscovas([escovaInicial()]);
  };

  return {
    nome,
    tipo,
    mac,
    escovas,
    setNome,
    setTipo,
    setMac,
    atualizarEscova,
    adicionarEscova,
    removerEscova,
    validar,
    temErros,
    criarPayload,
    limpar,
  };
}
