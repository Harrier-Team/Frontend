import { NivelSeveridade, ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { RegraQualidade } from '@/features/quality-gates/types/regraQualidade';
import { ContagemSeveridade, MotivoStatus } from '@/features/telemetria/types/telemetria';

/**
 * Avaliador de regras do simulador: imita o que o backend faz com os três
 * tipos de regra (ver Backend/docs/monitoramento-preditivo.md). Existe só para
 * gerar dados falsos; o painel nunca classifica por temperatura.
 */

export interface AmostraSimulada {
  numeroEscova: number;
  valor: number;
  /** ms desde a época. */
  t: number;
}

const formato = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

function severidadeDe(valor: number, aviso: number, critico: number): NivelSeveridade {
  if (valor >= critico) return 'Critico';
  if (valor >= aviso) return 'AlertaPreditivo';
  return 'Normal';
}

function resultadoBase(regra: RegraQualidade, sobrescrever: Partial<ResultadoGateRealtime>): ResultadoGateRealtime {
  return {
    regraQualidadeId: regra.id,
    nomeRegra: regra.nome,
    disparouAlerta: false,
    severidade: 'Normal',
    tipoRegra: regra.tipoRegra,
    codigoRegra: 'OK',
    mensagemDiagnostico: null,
    valorObservado: null,
    valorLimite: null,
    metadados: null,
    ...sobrescrever,
  };
}

function aguardando(regra: RegraQualidade, mensagem: string): ResultadoGateRealtime {
  return resultadoBase(regra, {
    codigoRegra: 'DADOS_INSUFICIENTES',
    mensagemDiagnostico: mensagem,
    metadados: { avaliacaoConcluida: false },
  });
}

/**
 * Avalia um lote com as regras ativas. `anterior` traz a leitura anterior de
 * cada escova (para o gradiente). Retorna os resultados por escova; a
 * assimetria é repetida em todas, como faz o backend.
 */
export function avaliarLote(
  lote: AmostraSimulada[],
  anterior: Map<number, AmostraSimulada>,
  regras: RegraQualidade[]
): Map<number, ResultadoGateRealtime[]> {
  const saida = new Map<number, ResultadoGateRealtime[]>();
  for (const amostra of lote) saida.set(amostra.numeroEscova, []);

  for (const regra of regras) {
    const { aviso, critico } = regra.parametros;

    if (regra.tipoRegra === 'temperatura.limiar_estatico') {
      for (const amostra of lote) {
        const severidade = severidadeDe(amostra.valor, aviso, critico);
        saida.get(amostra.numeroEscova)!.push(
          severidade === 'Normal'
            ? resultadoBase(regra, {})
            : resultadoBase(regra, {
                disparouAlerta: true,
                severidade,
                codigoRegra: severidade === 'Critico' ? 'TEMP_CRITICA' : 'TEMP_ALERTA',
                valorObservado: amostra.valor,
                valorLimite: severidade === 'Critico' ? critico : aviso,
                mensagemDiagnostico: `Escova ${amostra.numeroEscova} atingiu ${
                  severidade === 'Critico' ? 'temperatura crítica' : 'o limite de aviso'
                } de ${formato(amostra.valor)} °C (limite ${severidade === 'Critico' ? critico : aviso} °C).`,
              })
        );
      }
    } else if (regra.tipoRegra === 'temperatura.gradiente_termico') {
      for (const amostra of lote) {
        const antes = anterior.get(amostra.numeroEscova);
        const minutos = antes ? (amostra.t - antes.t) / 60_000 : 0;
        if (!antes || minutos <= 0) {
          saida
            .get(amostra.numeroEscova)!
            .push(aguardando(regra, 'Sem leitura anterior para calcular a variação de temperatura.'));
          continue;
        }
        const gradiente = (amostra.valor - antes.valor) / minutos;
        const severidade = gradiente <= 0 ? 'Normal' : severidadeDe(gradiente, aviso, critico);
        const metadados = { temperaturaAnterior: antes.valor, intervaloSegundos: (amostra.t - antes.t) / 1000 };
        saida.get(amostra.numeroEscova)!.push(
          severidade === 'Normal'
            ? resultadoBase(regra, { metadados })
            : resultadoBase(regra, {
                disparouAlerta: true,
                severidade,
                metadados,
                codigoRegra: severidade === 'Critico' ? 'GRADIENTE_CRITICO' : 'GRADIENTE_ALERTA',
                valorObservado: gradiente,
                valorLimite: severidade === 'Critico' ? critico : aviso,
                mensagemDiagnostico: `Escova ${amostra.numeroEscova} está subindo ${formato(gradiente)} °C/min.`,
              })
        );
      }
    } else if (regra.tipoRegra === 'temperatura.assimetria_escovas') {
      if (lote.length < 2) {
        for (const amostra of lote) {
          saida.get(amostra.numeroEscova)!.push(aguardando(regra, 'A assimetria precisa de pelo menos duas escovas.'));
        }
        continue;
      }
      const maxima = lote.reduce((a, b) => (b.valor > a.valor ? b : a));
      const minima = lote.reduce((a, b) => (b.valor < a.valor ? b : a));
      const diferenca = maxima.valor - minima.valor;
      const severidade = severidadeDe(diferenca, aviso, critico);
      const metadados = {
        temperaturaMinima: minima.valor,
        temperaturaMaxima: maxima.valor,
        escovaMinima: minima.numeroEscova,
        escovaMaxima: maxima.numeroEscova,
      };
      for (const amostra of lote) {
        saida.get(amostra.numeroEscova)!.push(
          severidade === 'Normal'
            ? resultadoBase(regra, { metadados })
            : resultadoBase(regra, {
                disparouAlerta: true,
                severidade,
                codigoRegra: severidade === 'Critico' ? 'ASSIMETRIA_CRITICA' : 'ASSIMETRIA_ALERTA',
                valorObservado: diferenca,
                valorLimite: severidade === 'Critico' ? critico : aviso,
                mensagemDiagnostico: `As escovas ${minima.numeroEscova} e ${maxima.numeroEscova} diferem em ${formato(diferenca)} °C.`,
                metadados,
              })
        );
      }
    }
  }
  return saida;
}

const RANK: Record<NivelSeveridade, number> = { Normal: 0, SemClassificacao: 0, Atencao: 1, AlertaPreditivo: 2, Critico: 3 };

/** Severidade, contagem por escova e motivo do status agregado. */
export function consolidarStatus(
  porEscova: Map<number, ResultadoGateRealtime[]>
): { severidadeGeral: NivelSeveridade; contagem: ContagemSeveridade; motivo: MotivoStatus | null } {
  const contagem: ContagemSeveridade = { normal: 0, atencao: 0, alertaPreditivo: 0, critico: 0 };
  let pior: { numeroEscova: number; resultado: ResultadoGateRealtime } | null = null;
  let severidadeGeral: NivelSeveridade = 'Normal';

  for (const [numeroEscova, resultados] of porEscova) {
    const validos = resultados.filter((r) => r.metadados?.avaliacaoConcluida !== false);
    const escova = validos.reduce<NivelSeveridade>(
      (m, r) => (RANK[r.severidade] > RANK[m] ? r.severidade : m),
      'Normal'
    );
    if (escova === 'Critico') contagem.critico += 1;
    else if (escova === 'AlertaPreditivo') contagem.alertaPreditivo += 1;
    else if (escova === 'Atencao') contagem.atencao += 1;
    else contagem.normal += 1;

    for (const resultado of validos) {
      const assimetria = resultado.tipoRegra === 'temperatura.assimetria_escovas';
      const maior = RANK[resultado.severidade] > RANK[severidadeGeral];
      // Em empate, o motivo prefere uma regra de escova à assimetria do motor.
      const desempate =
        RANK[resultado.severidade] === RANK[severidadeGeral] &&
        pior?.resultado.tipoRegra === 'temperatura.assimetria_escovas' &&
        !assimetria &&
        resultado.severidade !== 'Normal';
      if (maior || desempate) {
        severidadeGeral = resultado.severidade;
        const escovaMaxima = resultado.metadados?.escovaMaxima;
        pior = { numeroEscova: assimetria && typeof escovaMaxima === 'number' ? escovaMaxima : numeroEscova, resultado };
      }
    }
  }

  const motivo: MotivoStatus | null = pior
    ? {
        numeroEscova: pior.numeroEscova,
        nomeRegra: pior.resultado.nomeRegra,
        tipoRegra: pior.resultado.tipoRegra,
        codigoRegra: pior.resultado.codigoRegra,
        valorObservado: pior.resultado.valorObservado,
        valorLimite: pior.resultado.valorLimite,
        mensagemDiagnostico: pior.resultado.mensagemDiagnostico,
      }
    : null;
  return { severidadeGeral, contagem, motivo };
}
