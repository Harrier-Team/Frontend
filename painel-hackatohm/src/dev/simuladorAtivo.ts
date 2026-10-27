/**
 * Simulador de telemetria: só em desenvolvimento e só com `VITE_SIMULADOR=true`.
 * Em produção `import.meta.env.DEV` vira `false` na compilação e o código
 * protegido por esta constante é removido. O `import()` do simulador em
 * `main.tsx` repete a condição por extenso: o bundler só descarta o chunk
 * quando a condição está no próprio ponto do import.
 */
export const SIMULADOR_ATIVO: boolean =
  import.meta.env.DEV && import.meta.env.VITE_SIMULADOR === 'true';
