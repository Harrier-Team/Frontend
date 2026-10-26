import { Info } from 'lucide-react';
import { LIMITE_ATENCAO, LIMITE_PERIGO } from '../helpers/statusHelper';

export const ThermalLegend = () => (
  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-1 text-[11px] text-ink-3">
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Faixas de referência do painel">
      <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> Estável &lt; {LIMITE_ATENCAO} °C</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-warn" /> Atenção ≥ {LIMITE_ATENCAO} °C</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-hot" /> Crítico ≥ {LIMITE_PERIGO} °C ou alerta de desgaste</span>
    </div>
    <details className="max-w-lg">
      <summary className="flex min-h-9 items-center gap-1.5 hover:text-ink"><Info className="h-3.5 w-3.5" aria-hidden="true" /> Sobre as faixas</summary>
      <p className="pb-2 leading-relaxed">Faixas de referência da classificação visual do painel. Os limites operacionais devem ser definidos e validados para cada equipamento. As regras de qualidade vinculadas ao motor são avaliadas separadamente.</p>
    </details>
  </div>
);
