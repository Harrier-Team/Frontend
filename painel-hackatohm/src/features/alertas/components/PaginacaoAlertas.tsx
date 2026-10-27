import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { totalDePaginas } from '../helpers/filtros';

interface PaginacaoAlertasProps {
  pagina: number;
  tamanho: number;
  total: number;
  ocupado?: boolean;
  onMudar: (pagina: number) => void;
}

/** "Página 2 de 7 · 320 alertas", com Anterior e Próxima. */
export const PaginacaoAlertas: React.FC<PaginacaoAlertasProps> = ({ pagina, tamanho, total, ocupado = false, onMudar }) => {
  const paginas = totalDePaginas(total, tamanho);
  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3">
      <p role="status" className="num text-[13px] text-ink-2">
        Página {pagina} de {paginas} · {total} {total === 1 ? 'alerta' : 'alertas'}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={ocupado || pagina <= 1} onClick={() => onMudar(pagina - 1)}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </Button>
        <Button variant="secondary" size="sm" disabled={ocupado || pagina >= paginas} onClick={() => onMudar(pagina + 1)}>
          Próxima
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
};
