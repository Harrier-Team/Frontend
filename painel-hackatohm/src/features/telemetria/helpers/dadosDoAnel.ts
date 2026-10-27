import { TIPO_ASSIMETRIA } from '@/features/quality-gates/helpers/tiposRegra';
import type { AssimetriaDoAnel, EscovaDoAnel } from '../components/CollectorRing';
import { MotorTelemetria } from '../store/tipos';
import { agruparDiagnosticos } from './diagnosticos';
import { estadoResultado } from './estadoHelper';
import { estadoDaEscova } from './resumoMotor';
import { extremosDoLote } from './valorRegra';

export interface DadosDoAnel {
  escovas: EscovaDoAnel[];
  maiorTemperatura: number | null;
  assimetria: AssimetriaDoAnel | null;
}

/** Tudo que o `CollectorRing` precisa, derivado do store (a severidade continua vindo do backend). */
export function dadosDoAnel(
  numerosDasEscovas: number[],
  telemetria: MotorTelemetria | undefined
): DadosDoAnel {
  const escovasDaTelemetria = telemetria?.escovas;
  const escovas = numerosDasEscovas.map((numeroEscova) => ({
    numeroEscova,
    valor: escovasDaTelemetria?.[numeroEscova]?.ultima?.valorCelsius ?? null,
    estado: estadoDaEscova(escovasDaTelemetria?.[numeroEscova]),
  }));
  const maiorTemperatura = escovas.reduce<number | null>(
    (maior, e) => (e.valor !== null && (maior === null || e.valor > maior) ? e.valor : maior),
    null
  );

  const grupos = agruparDiagnosticos(
    Object.values(escovasDaTelemetria ?? {})
      .map((serie) => serie.ultima)
      .filter((leitura): leitura is NonNullable<typeof leitura> => leitura !== null)
  );
  const resultado = grupos.find((g) => g.tipoRegra === TIPO_ASSIMETRIA)?.itens[0]?.resultado;
  const extremos = extremosDoLote(escovasDaTelemetria);
  const assimetria =
    extremos && resultado && estadoResultado(resultado) === 'avaliado'
      ? {
          maisQuente: extremos.maisQuente.numeroEscova,
          maisFria: extremos.maisFria.numeroEscova,
          diferenca: resultado.valorObservado ?? extremos.diferenca,
          estado: resultado.severidade,
        }
      : null;

  return { escovas, maiorTemperatura, assimetria };
}
