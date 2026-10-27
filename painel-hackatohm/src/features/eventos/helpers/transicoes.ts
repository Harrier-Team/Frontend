import { TIPO_ASSIMETRIA } from '@/features/quality-gates/helpers/tiposRegra';
import { NivelSeveridade } from '@/features/quality-gates/types/qualityGate';
import { ehSeveridadeAnormal, estadoResultado } from '@/features/telemetria/helpers/estadoHelper';
import { motivoDoMotor } from '@/features/telemetria/helpers/linhaMotor';
import { resumirEscova, resumirMotor } from '@/features/telemetria/helpers/resumoMotor';
import { MotorTelemetria } from '@/features/telemetria/store/tipos';
import { SituacaoMotor } from '@/features/telemetria/types/telemetria';

/**
 * Eventos da sessão: só transições geram registro (ISA-18.2). Lote repetido no
 * mesmo estado não gera nada. O registro vive em memória e vale para esta aba.
 */

export type TipoEvento = 'motor' | 'escova' | 'situacao';

/** Regra, valor e limite que explicam a transição (nulos quando não se aplicam). */
export interface EvidenciaEvento {
  tipoRegra: string;
  nomeRegra: string;
  valor: number | null;
  limite: number | null;
}

export interface EventoSessao {
  /** Crescente e único na sessão; é a base do "visto". */
  id: number;
  /** Instante em que o painel percebeu a transição (ms). */
  em: number;
  motorId: number;
  tipo: TipoEvento;
  /** Só nos eventos de escova. */
  numeroEscova: number | null;
  /** Severidade ou situação anterior; null quando não havia avaliação. */
  de: string | null;
  para: string;
  evidencia: EvidenciaEvento | null;
}

export type NovoEvento = Omit<EventoSessao, 'id'>;

export interface SnapshotEscova {
  severidade: NivelSeveridade | null;
  /** Gate que sustenta a severidade atual, para explicar a transição. */
  evidencia: EvidenciaEvento | null;
}

export interface SnapshotMotor {
  severidade: NivelSeveridade | null;
  situacao: SituacaoMotor | null;
  evidencia: EvidenciaEvento | null;
  escovas: Record<number, SnapshotEscova>;
}

function evidenciaDoGate(escova: MotorTelemetria['escovas'][number], severidade: NivelSeveridade | null) {
  if (!ehSeveridadeAnormal(severidade)) return null;
  const gate = (escova.ultima?.resultadosQualityGates ?? []).find(
    (g) =>
      g.tipoRegra !== TIPO_ASSIMETRIA && estadoResultado(g) === 'avaliado' && g.severidade === severidade
  );
  return gate
    ? { tipoRegra: gate.tipoRegra, nomeRegra: gate.nomeRegra, valor: gate.valorObservado, limite: gate.valorLimite }
    : null;
}

/** Estado do motor que importa para o registro, derivado do store (nunca classifica). */
export function snapshotDoMotor(telemetria: MotorTelemetria, agora: number): SnapshotMotor {
  const resumo = resumirMotor(telemetria, agora);
  const motivo = ehSeveridadeAnormal(resumo.severidade) ? motivoDoMotor(telemetria, resumo.motivo) : null;

  const escovas: Record<number, SnapshotEscova> = {};
  for (const [numero, serie] of Object.entries(telemetria.escovas)) {
    const { severidade } = resumirEscova(serie);
    escovas[Number(numero)] = { severidade, evidencia: evidenciaDoGate(serie, severidade) };
  }

  return {
    severidade: resumo.severidade,
    situacao: resumo.situacao,
    evidencia: motivo
      ? {
          tipoRegra: motivo.tipoRegra,
          nomeRegra: motivo.nomeRegra,
          valor: motivo.valorObservado,
          limite: motivo.valorLimite,
        }
      : null,
    escovas,
  };
}

/**
 * Mudança de severidade que merece registro. Sem avaliação antes ou depois não
 * é transição, exceto sair do nada direto para uma severidade anormal.
 */
function mudouSeveridade(
  antes: NivelSeveridade | null | undefined,
  depois: NivelSeveridade | null
): depois is NivelSeveridade {
  if (depois === null || antes === depois) return false;
  if (antes === null || antes === undefined) return ehSeveridadeAnormal(depois);
  return true;
}

/** Compara dois retratos do mesmo motor e devolve os eventos novos (do mais grave para o menos). */
export function detectarTransicoes(
  motorId: number,
  antes: SnapshotMotor,
  depois: SnapshotMotor,
  em: number
): NovoEvento[] {
  const eventos: NovoEvento[] = [];

  if (antes.situacao !== null && depois.situacao !== null && antes.situacao !== depois.situacao) {
    eventos.push({
      em,
      motorId,
      tipo: 'situacao',
      numeroEscova: null,
      de: antes.situacao,
      para: depois.situacao,
      evidencia: null,
    });
  }

  const deEscovas: NovoEvento[] = [];
  for (const [numero, atual] of Object.entries(depois.escovas)) {
    const anterior = antes.escovas[Number(numero)];
    if (!mudouSeveridade(anterior?.severidade, atual.severidade)) continue;
    deEscovas.push({
      em,
      motorId,
      tipo: 'escova',
      numeroEscova: Number(numero),
      de: anterior?.severidade ?? null,
      para: atual.severidade!,
      evidencia: atual.evidencia,
    });
  }

  if (mudouSeveridade(antes.severidade, depois.severidade)) {
    // A escova que causou a mudança já explica o motor; o evento do motor só
    // aparece quando ninguém mais o explica (ex.: assimetria, que é do motor).
    const explicado = deEscovas.some((e) => e.para === depois.severidade);
    if (!explicado) {
      eventos.push({
        em,
        motorId,
        tipo: 'motor',
        numeroEscova: null,
        de: antes.severidade,
        para: depois.severidade,
        evidencia: depois.evidencia,
      });
    }
  }

  return [...eventos, ...deEscovas];
}

/* ---------- Contagem e título ---------- */

export function ehTransicaoParaCritico(evento: Pick<EventoSessao, 'tipo' | 'para'>): boolean {
  return evento.tipo !== 'situacao' && evento.para === 'Critico';
}

/** Críticos que o usuário ainda não marcou como vistos (`id` maior que `vistoAte`). */
export function contarCriticosNaoVistos(eventos: EventoSessao[], vistoAte: number): number {
  return eventos.reduce((n, e) => n + (e.id > vistoAte && ehTransicaoParaCritico(e) ? 1 : 0), 0);
}

export const TITULO_BASE = 'Harrier | Telemetria de motores';

/** "(2) Harrier | Telemetria de motores" com críticos não vistos; o título normal sem eles. */
export function formatarTituloAba(naoVistos: number, base: string = TITULO_BASE): string {
  return naoVistos > 0 ? `(${naoVistos}) ${base}` : base;
}

/** Adiciona o evento à lista (mais recente primeiro) respeitando o limite de memória. */
export function acumularEventos(atuais: EventoSessao[], novos: EventoSessao[], limite: number): EventoSessao[] {
  if (novos.length === 0) return atuais;
  return [...novos].reverse().concat(atuais).slice(0, limite);
}
