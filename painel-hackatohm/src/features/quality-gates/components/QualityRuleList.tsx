import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { RegraQualidade } from '@/features/quality-gates/types/regraQualidade';
import { IconButton } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Panel } from '@/components/ui/Panel';
import { descreverLimites, obterTipoRegra } from '@/features/quality-gates/helpers/tiposRegra';

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
          {regra.descricao && (
            <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-2">{regra.descricao}</p>
          )}
          <p className="num mt-2 text-[13px] text-ink-2">
            <span className="text-ink-3">{obterTipoRegra(regra.tipoRegra).rotulo}</span>
            {' · '}
            {descreverLimites(regra.tipoRegra, regra.parametros)}
          </p>
        </div>
        <Switch
          checked={regra.ativo}
          disabled={salvando}
          label={regra.ativo ? 'Desativar regra' : 'Ativar regra'}
          onChange={() => onToggle(regra)}
        />
        <div className="flex gap-1">
          <IconButton label={`Editar ${regra.nome}`} onClick={() => onEdit(regra)}>
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
