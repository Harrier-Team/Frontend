import { EscovaForm } from '../types/motor';

const MAC_COMPLETO = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/;
const MAC_SEM_SEPARADOR = /^[0-9A-F]{12}$/;

/**
 * Formato canônico `AA:BB:CC:DD:EE:FF`. Aceita maiúsculas ou minúsculas e
 * separadores `:`, `-`, `.` ou espaço (ou nenhum). Texto que não vira um MAC
 * completo volta apenas aparado e em maiúsculas, para a validação apontar o erro.
 */
export function normalizarMac(valor: string): string {
  const limpo = valor.trim().toUpperCase();
  const semSeparadores = limpo.replace(/[:\-.\s]/g, '');
  if (MAC_SEM_SEPARADOR.test(semSeparadores)) {
    return semSeparadores.match(/.{2}/g)!.join(':');
  }
  return limpo;
}

/**
 * Máscara enquanto digita: só hexadecimais, em maiúsculas, em pares separados
 * por ':' (no máximo 12 dígitos). Colar 'aa-bb-cc-dd-ee-ff' também funciona.
 */
export function formatarMacDigitado(valor: string): string {
  const digitos = valor.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 12);
  return (digitos.match(/.{1,2}/g) ?? []).join(':');
}

export function macValido(valor: string): boolean {
  return MAC_COMPLETO.test(normalizarMac(valor));
}

export function validarMac(valor: string): string | null {
  if (!valor.trim()) return 'Informe o MAC do ESP.';
  if (!macValido(valor)) return 'Use o formato AA:BB:CC:DD:EE:FF (6 pares hexadecimais).';
  return null;
}

/** Menor número de escova positivo ainda não usado (1, 2, 3…). */
export function proximoNumeroEscova(escovas: EscovaForm[]): number {
  const usados = new Set(escovas.map((escova) => escova.numeroEscova));
  let candidato = 1;
  while (usados.has(candidato)) candidato += 1;
  return candidato;
}

export interface ErrosCadastro {
  nome?: string;
  tipo?: string;
  mac?: string;
  escovas?: string;
}

export interface DadosCadastro {
  nome: string;
  tipo: string;
  mac: string;
  escovas: EscovaForm[];
}

/**
 * Um motor tem um ESP (um MAC) que envia todas as escovas em cada lote:
 * números de escova inteiros, positivos e únicos, cada um com modelo.
 */
export function validarCadastroMotor(dados: DadosCadastro): ErrosCadastro {
  const erros: ErrosCadastro = {};

  if (!dados.nome.trim()) erros.nome = 'Informe o nome do motor.';
  if (!dados.tipo.trim()) erros.tipo = 'Informe o tipo do motor.';

  const erroMac = validarMac(dados.mac);
  if (erroMac) erros.mac = erroMac;

  if (dados.escovas.length === 0) {
    erros.escovas = 'Cadastre ao menos uma escova.';
    return erros;
  }

  const numeros = dados.escovas.map((escova) => escova.numeroEscova);
  if (numeros.some((n) => n === null || !Number.isInteger(n) || n <= 0)) {
    erros.escovas = 'O número de cada escova deve ser um inteiro positivo.';
  } else if (new Set(numeros).size !== numeros.length) {
    erros.escovas = 'Cada escova precisa de um número diferente.';
  } else if (dados.escovas.some((escova) => !escova.modelo.trim())) {
    erros.escovas = 'Informe o modelo de cada escova.';
  }

  return erros;
}

export function temErros(erros: ErrosCadastro): boolean {
  return Object.keys(erros).length > 0;
}
