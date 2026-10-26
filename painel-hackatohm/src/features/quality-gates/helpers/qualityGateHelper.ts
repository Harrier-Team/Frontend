import { NivelSeveridade } from '@/features/quality-gates/types/qualityGate';

export const SEVERIDADE_THEME: Record<
  NivelSeveridade,
  { label: string; icon: string; classes: string }
> = {
  Normal: {
    label: 'Normal',
    icon: '✓',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  Atencao: {
    label: 'Atenção',
    icon: '!',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  AlertaPreditivo: {
    label: 'Alerta preditivo',
    icon: '△',
    classes: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  Critico: {
    label: 'Crítico',
    icon: '⚠',
    classes: 'bg-rose-50 text-rose-800 border-rose-200',
  },
};

export function formatarSeveridade(severidade: NivelSeveridade): string {
  return SEVERIDADE_THEME[severidade]?.label ?? severidade;
}
