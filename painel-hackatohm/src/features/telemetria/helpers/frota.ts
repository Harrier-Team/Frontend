import { ehSeveridadeAnormal } from './estadoHelper';
import { contarPorFiltro, descreverMotivo, motivoDoMotor, previsaoDoMotivo } from './linhaMotor';
import { ResumoMotor } from './resumoMotor';
import { formatarGrau, formatarRelativo } from './statusHelper';
import { MotorTelemetria } from '../store/tipos';

/** Um motor da frota com o que a visão geral e o modo apresentação precisam. */
export interface LinhaFrota {
  motor: { id: number; nome: string };
  telemetria: MotorTelemetria | undefined;
  resumo: ResumoMotor;
}

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/** Título que responde à pergunta principal: "1 motor crítico", "Todos os motores normais"… */
export function tituloDaFrota(linhas: LinhaFrota[], erro: string | null): string {
  const total = linhas.length;
  const contagem = contarPorFiltro(linhas.map((l) => l.resumo.principal));
  if (total === 0) return erro ? 'Motores indisponíveis' : 'Nenhum motor cadastrado';
  if (contagem.Critico > 0) return plural(contagem.Critico, 'motor crítico', 'motores críticos');
  if (contagem.AlertaPreditivo > 0)
    return plural(contagem.AlertaPreditivo, 'motor com alerta preditivo', 'motores com alerta preditivo');
  if (contagem.Atencao > 0) return plural(contagem.Atencao, 'motor pede atenção', 'motores pedem atenção');
  if (contagem['sem-dados'] === total && linhas.every((l) => l.resumo.dado === 'sem-leitura'))
    return 'Aguardando o primeiro lote';
  if (contagem['sem-dados'] > 0)
    return plural(contagem['sem-dados'], 'motor sem dados recentes', 'motores sem dados recentes');
  if (contagem.Normal === total) return 'Todos os motores normais';
  return 'Nenhum alerta ativo';
}

/**
 * Linha de apoio: o motivo do motor mais grave (o quê, onde, quanto) ou a
 * maior leitura. `linhas` já vem ordenada por urgência.
 */
export function subtituloDaFrota(linhas: LinhaFrota[], agora: number): string | null {
  const mais = linhas[0];
  if (!mais) return null;
  if (ehSeveridadeAnormal(mais.resumo.severidade)) {
    const motivo = motivoDoMotor(mais.telemetria, mais.resumo.motivo);
    if (motivo) {
      return `${descreverMotivo(motivo, mais.motor.nome, previsaoDoMotivo(mais.telemetria, motivo))} · ${formatarRelativo(mais.resumo.ultimoLoteEm, agora)}`;
    }
  }
  let quente: { motor: string; escova: number; valor: number; dataHora: string } | null = null;
  for (const linha of linhas) {
    for (const [numero, serie] of Object.entries(linha.telemetria?.escovas ?? {})) {
      const ultima = serie.ultima;
      if (ultima && (!quente || ultima.valorCelsius > quente.valor)) {
        quente = {
          motor: linha.motor.nome,
          escova: Number(numero),
          valor: ultima.valorCelsius,
          dataHora: ultima.dataHora,
        };
      }
    }
  }
  return quente
    ? `Maior leitura: ${formatarGrau(quente.valor)} °C, escova ${quente.escova} de ${quente.motor}, ${formatarRelativo(
        quente.dataHora,
        agora
      )}.`
    : null;
}
