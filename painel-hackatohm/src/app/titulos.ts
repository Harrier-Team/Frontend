import { TITULO_BASE } from '@/features/eventos/helpers/transicoes';

/** Título da aba por rota (WCAG 2.4.2): a página, depois o produto. A visão geral usa o título padrão. */
export function tituloDaPagina(pathname: string): string {
  const [secao] = pathname.split('/').filter(Boolean);
  switch (secao) {
    case 'motores':
      return /^\/motores\/\d+/.test(pathname) ? 'Motor | Harrier' : TITULO_BASE;
    case 'eventos':
      return 'Eventos | Harrier';
    case 'regras-qualidade':
      return 'Quality gates | Harrier';
    case 'sistema':
      return 'Sistema | Harrier';
    default:
      return TITULO_BASE;
  }
}

/**
 * Chave de "onde o usuário está" para mover o foco ao trocar de página. Trocar de
 * aba dentro do motor (`/motores/3/regras`) não muda a chave, para o foco ficar na aba.
 */
export function chaveDaPagina(pathname: string): string {
  const [secao, id] = pathname.split('/').filter(Boolean);
  return secao === 'motores' && id ? `motores/${id}` : (secao ?? '');
}
