/** Texto para comparação: sem acentos, sem maiúsculas, sem espaços nas pontas e repetidos. */
export function normalizarBusca(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * O motor combina com a busca quando cada palavra digitada aparece no nome ou
 * no tipo, ignorando acentos e maiúsculas ("trifasico 220" acha "Trifásico 220 V").
 * Busca vazia combina com tudo.
 */
export function motorCombinaComBusca(motor: { nome: string; tipo: string }, busca: string): boolean {
  const termos = normalizarBusca(busca).split(' ').filter(Boolean);
  if (termos.length === 0) return true;
  const alvo = `${normalizarBusca(motor.nome)} ${normalizarBusca(motor.tipo)}`;
  return termos.every((termo) => alvo.includes(termo));
}
