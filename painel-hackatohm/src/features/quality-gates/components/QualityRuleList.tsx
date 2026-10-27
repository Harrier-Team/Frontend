import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { RegraQualidade } from '@/features/quality-gates/types/regraQualidade';
import { IconButton } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Panel } from '@/components/ui/Panel';
import { formatarLimitesRegra, obterTipoRegra, tipoRegraSuportado } from '../helpers/tipoRegraHelper';

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
  <Panel>
    {regras.map((regra) => (
      <article key={regra.id} className="flex items-center gap-4 px-5 py-5">
        <div className={`min-w-0 flex-1 ${regra.ativo ? '' : 'opacity-55'}`}>
          <h2 className="truncate text-[15px] text-ink">{regra.nome}</h2>
          <p className="mt-1 text-xs text-ink-3">{obterTipoRegra(regra.tipoRegra)?.nome ?? regra.tipoRegra}</p>
          {regra.descricao && (
            <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-2">{regra.descricao}</p>
          )}
          <p className="num mt-2 text-[13px] text-ink-2">
            {formatarLimitesRegra(regra)}
          </p>
        </div>
        <Switch
          checked={regra.ativo}
          disabled={salvando || !tipoRegraSuportado(regra.tipoRegra)}
          label={regra.ativo ? 'Desativar regra' : 'Ativar regra'}
          onChange={() => onToggle(regra)}
        />
        <div className="flex gap-1">
          <IconButton label={`Editar ${regra.nome}`} onClick={() => onEdit(regra)}
            disabled={salvando || !tipoRegraSuportado(regra.tipoRegra)}
            title={!tipoRegraSuportado(regra.tipoRegra) ? 'Atualize o painel para editar este tipo.' : undefined}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </IconButton>
          <IconButton
            label={`Excluir ${regra.nome}`}
            disabled={excluindoId === regra.id}
            onClick={() => onDelete(regra)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>
      </article>
    ))}
  </Panel>
);
