import React from 'react';

interface MetricProps {
  rotulo: string;
  /** Texto já formatado (ex.: "72,4"); "—" quando não há leitura. */
  valor: string;
  unidade?: string;
  /** Variação opcional (ex.: "+6,2 °C/min"). */
  variacao?: string;
  /** Cor do valor (token CSS). Padrão: `ink`. Use só para severidade anormal. */
  cor?: string;
  esmaecido?: boolean;
  tamanho?: 'md' | 'lg';
  className?: string;
}

/** Valor + unidade + rótulo + variação opcional. Números tabulares, unidade menor em `ink-3`. */
export const Metric: React.FC<MetricProps> = ({
  rotulo,
  valor,
  unidade,
  variacao,
  cor,
  esmaecido = false,
  tamanho = 'md',
  className = '',
}) => (
  <div className={className}>
    <p className="text-[13px] text-ink-3">{rotulo}</p>
    <p
      className={`display num leading-none ${tamanho === 'lg' ? 'mt-2 text-[40px]' : 'mt-1.5 text-2xl'}`}
      style={{ color: cor ?? 'var(--color-ink)', opacity: esmaecido ? 0.6 : 1 }}
    >
      {valor}
      {unidade && valor !== '—' && (
        <span className={`ml-1 text-ink-3 ${tamanho === 'lg' ? 'text-lg' : 'text-sm'}`}>{unidade}</span>
      )}
    </p>
    {variacao && <p className="num mt-1.5 text-[13px] text-ink-2">{variacao}</p>}
  </div>
);
