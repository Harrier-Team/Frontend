import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { RegraQualidade } from '@/features/quality-gates/types/regraQualidade';
import { IconButton } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Panel } from '@/components/ui/Panel';
import {
  agruparRegrasPorTipo,
  descreverLimites,
  ehRegraEditavel,
  ROTULO_CATEGORIA,
} from '@/features/quality-gates/helpers/tiposRegra';

interface QualityRuleListProps {
  regras: RegraQualidade[];
  /** Motores que usam cada regra; null enquanto carrega ou se a consulta falhou. */
  uso: Record<string, number> | null;
  salvando: boolean;
  excluindoId: string | null;
  onEdit: (regra: RegraQualidade) => void;
  onToggle: (regra: RegraQualidade) => void;
  onDelete: (regra: RegraQualidade) => void;
}

function textoDeUso(n: number | undefined): string {
  if (!n) return 'Nenhum motor usa esta regra';
  return n === 1 ? 'Usada em 1 motor' : `Usada em ${n} motores`;
}

/**
 * Catálogo agrupado pela categoria do backend (Preditivo, Aceleração, Condição)
 * e, dentro dela, por tipo, cada grupo com a unidade dos seus limites.
 */
export const QualityRuleList: React.FC<QualityRuleListProps> = ({
  regras,
  uso,
  salvando,
  excluindoId,
  onEdit,
  onToggle,
  onDelete,
}) => (
  <div className="space-y-10">
    {agruparRegrasPorTipo(regras).map(({ info, regras: doTipo }, indice, grupos) => (
      <section key={info.tipo} aria-labelledby={`grupo-${info.tipo}`} className="space-y-3">
        <div>
          {info.categoria && info.categoria !== grupos[indice - 1]?.info.categoria && (
            <p className="eyebrow mb-1.5">{ROTULO_CATEGORIA[info.categoria]}</p>
          )}
          <h2 id={`grupo-${info.tipo}`} className="display text-base">
            {info.rotulo}
            {info.unidade && <span className="num ml-2 text-[13px] text-ink-3">{info.unidade}</span>}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">
            {info.conhecido ? `${info.subtitulo}. ${info.avalia}` : info.subtitulo}
          </p>
        </div>
        <Panel>
          {doTipo.map((regra) => {
            const editavel = ehRegraEditavel(regra);
            return (
            <article key={regra.id} className="flex items-center gap-4 px-5 py-4">
              <div className={`min-w-0 flex-1 ${regra.ativo ? '' : 'opacity-60'}`}>
                <h3 className="truncate text-[15px] text-ink">{regra.nome}</h3>
                {regra.descricao && (
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-2">{regra.descricao}</p>
                )}
                <p className="num mt-1.5 text-[13px] text-ink-2">
                  {descreverLimites(regra.tipoRegra, regra.parametros)}
                  {uso && (
                    <>
                      <span aria-hidden="true" className="px-1.5 text-ink-3">
                        ·
                      </span>
                      <span className="text-ink-3">{textoDeUso(uso[regra.id])}</span>
                    </>
                  )}
                  {!regra.ativo && (
                    <>
                      <span aria-hidden="true" className="px-1.5 text-ink-3">
                        ·
                      </span>
                      <span className="text-ink-3">Desativada</span>
                    </>
                  )}
                  {!editavel && (
                    <>
                      <span aria-hidden="true" className="px-1.5 text-ink-3">
                        ·
                      </span>
                      <span className="text-ink-3">Somente leitura: o painel não conhece este tipo</span>
                    </>
                  )}
                </p>
              </div>
              <Switch
                checked={regra.ativo}
                disabled={salvando || !editavel}
                label={regra.ativo ? 'Desativar regra' : 'Ativar regra'}
                onChange={() => onToggle(regra)}
              />
              <div className="flex gap-1">
                <IconButton label={`Editar ${regra.nome}`} disabled={!editavel} onClick={() => onEdit(regra)}>
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
            );
          })}
        </Panel>
      </section>
    ))}
  </div>
);
