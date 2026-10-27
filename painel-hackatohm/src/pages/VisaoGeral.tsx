import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import harrierMark from '../assets/harrier-mark.png';
import { useMonitoramento } from '../hooks/useMonitoramento';
import { Alert } from '../components/ui/Alert';
import { ApiErrorState } from '../components/ui/ApiErrorState';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { Panel } from '../components/ui/Panel';
import { Segmented } from '../components/ui/Segmented';
import { ModalCadastro } from '../features/motores/components/ModalCadastro';
import { MotorRow } from '../features/motores/components/MotorRow';
import { useTelemetriaMotores } from '../features/telemetria/hooks/useTelemetriaStore';
import { useAgora } from '../features/telemetria/hooks/useAgora';
import { resumirMotor } from '../features/telemetria/helpers/resumoMotor';
import { compararPorUrgencia, ehSeveridadeAnormal } from '../features/telemetria/helpers/estadoHelper';
import {
  contarPorFiltro,
  descreverMotivo,
  filtroDoEstado,
  FiltroMotor,
  motivoDoMotor,
  ORDEM_FILTROS,
  ROTULO_FILTRO,
} from '../features/telemetria/helpers/linhaMotor';
import { formatarGrau, formatarRelativo } from '../features/telemetria/helpers/statusHelper';
import { AnunciadorSeveridade } from '../features/telemetria/components/AnunciadorSeveridade';

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export const VisaoGeral: React.FC = () => {
  const { motores, carregando, erro, recarregar, cadastrarMotor } = useMonitoramento();
  const telemetria = useTelemetriaMotores();
  const agora = useAgora();
  const [filtro, setFiltro] = useState<FiltroMotor>('todos');
  const [params, setParams] = useSearchParams();
  const cadastroAberto = params.get('novo') === 'true';

  const linhas = useMemo(
    () =>
      motores
        .map((motor) => ({
          motor,
          telemetria: telemetria[motor.id],
          resumo: resumirMotor(telemetria[motor.id], agora),
        }))
        .sort(
          (a, b) =>
            compararPorUrgencia(a.resumo.principal, b.resumo.principal) ||
            a.motor.nome.localeCompare(b.motor.nome, 'pt-BR')
        ),
    [motores, telemetria, agora]
  );

  const contagem = useMemo(() => contarPorFiltro(linhas.map((l) => l.resumo.principal)), [linhas]);
  const total = linhas.length;
  const estadosDosMotores = useMemo(
    () => linhas.map((l) => ({ id: l.motor.id, nome: l.motor.nome, principal: l.resumo.principal })),
    [linhas]
  );

  // Se o estado filtrado some (ex.: motor voltou ao normal), volta para todos.
  const filtroAtivo: FiltroMotor = filtro !== 'todos' && contagem[filtro] === 0 ? 'todos' : filtro;
  const visiveis =
    filtroAtivo === 'todos'
      ? linhas
      : linhas.filter((linha) => filtroDoEstado(linha.resumo.principal) === filtroAtivo);
  const filtros = [
    { id: 'todos' as FiltroMotor, rotulo: ROTULO_FILTRO.todos, contagem: total },
    ...ORDEM_FILTROS.filter((id) => contagem[id] > 0).map((id) => ({
      id,
      rotulo: ROTULO_FILTRO[id],
      contagem: contagem[id],
    })),
  ];

  const titulo = (() => {
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
  })();

  // Linha de apoio: o motivo do motor mais grave (o quê, onde, quanto) ou a maior leitura.
  const subtitulo = useMemo(() => {
    const mais = linhas[0];
    if (!mais) return null;
    if (ehSeveridadeAnormal(mais.resumo.severidade)) {
      const motivo = motivoDoMotor(mais.telemetria, mais.resumo.motivo);
      if (motivo) {
        return `${descreverMotivo(motivo, mais.motor.nome)} · ${formatarRelativo(mais.resumo.ultimoLoteEm, agora)}`;
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
  }, [linhas, agora]);

  const abrirCadastro = () => setParams({ novo: 'true' });
  const fecharCadastro = () => setParams({}, { replace: true });
  const carregandoInicial = carregando && motores.length === 0;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="display text-[28px] leading-tight sm:text-[34px]">{titulo}</h1>
          {subtitulo && <p className="num mt-2 text-[15px] text-ink-2">{subtitulo}</p>}
        </div>
        {total > 0 && (
          <Button onClick={abrirCadastro} className="self-start sm:self-auto">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo motor
          </Button>
        )}
      </header>

      {erro && motores.length > 0 && (
        <Alert
          tone="error"
          title="Não foi possível atualizar os motores"
          message={erro}
          action={
            <Button size="sm" variant="secondary" onClick={() => void recarregar()}>
              Tentar de novo
            </Button>
          }
        />
      )}

      {carregandoInicial ? (
        <LoadingState label="Carregando motores" />
      ) : motores.length === 0 && erro ? (
        <ApiErrorState
          title="Não foi possível carregar os motores"
          message={erro}
          onRetry={() => void recarregar()}
        />
      ) : motores.length === 0 ? (
        <EmptyState
          title="Cadastre o primeiro motor"
          description="Informe o motor, o endereço MAC do ESP e as escovas para começar a ver as temperaturas."
          action={
            <div className="flex flex-col items-center gap-6">
              <img src={harrierMark} alt="" className="h-16 w-auto opacity-40" />
              <Button onClick={abrirCadastro}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo motor
              </Button>
            </div>
          }
        />
      ) : (
        <section className="space-y-4" aria-label="Motores">
          {filtros.length > 2 && (
            <Segmented label="Filtrar por estado" valor={filtroAtivo} onChange={setFiltro} itens={filtros} />
          )}
          <Panel>
            {visiveis.map((linha) => (
              <MotorRow
                key={linha.motor.id}
                motor={linha.motor}
                telemetria={linha.telemetria}
                resumo={linha.resumo}
                agora={agora}
              />
            ))}
          </Panel>
        </section>
      )}

      <AnunciadorSeveridade motores={estadosDosMotores} />
      <ModalCadastro aberto={cadastroAberto} onFechar={fecharCadastro} onCadastrar={cadastrarMotor} />
    </div>
  );
};
