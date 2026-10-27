/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `true` liga o simulador de telemetria (somente em `vite dev`). */
  readonly VITE_SIMULADOR?: string;
}
