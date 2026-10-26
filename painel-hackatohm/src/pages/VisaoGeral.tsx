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
import { NivelStatus } from '../features/telemetria/types/telemetria';
import {
  compararPorUrgencia,
  formatarGrau,
  STATUS_THEME,
} from '../features/telemetria/helpers/statusHelper';

type Filtro = NivelStatus | 'todos';

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export const VisaoGeral: React.FC = () => {
  const { motores, motoresComStatus, carregando, erro, recarregar, cadastrarMotor, kpis } =
    useMonitoramento();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [params, setParams] = useSearchParams();
  const cadastroAberto = params.get('novo') === 'true';

  const ordenados = useMemo(
    () =>
      [...motoresComStatus].sort(
        (a, b) =>
          compararPorUrgencia(a.statusGeral, b.statusGeral) || a.nome.localeCompare(b.nome, 'pt-BR')
      ),
    [motoresComStatus]
  );

  const contagemDoFiltro = ordenados.filter((m) => m.statusGeral === filtro).length;
  // Se o estado filtrado some (ex.: motor voltou ao normal), volta para todos.
  const filtroAtivo: Filtro = filtro !== 'todos' && contagemDoFiltro === 0 ? 'todos' : filtro;
  const visiveis =
    filtroAtivo === 'todos' ? ordenados : ordenados.filter((m) => m.statusGeral === filtroAtivo);

  const maisQuente = useMemo(() => {
    let melhor: { motor: string; escova: number; valor: number } | null = null;
    for (const motor of motoresComStatus) {
      for (const sensor of motor.sensores) {
        const valor = sensor.ultimaLeitura?.valorCelsius;
        if (typeof valor === 'number' && (!melhor || valor > melhor.valor)) {
          melhor = { motor: motor.nome, escova: sensor.numeroEscova, valor };
        }
      }
    }
    return melhor;
  }, [motoresComStatus]);

  const titulo =
    kpis.totalMotores === 0
      ? 'Nenhum motor cadastrado'
      : kpis.perigo > 0
        ? plural(kpis.perigo, 'motor em estado crítico', 'motores em estado crítico')
        : kpis.atencao > 0
          ? plural(kpis.atencao, 'motor pede atenção', 'motores pedem atenção')
          : kpis.offline === kpis.totalMotores
            ? 'Aguardando leituras'
            : 'Todos os motores estáveis';

  const contagens: [Filtro, number][] = [
    ['todos', kpis.totalMotores],
    ['perigo', kpis.perigo],
    ['warning', kpis.atencao],
    ['offline', kpis.offline],
  ];
  const mostrarFiltros = kpis.perigo + kpis.atencao + kpis.offline > 0;

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
              escova {maisQuente.escova} de {maisQuente.motor}.
            </p>
          )}
        </div>
        {kpis.totalMotores > 0 && (
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
            description="Informe o motor e o endereço MAC do ESP32 de cada escova para começar a ver as temperaturas."
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
              {contagens
                .filter(([chave, n]) => chave === 'todos' || n > 0)
                .map(([chave, n]) => {
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
                      {chave === 'todos' ? 'Todos' : STATUS_THEME[chave].label}
                      <span className="num ml-1.5 text-ink-3">{n}</span>
                    </button>
                  );
                })}
            </div>
          )}
          <Panel>
            {visiveis.map((motor) => (
              <MotorRow key={motor.id} motor={motor} />
            ))}
          </Panel>
        </section>
      )}

      <ModalCadastro aberto={cadastroAberto} onFechar={fecharCadastro} onCadastrar={cadastrarMotor} />
    </div>
  );
};
