import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import harrierMark from '../assets/harrier-mark.png';
import { useMonitoramento } from '../hooks/useMonitoramento';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { Panel } from '../components/ui/Panel';
import { ModalCadastro } from '../features/motores/components/ModalCadastro';
import { MotorRow } from '../features/motores/components/MotorRow';
import { useTelemetriaMotores } from '../features/telemetria/hooks/useTelemetriaStore';
import { useAgora } from '../features/telemetria/hooks/useAgora';
import { resumirMotor } from '../features/telemetria/helpers/resumoMotor';
import {
  compararPorUrgencia,
  EstadoPrincipal,
  PRIORIDADE_ESTADO,
} from '../features/telemetria/helpers/estadoHelper';
import { TEMA_ESTADO } from '../features/telemetria/helpers/apresentacao';
import { formatarGrau, formatarRelativo } from '../features/telemetria/helpers/statusHelper';

type Filtro = EstadoPrincipal | 'todos';

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export const VisaoGeral: React.FC = () => {
  const { motores, carregando, erro, recarregar, cadastrarMotor } = useMonitoramento();
  const telemetria = useTelemetriaMotores();
  const agora = useAgora();
  const [filtro, setFiltro] = useState<Filtro>('todos');
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

  const contagem = (estado: EstadoPrincipal) =>
    linhas.filter((linha) => linha.resumo.principal === estado).length;
  const total = linhas.length;
  const critico = contagem('Critico');
  const alerta = contagem('AlertaPreditivo');
  const atencao = contagem('Atencao');
  const semDados = linhas.filter(
    (linha) => linha.resumo.dado !== 'ao-vivo' && linha.resumo.dado !== 'sem-leitura'
  ).length;

  // Se o estado filtrado some (ex.: motor voltou ao normal), volta para todos.
  const filtroAtivo: Filtro =
    filtro !== 'todos' && contagem(filtro) === 0 ? 'todos' : filtro;
  const visiveis =
    filtroAtivo === 'todos'
      ? linhas
      : linhas.filter((linha) => linha.resumo.principal === filtroAtivo);

  const maisQuente = useMemo(() => {
    let melhor: { motor: string; escova: number; valor: number; dataHora: string } | null = null;
    for (const linha of linhas) {
      for (const [numero, serie] of Object.entries(linha.telemetria?.escovas ?? {})) {
        const ultima = serie.ultima;
        if (ultima && (!melhor || ultima.valorCelsius > melhor.valor)) {
          melhor = {
            motor: linha.motor.nome,
            escova: Number(numero),
            valor: ultima.valorCelsius,
            dataHora: ultima.dataHora,
          };
        }
      }
    }
    return melhor;
  }, [linhas]);

  const titulo =
    total === 0
      ? erro
        ? 'Motores indisponíveis'
        : 'Nenhum motor cadastrado'
      : critico > 0
        ? plural(critico, 'motor em estado crítico', 'motores em estado crítico')
        : alerta > 0
          ? plural(alerta, 'motor com alerta preditivo', 'motores com alerta preditivo')
          : atencao > 0
            ? plural(atencao, 'motor pede atenção', 'motores pedem atenção')
            : semDados > 0
              ? plural(semDados, 'motor sem dados recentes', 'motores sem dados recentes')
              : contagem('Normal') === total
                ? 'Todos os motores normais'
                : 'Nenhum alerta ativo';

  const estadosPresentes = (Object.keys(PRIORIDADE_ESTADO) as EstadoPrincipal[])
    .sort((a, b) => PRIORIDADE_ESTADO[b] - PRIORIDADE_ESTADO[a])
    .map((estado): [EstadoPrincipal, number] => [estado, contagem(estado)])
    .filter(([, n]) => n > 0);
  const mostrarFiltros = estadosPresentes.some(([estado]) => estado !== 'Normal');

  const abrirCadastro = () => setParams({ novo: 'true' });
  const fecharCadastro = () => setParams({}, { replace: true });
  const carregandoInicial = carregando && motores.length === 0;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="display text-[28px] leading-tight sm:text-[34px]">{titulo}</h1>
          {maisQuente && (
            <p className="mt-2 text-[15px] text-ink-2">
              Maior leitura: <span className="num text-ink">{formatarGrau(maisQuente.valor)} °C</span>,
              escova {maisQuente.escova} de {maisQuente.motor},{' '}
              {formatarRelativo(maisQuente.dataHora, agora)}.
            </p>
          )}
        </div>
        {total > 0 && (
          <Button onClick={abrirCadastro} className="self-start sm:self-auto">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo motor
          </Button>
        )}
      </header>

      {erro && (
        <Alert
          tone="error"
          title="Não foi possível carregar os motores"
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
      ) : motores.length === 0 ? (
        !erro && (
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
        )
      ) : (
        <section className="space-y-4">
          {mostrarFiltros && (
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar por estado">
              {[['todos', total] as [Filtro, number], ...estadosPresentes].map(([chave, n]) => {
                const ativo = filtroAtivo === chave;
                return (
                  <button
                    key={chave}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => setFiltro(chave)}
                    className={`rounded-full px-3 py-1 text-[13px] transition-colors ${
                      ativo ? 'bg-raised text-ink' : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    {chave === 'todos' ? 'Todos' : TEMA_ESTADO[chave].label}
                    <span className="num ml-1.5 text-ink-3">{n}</span>
                  </button>
                );
              })}
            </div>
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

      <ModalCadastro aberto={cadastroAberto} onFechar={fecharCadastro} onCadastrar={cadastrarMotor} />
    </div>
  );
};
