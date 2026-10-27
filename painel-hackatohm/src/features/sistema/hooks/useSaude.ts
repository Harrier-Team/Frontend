import { useCallback, useEffect, useRef, useState } from 'react';
import { ResultadoSaude } from '../helpers/saude';
import { saudeService } from '../services/saudeService';

const INTERVALO_MS = 15_000;

export interface EstadoSaudeApi {
  live: ResultadoSaude | null;
  ready: ResultadoSaude | null;
  /** Instante (ms) da última consulta concluída. */
  consultadoEm: number | null;
  consultando: boolean;
  consultar: () => void;
}

/** Consulta `/health/live` e `/health/ready` ao abrir a página e a cada 15 s. */
export function useSaude(): EstadoSaudeApi {
  const [dados, setDados] = useState<Pick<EstadoSaudeApi, 'live' | 'ready' | 'consultadoEm'>>({
    live: null,
    ready: null,
    consultadoEm: null,
  });
  const [consultando, setConsultando] = useState(false);
  const ativo = useRef(true);

  const consultar = useCallback(() => {
    setConsultando(true);
    void Promise.all([saudeService.live(), saudeService.ready()]).then(([live, ready]) => {
      if (!ativo.current) return;
      setDados({ live, ready, consultadoEm: Date.now() });
      setConsultando(false);
    });
  }, []);

  useEffect(() => {
    ativo.current = true;
    // Primeira consulta ao abrir a página (sincroniza com a API).
    // oxlint-disable-next-line react/set-state-in-effect
    consultar();
    const timer = setInterval(consultar, INTERVALO_MS);
    return () => {
      ativo.current = false;
      clearInterval(timer);
    };
  }, [consultar]);

  return { ...dados, consultando, consultar };
}
