import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  emAlerta,
  GrupoDiagnostico,
  ItemDiagnostico,
  resumirDiagnosticos,
} from '@/features/telemetria/helpers/diagnosticos';
import { EstadoDado, estaDesatualizado } from '@/features/telemetria/helpers/estadoHelper';
import { GateRow } from '@/features/telemetria/components/GateRow';
import { obterTipoRegra } from '@/features/quality-gates/helpers/tiposRegra';

interface DiagnosticosPanelProps {
  motorId: number;
  grupos: GrupoDiagnostico[];
  temLeitura: boolean;
  dado: EstadoDado;
}

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/** Tipo da regra uma vez só: nome amigável, unidade e o nome técnico como subtítulo. */
const TituloGrupo: React.FC<{ tipoRegra: string }> = ({ tipoRegra }) => {
  const tipo = obterTipoRegra(tipoRegra);
  return (
    <p className="text-[13px] text-ink-3">
      <span className="text-ink-2">{tipo.rotulo}</span>
      {tipo.unidade && <span className="num"> ({tipo.unidade})</span>}
      {tipo.conhecido && <span> · {tipo.subtitulo}</span>}
    </p>
  );
};

const escopoDoItem = (item: ItemDiagnostico) =>
  item.numeroEscova === null
    ? ({ tipo: 'motor' } as const)
    : ({ tipo: 'escova', numeroEscova: item.numeroEscova } as const);

/**
 * Diagnósticos do último lote, agrupados por regra. Só o que disparou fica
 * aberto; o resto fica recolhido para quem quer auditar. A assimetria aparece
 * uma vez, no escopo do motor.
 */
export const DiagnosticosPanel: React.FC<DiagnosticosPanelProps> = ({ motorId, grupos, temLeitura, dado }) => {
  if (!temLeitura) return null;
  const desatualizado = estaDesatualizado(dado);

  if (grupos.length === 0) {
    return (
      <section aria-labelledby="diagnosticos" className="space-y-3">
        <h2 id="diagnosticos" className="display text-base">
          Diagnósticos do último lote
        </h2>
        <div className="rounded-[var(--radius-panel)] border border-dashed border-line-strong px-5 py-6 text-sm text-ink-2">
          Sem regras neste motor, então nada foi avaliado.{' '}
          <Link
            to={`/motores/${motorId}/regras`}
            className="inline-flex items-center gap-0.5 text-ink underline underline-offset-2"
          >
            Vincular regras
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  const resumo = resumirDiagnosticos(grupos);
  const comAlerta = grupos.filter((g) => g.itens.some((i) => emAlerta(i.resultado)));
  const restantes = grupos
    .map((g) => ({ ...g, itens: g.itens.filter((i) => !emAlerta(i.resultado)) }))
    .filter((g) => g.itens.length > 0);

  const partes: string[] = [];
  if (resumo.dentroDoLimite > 0) {
    partes.push(plural(resumo.dentroDoLimite, 'regra dentro do limite', 'regras dentro do limite'));
  }
  if (resumo.aguardando > 0) partes.push(`${resumo.aguardando} aguardando amostras`);
  if (resumo.semClassificacao > 0) partes.push(`${resumo.semClassificacao} sem classificação`);

  return (
    <section aria-labelledby="diagnosticos" className="space-y-3">
      <h2 id="diagnosticos" className="display text-base">
        Diagnósticos do último lote
      </h2>

      {comAlerta.length === 0 ? (
        <p className="rounded-[var(--radius-panel)] border border-line bg-panel px-5 py-4 text-sm text-ink-2">
          Nenhuma regra disparou no último lote.
        </p>
      ) : (
        <div className="space-y-3">
          {comAlerta.map((grupo) => (
            <div key={grupo.chave} className="rounded-[var(--radius-panel)] border border-line bg-panel px-5 py-3">
              <TituloGrupo tipoRegra={grupo.tipoRegra} />
              <div className="divide-y divide-line">
                {grupo.itens
                  .filter((i) => emAlerta(i.resultado))
                  .map((item) => (
                    <GateRow
                      key={`${grupo.chave}-${item.numeroEscova ?? 'motor'}`}
                      resultado={item.resultado}
                      escopo={escopoDoItem(item)}
                      dataHora={item.dataHora}
                      esmaecido={desatualizado}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {restantes.length > 0 && (
        <details className="group rounded-[var(--radius-panel)] border border-line bg-panel px-5 py-3">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] text-ink-2 [&::-webkit-details-marker]:hidden">
            <ChevronRight
              className="h-3.5 w-3.5 transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
            {partes.join(' · ')}
          </summary>
          <div className="mt-2 divide-y divide-line">
            {restantes.flatMap((grupo) =>
              grupo.itens.map((item) => (
                <GateRow
                  key={`r-${grupo.chave}-${item.numeroEscova ?? 'motor'}`}
                  resultado={item.resultado}
                  escopo={escopoDoItem(item)}
                  dataHora={item.dataHora}
                  comTipo
                />
              ))
            )}
          </div>
        </details>
      )}
    </section>
  );
};
