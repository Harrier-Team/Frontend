import { NivelSeveridade } from '@/features/quality-gates/types/qualityGate';

export const SEVERIDADE_THEME: Record<
  NivelSeveridade,
  { label: string; color: string; textClass: string }
> = {
  Normal: { label: 'Normal', color: 'var(--color-sev-normal)', textClass: 'text-ink-2' },
  Atencao: { label: 'Atenção', color: 'var(--color-sev-atencao)', textClass: 'text-sev-atencao' },
  AlertaPreditivo: {
    label: 'Alerta preditivo',
    color: 'var(--color-sev-alerta)',
    textClass: 'text-sev-alerta',
  },
  Critico: { label: 'Crítico', color: 'var(--color-sev-critico)', textClass: 'text-sev-critico' },
  SemClassificacao: { label: 'Sem classificação', color: 'var(--color-ink-3)', textClass: 'text-ink-2' },
};

export function formatarSeveridade(severidade: NivelSeveridade): string {
  return SEVERIDADE_THEME[severidade]?.label ?? severidade;
}
