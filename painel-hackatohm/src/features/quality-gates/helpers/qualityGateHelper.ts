import { NivelSeveridade } from '@/features/quality-gates/types/qualityGate';

export const SEVERIDADE_THEME: Record<
  NivelSeveridade,
  { label: string; color: string; textClass: string }
> = {
  Normal: { label: 'Normal', color: 'var(--color-ok)', textClass: 'text-ink-2' },
  Atencao: { label: 'Atenção', color: 'var(--color-warn)', textClass: 'text-warn' },
  AlertaPreditivo: { label: 'Alerta preditivo', color: 'var(--color-warn)', textClass: 'text-warn' },
  Critico: { label: 'Crítico', color: 'var(--color-hot)', textClass: 'text-hot' },
};

export function formatarSeveridade(severidade: NivelSeveridade): string {
  return SEVERIDADE_THEME[severidade]?.label ?? severidade;
}
