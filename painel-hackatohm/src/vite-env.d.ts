/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `true` liga o simulador de telemetria (somente em `vite dev`). */
  readonly VITE_SIMULADOR?: string;
  /** Intervalo entre lotes do simulador, em segundos (padrão 3). */
  readonly VITE_SIMULADOR_CADENCIA_S?: string;
  /** Quantos motores semeados manter (1 = só o Motor A). */
  readonly VITE_SIMULADOR_MOTORES?: string;
}
