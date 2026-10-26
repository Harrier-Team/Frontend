import React from 'react';
import { Pencil, Power, Trash2 } from 'lucide-react';
import { RegraQualidade } from '@/features/quality-gates/types/regraQualidade';
import { Button } from '@/components/ui/Button';

interface QualityRuleListProps {
  regras: RegraQualidade[];
  salvando: boolean;
  excluindoId: string | null;
  onEdit: (regra: RegraQualidade) => void;
  onToggle: (regra: RegraQualidade) => void;
  onDelete: (regra: RegraQualidade) => void;
}

export const QualityRuleList: React.FC<QualityRuleListProps> = ({
  regras,
  salvando,
  excluindoId,
  onEdit,
  onToggle,
  onDelete,
}) => (
  <div className="space-y-3">
    {regras.map((regra) => (
      <article key={regra.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-slate-900">{regra.nome}</h2>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                  regra.ativo
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-100 text-slate-600'
                }`}
              >
                {regra.ativo ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {regra.descricao || 'Sem descrição'}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              {regra.tipoRegra} · Aviso: <strong>{regra.parametros.aviso} °C</strong> ·
              Crítico: <strong>{regra.parametros.critico} °C</strong>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-2 text-xs"
              onClick={() => onEdit(regra)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Editar
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-2 text-xs"
              busy={salvando}
              onClick={() => onToggle(regra)}
            >
              <Power className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {regra.ativo ? 'Desativar' : 'Ativar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="px-3 py-2 text-xs text-rose-700 hover:bg-rose-50"
              busy={excluindoId === regra.id}
              onClick={() => onDelete(regra)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Excluir
            </Button>
          </div>
        </div>
      </article>
    ))}
  </div>
);
