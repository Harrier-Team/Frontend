import { ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { RegraQualidade, RegraQualidadeRequest, VinculoRegraQualidade } from '@/features/quality-gates/types/regraQualidade';
import { AlertaManutencao } from '@/features/alertas/types/alerta';
import { MotorInput, MotorResponse } from '@/features/motores/types/motor';
import { LeituraEscova, MotorStatusDto } from '@/features/telemetria/types/telemetria';
import { AmostraSimulada, avaliarLote, consolidarStatus } from './avaliador';
import { AlertasSimulados, lerConsulta } from './alertas';
import { validarParametros } from './validacao';
import {
  CADENCIA_SIMULADA_MS,
  HISTORICO_INICIAL_S,
  PerfilTermico,
  PRIMEIRO_LOTE_APOS_S,
  SILENCIO_APOS_S,
  temperaturaSimulada,
} from './cenarios';

const OFFLINE_APOS_S = 120;

interface MotorSimulado {
  motor: MotorResponse;
  mac: string;
  perfil: PerfilTermico;
  /** Instante (ms) a partir do qual o ESP começa a enviar. */
  inicioEm: number;
  /** Instante (ms) em que o ESP silencia; null = nunca. */
  silencioEm: number | null;
  ultimo: AmostraSimulada[] | null;
  ultimoAnterior: Map<number, AmostraSimulada>;
  /** Leituras recentes de cada escova (inclui a última), para a previsão por tendência. */
  recentes: Map<number, AmostraSimulada[]>;
}

export interface LoteGerado {
  leituras: LeituraEscova[];
  status: MotorStatusDto;
  /** Alertas que abriram ou subiram de severidade neste lote (evento `ReceberAlertaManutencao`). */
  alertas: AlertaManutencao[];
}

/** Quantas leituras por escova a simulação guarda para a previsão (o máximo da janela do backend). */
const MAXIMO_RECENTES = 60;

export interface RespostaSimulada {
  status: number;
  data?: unknown;
}

function resposta404(detalhe: string): RespostaSimulada {
  return { status: 404, data: { title: 'Não encontrado', detail: detalhe, status: 404 } };
}

function resposta400(campo: string, mensagem: string): RespostaSimulada {
  return {
    status: 400,
    data: { title: 'Requisição inválida', detail: mensagem, status: 400, code: 'validation_error', errors: { [campo]: [mensagem] } },
  };
}

const iso = (t: number) => new Date(t).toISOString();

/**
 * Backend em memória do simulador. Mantém motores, regras e vínculos e gera os
 * lotes e o status agregado como o contrato do backend descreve. O painel o
 * enxerga pelas mesmas costuras de sempre: HTTP (axios) e o hub.
 */
export function criarServidorSimulado(
  agora: () => number = Date.now,
  cadenciaMs: number = CADENCIA_SIMULADA_MS,
  /** Quantos dos motores semeados manter (do primeiro em diante); útil para demonstrar um único motor. */
  maximoDeMotores?: number
) {
  const instalacao = agora();
  let proximoMotor = 1;
  let proximaRegra = 1;
  const motores: MotorSimulado[] = [];
  const regras: RegraQualidade[] = [];
  const vinculos = new Map<number, Map<string, { ativo: boolean; vinculadoEm: string }>>();
  const alertas = new AlertasSimulados();

  const instanteDoLote = (t: number) => Math.floor(t / cadenciaMs) * cadenciaMs;
  const segundos = (t: number) => (t - instalacao) / 1000 + HISTORICO_INICIAL_S;

  function criarRegra(entrada: RegraQualidadeRequest): RegraQualidade {
    const regra: RegraQualidade = {
      id: `regra-${proximaRegra++}`,
      nome: entrada.nome,
      descricao: entrada.descricao ?? null,
      tipoRegra: entrada.tipoRegra,
      severidadePadrao: 'AlertaPreditivo',
      parametros: entrada.parametros,
      ativo: entrada.ativo,
      criadoEm: iso(instalacao),
    };
    regras.push(regra);
    return regra;
  }

  function adicionarMotor(
    entrada: { nome: string; tipo: string; mac: string; escovas: Array<{ numeroEscova: number; modelo: string }> },
    perfil: PerfilTermico,
    inicioEm: number,
    silencioEm: number | null = null
  ): MotorSimulado {
    const id = proximoMotor++;
    const motor: MotorResponse = {
      id,
      nome: entrada.nome,
      tipo: entrada.tipo,
      sensores: entrada.escovas.map((escova) => ({
        id: `${entrada.mac}-${escova.numeroEscova}`,
        numeroEscova: escova.numeroEscova,
        modelo: escova.modelo,
        ipAtual: `192.168.0.${40 + id}`,
        ultimaConexao: iso(agora()),
      })),
    };
    const sim: MotorSimulado = {
      motor,
      mac: entrada.mac,
      perfil,
      inicioEm,
      silencioEm,
      ultimo: null,
      ultimoAnterior: new Map(),
      recentes: new Map(),
    };
    motores.push(sim);
    vinculos.set(id, new Map());
    return sim;
  }

  function vincular(motorId: number, regraId: string, ativo = true) {
    vinculos.get(motorId)?.set(regraId, { ativo, vinculadoEm: iso(agora()) });
  }

  function regrasAtivasDoMotor(motorId: number): RegraQualidade[] {
    const mapa = vinculos.get(motorId);
    if (!mapa) return [];
    return regras.filter((r) => r.ativo && mapa.get(r.id)?.ativo);
  }

  /* ---------- Semente ---------- */

  const limiar = criarRegra({
    nome: 'Limiar estático',
    descricao: 'Temperatura máxima por escova.',
    tipoRegra: 'temperatura.limiar_estatico',
    parametros: { aviso: 80, critico: 95 },
    ativo: true,
  });
  const gradiente = criarRegra({
    nome: 'Subida rápida',
    descricao: 'Velocidade de aquecimento por escova.',
    tipoRegra: 'temperatura.gradiente_termico',
    parametros: { aviso: 4, critico: 8 },
    ativo: true,
  });
  const assimetria = criarRegra({
    nome: 'Assimetria entre escovas',
    descricao: 'Diferença entre a escova mais quente e a mais fria.',
    tipoRegra: 'temperatura.assimetria_escovas',
    parametros: { aviso: 12, critico: 20 },
    ativo: true,
  });

  const previsao = criarRegra({
    nome: 'Tempo até o limite',
    descricao: 'Estima quando a escova chega a 95 °C pela tendência das últimas leituras.',
    tipoRegra: 'temperatura.previsao_tendencia',
    // Janela de 20 leituras (≈ 1 min na cadência simulada): a inclinação fica estável e a estimativa não oscila.
    parametros: { aviso: 20, critico: 8, temperaturaLimite: 95, janela: 20 },
    ativo: true,
  });

  const escovas3 = [1, 2, 3].map((numeroEscova) => ({ numeroEscova, modelo: 'MLX90614' }));
  const escovas2 = [1, 2].map((numeroEscova) => ({ numeroEscova, modelo: 'MLX90614' }));

  const semente: Array<[MotorSimulado, boolean]> = [
    [adicionarMotor({ nome: 'Motor A', tipo: 'Universal', mac: 'A4:CF:12:8B:01:11', escovas: escovas3 }, 'aquecimento', 0), true],
    [adicionarMotor({ nome: 'Motor B', tipo: 'Trifásico 220 V', mac: 'A4:CF:12:8B:02:22', escovas: escovas2 }, 'normal', 0), true],
    [adicionarMotor({ nome: 'Motor C', tipo: 'Universal', mac: 'A4:CF:12:8B:03:33', escovas: escovas3 }, 'critico', 0), true],
    [
      adicionarMotor(
        { nome: 'Motor D', tipo: 'Monofásico 127 V', mac: 'A4:CF:12:8B:04:44', escovas: escovas3 },
        'silencioso',
        0,
        instalacao + SILENCIO_APOS_S * 1000
      ),
      true,
    ],
    [adicionarMotor({ nome: 'Motor E', tipo: 'Trifásico 380 V', mac: 'A4:CF:12:8B:05:55', escovas: escovas2 }, 'novo', Infinity), true],
    [adicionarMotor({ nome: 'Motor F', tipo: 'Universal', mac: 'A4:CF:12:8B:06:66', escovas: escovas2 }, 'sem-regras', 0), false],
    // Aquecimento lento: a previsão dispara minutos antes de o limite estático de aviso.
    [adicionarMotor({ nome: 'Motor G', tipo: 'Universal', mac: 'A4:CF:12:8B:07:77', escovas: escovas3 }, 'aquecimento-lento', 0), true],
  ];
  for (const [sim, comRegras] of semente) {
    if (!comRegras) continue;
    vincular(sim.motor.id, limiar.id);
    vincular(sim.motor.id, gradiente.id);
    vincular(sim.motor.id, assimetria.id);
    // A previsão só vale onde a curva é limpa: nos motores com ruído ela oscilaria entre Normal e alerta.
    if (sim.perfil === 'aquecimento-lento') vincular(sim.motor.id, previsao.id);
  }
  if (maximoDeMotores !== undefined) {
    for (const removido of motores.splice(maximoDeMotores)) vinculos.delete(removido.motor.id);
  }

  /* ---------- Lotes e status ---------- */

  function produzirLote(sim: MotorSimulado, t: number, anterior: Map<number, AmostraSimulada>): LoteGerado {
    const amostras: AmostraSimulada[] = sim.motor.sensores
      .map((s) => s.numeroEscova)
      .sort((a, b) => a - b)
      .map((numeroEscova) => ({
        numeroEscova,
        valor: Math.round(temperaturaSimulada(sim.perfil, numeroEscova, segundos(t)) * 100) / 100,
        t,
      }));
    return montar(sim, amostras, anterior);
  }

  function montar(sim: MotorSimulado, amostras: AmostraSimulada[], anterior: Map<number, AmostraSimulada>): LoteGerado {
    // Leituras de cada escova anteriores a este lote (a previsão ajusta a reta a elas e à atual).
    const instante = amostras[0]?.t ?? Infinity;
    const passado = new Map(
      [...sim.recentes].map(([numero, lista]) => [numero, lista.filter((a) => a.t < instante)])
    );
    const porEscova = avaliarLote(amostras, anterior, regrasAtivasDoMotor(sim.motor.id), passado);
    const leituras: LeituraEscova[] = amostras.map((a) => {
      const gates: ResultadoGateRealtime[] = porEscova.get(a.numeroEscova) ?? [];
      return {
        motorId: sim.motor.id,
        sensorId: `${sim.mac}-${a.numeroEscova}`,
        espMacAddress: sim.mac,
        numeroEscova: a.numeroEscova,
        valorCelsius: a.valor,
        dataHora: iso(a.t),
        alertaDesgaste: gates.some((g) => g.disparouAlerta),
        resultadosQualityGates: gates,
      };
    });
    const consolidado = consolidarStatus(porEscova);
    const t = amostras[0]?.t ?? agora();
    const status: MotorStatusDto = {
      motorId: sim.motor.id,
      ...consolidado,
      situacao: agora() - t > OFFLINE_APOS_S * 1000 ? 'Offline' : 'Online',
      escovas: leituras.map((l) => ({
        sensorId: l.sensorId,
        numeroEscova: l.numeroEscova,
        valorCelsius: l.valorCelsius,
        severidade: consolidarStatus(new Map([[l.numeroEscova, l.resultadosQualityGates]])).severidadeGeral,
        dataHora: l.dataHora,
        alertaDesgaste: l.alertaDesgaste,
        resultadosQualityGates: l.resultadosQualityGates,
      })),
    };
    return { leituras, status, alertas: [] };
  }

  function registrar(sim: MotorSimulado, amostras: AmostraSimulada[]) {
    sim.ultimoAnterior = new Map((sim.ultimo ?? []).map((a) => [a.numeroEscova, a]));
    sim.ultimo = amostras;
    for (const amostra of amostras) {
      const lista = sim.recentes.get(amostra.numeroEscova) ?? [];
      sim.recentes.set(amostra.numeroEscova, [...lista, amostra].slice(-MAXIMO_RECENTES));
    }
  }

  function envia(sim: MotorSimulado, t: number): boolean {
    return t >= sim.inicioEm && (sim.silencioEm === null || t < sim.silencioEm);
  }

  const historicos = new Map<number, LoteGerado[]>();

  /** Lotes do passado recente, em ordem, para o painel ter curva ao abrir. */
  function calcularHistorico(sim: MotorSimulado): LoteGerado[] {
    // Instantes alinhados à cadência: o intervalo entre lotes é sempre múltiplo dela,
    // inclusive na passagem do histórico para os lotes ao vivo (sem dt minúsculo no gradiente).
    const fim = instanteDoLote(agora());
    const lotes: LoteGerado[] = [];
    let anterior = new Map<number, AmostraSimulada>();
    for (let t = fim - HISTORICO_INICIAL_S * 1000; t <= fim; t += cadenciaMs) {
      if (!envia(sim, t)) continue;
      const lote = produzirLote(sim, t, anterior);
      const amostras = lote.leituras.map((l) => ({ numeroEscova: l.numeroEscova, valor: l.valorCelsius, t }));
      anterior = new Map(amostras.map((a) => [a.numeroEscova, a]));
      // O passado também tem alertas: quem recarrega a página os encontra, porque vêm do "banco".
      // Os eventos do histórico não são entregues (aconteceram antes de o painel abrir).
      registrar(sim, amostras);
      alertas.processar(sim.motor.id, lote.leituras, t);
      lotes.push(lote);
    }
    return lotes;
  }

  function historico(motorId: number): LoteGerado[] {
    return historicos.get(motorId) ?? [];
  }

  /** Um lote novo para cada motor que está enviando agora. */
  function tick(): LoteGerado[] {
    const t = instanteDoLote(agora());
    const gerados: LoteGerado[] = [];
    for (const sim of motores) {
      if (!envia(sim, t)) continue;
      // Mesmo instante de grade (jitter do timer): não duplica o lote.
      if (sim.ultimo && sim.ultimo.some((a) => a.t >= t)) continue;
      const anterior = new Map((sim.ultimo ?? []).map((a) => [a.numeroEscova, a]));
      const lote = produzirLote(sim, t, anterior);
      registrar(
        sim,
        lote.leituras.map((l) => ({ numeroEscova: l.numeroEscova, valor: l.valorCelsius, t }))
      );
      lote.alertas = alertas.processar(sim.motor.id, lote.leituras, t);
      gerados.push(lote);
    }
    return gerados;
  }

  /** Status atual reavaliado com as regras de agora, como o GET do backend. */
  function statusAtual(motorId: number): MotorStatusDto | null {
    const sim = motores.find((m) => m.motor.id === motorId);
    if (!sim?.ultimo) return null;
    return montar(sim, sim.ultimo, sim.ultimoAnterior).status;
  }

  function aoCadastrar(sim: MotorSimulado) {
    sim.inicioEm = agora() + PRIMEIRO_LOTE_APOS_S * 1000;
  }

  // O último lote do histórico vira o estado atual do motor (GET /status já responde).
  for (const sim of motores) {
    const lotes = calcularHistorico(sim);
    historicos.set(sim.motor.id, lotes);
    const como = (l?: LoteGerado) =>
      (l?.leituras ?? []).map((x) => ({ numeroEscova: x.numeroEscova, valor: x.valorCelsius, t: Date.parse(x.dataHora) }));
    if (lotes.length > 0) {
      sim.ultimo = como(lotes[lotes.length - 1]);
      sim.ultimoAnterior = new Map(como(lotes[lotes.length - 2]).map((a) => [a.numeroEscova, a]));
    }
  }

  /* ---------- HTTP ---------- */

  function vinculoResposta(motorId: number, regraId: string): VinculoRegraQualidade | null {
    const regra = regras.find((r) => r.id === regraId);
    const v = vinculos.get(motorId)?.get(regraId);
    if (!regra || !v) return null;
    return { motorId, regraQualidadeId: regraId, ativo: v.ativo, vinculadoEm: v.vinculadoEm, regra };
  }

  function tratar(metodo: string, caminho: string, corpo: unknown): RespostaSimulada {
    const partes = caminho.split('?')[0].split('/').filter(Boolean);
    const m = metodo.toUpperCase();

    // Health checks do ASP.NET: texto puro, como no backend real.
    if (partes[0] === 'health' && m === 'GET' && (partes[1] === 'live' || partes[1] === 'ready')) {
      return { status: 200, data: 'Healthy' };
    }

    if (partes[0] === 'alertas' && partes.length === 1 && m === 'GET') {
      const consulta = lerConsulta(new URLSearchParams(caminho.split('?')[1] ?? ''));
      return typeof consulta === 'string'
        ? resposta400('Consulta', consulta)
        : { status: 200, data: alertas.listar(consulta) };
    }

    if (partes[0] === 'motores') {
      if (partes.length === 1) {
        if (m === 'GET') return { status: 200, data: motores.map((s) => s.motor) };
        if (m === 'POST') {
          const entrada = corpo as MotorInput;
          const mac = entrada.sensoresIniciais[0]?.macAddress ?? 'AA:BB:CC:DD:EE:FF';
          if (motores.some((s) => s.mac === mac)) {
            return {
              status: 409,
              data: { title: 'Conflito', detail: 'Já existe um motor com este MAC.', status: 409, code: 'sensors_already_registered' },
            };
          }
          const sim = adicionarMotor(
            {
              nome: entrada.nome,
              tipo: entrada.tipo,
              mac,
              escovas: entrada.sensoresIniciais.map((s) => ({ numeroEscova: s.numeroEscova, modelo: s.modelo })),
            },
            'novo',
            Infinity
          );
          aoCadastrar(sim);
          return { status: 201, data: sim.motor };
        }
      }
      if (partes[1] === 'sensores' && partes[3] === 'ping' && m === 'POST') return { status: 204 };

      const motorId = Number(partes[1]);
      const sim = motores.find((s) => s.motor.id === motorId);
      if (!sim) return resposta404('Motor não encontrado.');

      if (partes.length === 2) {
        if (m === 'GET') return { status: 200, data: sim.motor };
        if (m === 'DELETE') {
          motores.splice(motores.indexOf(sim), 1);
          vinculos.delete(motorId);
          alertas.removerDoMotor(motorId);
          return { status: 204 };
        }
      }
      if (partes[2] === 'status' && m === 'GET') {
        const status = statusAtual(motorId);
        return status ? { status: 200, data: status } : resposta404('O motor ainda não enviou leituras.');
      }
      if (partes[2] === 'regras-qualidade') {
        const mapa = vinculos.get(motorId)!;
        if (partes.length === 3 && m === 'GET') {
          const lista = [...mapa.keys()].map((id) => vinculoResposta(motorId, id)).filter(Boolean);
          return { status: 200, data: lista };
        }
        const regraId = partes[3];
        if (!regras.some((r) => r.id === regraId)) return resposta404('Regra não encontrada.');
        if (m === 'GET') {
          const v = vinculoResposta(motorId, regraId);
          return v ? { status: 200, data: v } : resposta404('Vínculo não encontrado.');
        }
        if (m === 'POST') {
          if (mapa.has(regraId)) {
            return {
              status: 409,
              data: { title: 'Conflito', detail: 'Regra já vinculada.', status: 409, code: 'quality_rule_already_linked' },
            };
          }
          vincular(motorId, regraId, (corpo as { ativo?: boolean })?.ativo ?? true);
          return { status: 201, data: vinculoResposta(motorId, regraId) };
        }
        if (m === 'PUT') {
          if (!mapa.has(regraId)) return resposta404('Vínculo não encontrado.');
          vincular(motorId, regraId, (corpo as { ativo: boolean }).ativo);
          return { status: 200, data: vinculoResposta(motorId, regraId) };
        }
        if (m === 'DELETE') {
          mapa.delete(regraId);
          return { status: 204 };
        }
      }
    }

    if (partes[0] === 'regras-qualidade') {
      if (partes.length === 1) {
        if (m === 'GET') return { status: 200, data: regras };
        if (m === 'POST') {
          const entrada = corpo as RegraQualidadeRequest;
          // Omitir o tipo seleciona o limiar estático, como no backend.
          const tipo = entrada.tipoRegra ?? 'temperatura.limiar_estatico';
          const erro = validarParametros(tipo, entrada.parametros);
          if (erro) return resposta400('Parametros', erro);
          return { status: 201, data: criarRegra({ ...entrada, tipoRegra: tipo }) };
        }
      }
      const regra = regras.find((r) => r.id === partes[1]);
      if (!regra) return resposta404('Regra não encontrada.');
      if (m === 'GET') return { status: 200, data: regra };
      if (m === 'PUT') {
        const entrada = corpo as RegraQualidadeRequest;
        const tipo = entrada.tipoRegra ?? 'temperatura.limiar_estatico';
        const erro = validarParametros(tipo, entrada.parametros);
        if (erro) return resposta400('Parametros', erro);
        Object.assign(regra, {
          nome: entrada.nome,
          descricao: entrada.descricao ?? null,
          tipoRegra: tipo,
          parametros: entrada.parametros,
          ativo: entrada.ativo,
        });
        return { status: 200, data: regra };
      }
      if (m === 'DELETE') {
        regras.splice(regras.indexOf(regra), 1);
        vinculos.forEach((mapa) => mapa.delete(regra.id));
        alertas.desvincularRegra(regra.id);
        return { status: 204 };
      }
    }

    return resposta404('Rota desconhecida no simulador.');
  }

  return { tratar, tick, historico, statusAtual };
}

export type ServidorSimulado = ReturnType<typeof criarServidorSimulado>;
