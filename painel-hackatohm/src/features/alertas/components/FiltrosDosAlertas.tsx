import React from 'react';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { MotorResponse } from '@/features/motores/types/motor';
import { SeveridadeFiltro, SituacaoAlerta, FiltrosAlertas, SEVERIDADES_FILTRO } from '../helpers/filtros';
import { LISTA_TIPOS_REGRA, ORDEM_CATEGORIAS, ROTULO_CATEGORIA, CategoriaRegra, obterTipoRegra } from '@/features/quality-gates/helpers/tiposRegra';
import { SEVERIDADE_THEME } from '@/features/quality-gates/helpers/qualityGateHelper';

interface FiltrosDosAlertasProps {
  filtros: FiltrosAlertas;
  motores: MotorResponse[];
  /** Situação (em aberto, encerrados, todos) só faz sentido no histórico. */
  comSituacao: boolean;
  onChange: (alteracao: Partial<FiltrosAlertas>) => void;
  onLimpar: () => void;
}

const SITUACOES: Array<{ id: SituacaoAlerta; rotulo: string }> = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'aberto', rotulo: 'Em aberto' },
  { id: 'encerrado', rotulo: 'Encerrados' },
];

const Campo: React.FC<{ id: string; rotulo: string; children: React.ReactNode }> = ({ id, rotulo, children }) => (
  <div className="min-w-36 flex-1 sm:flex-none">
    <label htmlFor={id} className="field-label">
      {rotulo}
    </label>
    {children}
  </div>
);

/** Filtros da lista de alertas: motor, categoria, severidade, tipo de regra e, no histórico, a situação. */
export const FiltrosDosAlertas: React.FC<FiltrosDosAlertasProps> = ({ filtros, motores, comSituacao, onChange, onLimpar }) => {
  const filtrando =
    filtros.motorId !== undefined ||
    filtros.categoria !== undefined ||
    filtros.severidade !== undefined ||
    filtros.tipoRegra !== undefined ||
    (comSituacao && filtros.situacao !== 'todos');
  // Um tipo desconhecido que veio na URL continua selecionável para poder ser limpo.
  const tipoDesconhecido = filtros.tipoRegra && !obterTipoRegra(filtros.tipoRegra).conhecido ? filtros.tipoRegra : null;

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3" role="group" aria-label="Filtros dos alertas">
      <Campo id="filtro-motor" rotulo="Motor">
        <select
          id="filtro-motor"
          className="field h-9 py-0 text-[13px]"
          value={filtros.motorId ?? ''}
          onChange={(event) => onChange({ motorId: event.target.value ? Number(event.target.value) : undefined })}
        >
          <option value="">Todos</option>
          {motores.map((motor) => (
            <option key={motor.id} value={motor.id}>
              {motor.nome}
            </option>
          ))}
          {filtros.motorId !== undefined && !motores.some((m) => m.id === filtros.motorId) && (
            <option value={filtros.motorId}>Motor {filtros.motorId}</option>
          )}
        </select>
      </Campo>
      <Campo id="filtro-categoria" rotulo="Categoria">
        <select
          id="filtro-categoria"
          className="field h-9 py-0 text-[13px]"
          value={filtros.categoria ?? ''}
          onChange={(event) => onChange({ categoria: (event.target.value || undefined) as CategoriaRegra | undefined })}
        >
          <option value="">Todas</option>
          {ORDEM_CATEGORIAS.map((categoria) => (
            <option key={categoria} value={categoria}>
              {ROTULO_CATEGORIA[categoria]}
            </option>
          ))}
        </select>
      </Campo>
      <Campo id="filtro-severidade" rotulo="Severidade">
        <select
          id="filtro-severidade"
          className="field h-9 py-0 text-[13px]"
          value={filtros.severidade ?? ''}
          onChange={(event) => onChange({ severidade: (event.target.value || undefined) as SeveridadeFiltro | undefined })}
        >
          <option value="">Todas</option>
          {SEVERIDADES_FILTRO.map((severidade) => (
            <option key={severidade} value={severidade}>
              {SEVERIDADE_THEME[severidade].label}
            </option>
          ))}
        </select>
      </Campo>
      <Campo id="filtro-tipo" rotulo="Tipo de regra">
        <select
          id="filtro-tipo"
          className="field h-9 py-0 text-[13px]"
          value={filtros.tipoRegra ?? ''}
          onChange={(event) => onChange({ tipoRegra: event.target.value || undefined })}
        >
          <option value="">Todos</option>
          {LISTA_TIPOS_REGRA.map((info) => (
            <option key={info.tipo} value={info.tipo}>
              {info.rotulo}
            </option>
          ))}
          {tipoDesconhecido && <option value={tipoDesconhecido}>{tipoDesconhecido}</option>}
        </select>
      </Campo>
      {comSituacao && (
        <div>
          <p id="filtro-situacao" className="field-label">
            Situação
          </p>
          <Segmented
            label="Situação do alerta"
            valor={filtros.situacao}
            onChange={(situacao) => onChange({ situacao })}
            itens={SITUACOES}
          />
        </div>
      )}
      {filtrando && (
        <Button variant="ghost" size="sm" onClick={onLimpar} className="mb-0.5">
          Limpar filtros
        </Button>
      )}
    </div>
  );
};
