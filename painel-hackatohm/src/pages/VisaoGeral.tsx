import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { guardarMacDoMotor } from '../features/motores/helpers/macMotor';
import { Plus, RefreshCw, Search } from 'lucide-react';
import collectorReference from '../assets/collector-reference.jpg';
import harrierIdentity from '../assets/harrier-identity.jpg';
import { useMonitoramento } from '../hooks/useMonitoramento';
import { Alert } from '../components/ui/Alert';
import { ApiErrorState } from '../components/ui/ApiErrorState';
import { Button, IconButton } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';
import { Panel } from '../components/ui/Panel';
import { ModalCadastro } from '../features/motores/components/ModalCadastro';
import { MotorRow } from '../features/motores/components/MotorRow';
import { motorCombinaComBusca } from '../features/motores/helpers/busca';
import { useTelemetriaMotores } from '../features/telemetria/hooks/useTelemetriaStore';
import { useAgora } from '../features/telemetria/hooks/useAgora';
import { telemetriaStore } from '../features/telemetria/store/telemetriaStore';
import { resumirMotor } from '../features/telemetria/helpers/resumoMotor';
import { compararPorUrgencia, EstadoPrincipal } from '../features/telemetria/helpers/estadoHelper';
import {
  contarPorFiltro,
  filtroDoEstado,
  FiltroMotor,
  ORDEM_FILTROS,
  ROTULO_FILTRO,
} from '../features/telemetria/helpers/linhaMotor';
import { subtituloDaFrota, tituloDaFrota } from '../features/telemetria/helpers/frota';
import { SeveritySymbol } from '../features/telemetria/components/SeveritySymbol';

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/** Símbolo de cada indicador de estado (o mesmo do estado que ele filtra). */
const SIMBOLO_FILTRO: Record<Exclude<FiltroMotor, 'todos'>, EstadoPrincipal> = {
  Critico: 'Critico',
  AlertaPreditivo: 'AlertaPreditivo',
  Atencao: 'Atencao',
  'sem-dados': 'offline',
  'sem-avaliacao': 'aguardando-amostras',
  Normal: 'Normal',
};

/** Mesmas colunas da linha do motor (`MotorRow`), para o cabeçalho alinhar. */
const COLUNAS_LISTA =
  'md:grid-cols-[minmax(190px,1.1fr)_minmax(0,1.7fr)_80px_72px_minmax(120px,auto)_16px]';

const PASSOS_PRIMEIRO_ACESSO = [
  { numero: '01', texto: 'Identifique o motor' },
  { numero: '02', texto: 'Informe o MAC do ESP e as escovas' },
  { numero: '03', texto: 'Acompanhe as leituras' },
];

const MASCARA_RENDER = 'linear-gradient(to right, transparent 0%, black 55%, black 100%)';

export const VisaoGeral: React.FC = () => {
  const { motores, carregando, erro, recarregar, cadastrarMotor } = useMonitoramento();
  const telemetria = useTelemetriaMotores();
  const agora = useAgora();
  const [filtro, setFiltro] = useState<FiltroMotor>('todos');
  const [busca, setBusca] = useState('');
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
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
  // O filtro escolhido vale mesmo com zero motores no estado: a lista vazia explica e oferece limpar.
  const visiveis = linhas.filter(
    (linha) =>
      (filtro === 'todos' || filtroDoEstado(linha.resumo.principal) === filtro) &&
      motorCombinaComBusca(linha.motor, busca)
  );
  const comFiltros = filtro !== 'todos' || busca.trim() !== '';
  const limparFiltros = () => {
    setFiltro('todos');
    setBusca('');
  };
  // Clicar no indicador ativo volta para todos.
  const alternarFiltro = (id: Exclude<FiltroMotor, 'todos'>) =>
    setFiltro((atual) => (atual === id ? 'todos' : id));
  const atualizar = () => {
    void recarregar();
    void telemetriaStore.recarregarTodos();
  };

  const titulo = tituloDaFrota(linhas, erro);
  const subtitulo = useMemo(() => subtituloDaFrota(linhas, agora), [linhas, agora]);

  const abrirCadastro = () => setParams({ novo: 'true' });
  const fecharCadastro = () => setParams({}, { replace: true });
  const carregandoInicial = carregando && motores.length === 0;
  // Zeros seriam mentira durante o carregamento inicial ou com a API fora do ar.
  const semContagem = carregandoInicial || (erro !== null && motores.length === 0);

  return (
    <div className="space-y-10">
      {total > 0 ? (
        <section
          aria-labelledby="titulo-sistema"
          className="relative overflow-hidden rounded-[var(--radius-panel)] border border-line bg-panel"
        >
          {/* Render ilustrativo do anel coletor: decorativo, nunca indica posição ou estado de sensor. */}
          <img
            src={collectorReference}
            alt=""
            loading="lazy"
            decoding="async"
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[46%] object-cover object-center opacity-80 lg:block"
            style={{ maskImage: MASCARA_RENDER, WebkitMaskImage: MASCARA_RENDER }}
          />
          <div className="relative flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="eyebrow">Estado do sistema</p>
                <h1 id="titulo-sistema" className="display mt-2 text-[28px] leading-tight sm:text-[34px]">
                  {titulo}
                </h1>
                {subtitulo && <p className="num mt-2 max-w-2xl text-[15px] text-ink-2">{subtitulo}</p>}
              </div>
              <Button onClick={abrirCadastro} className="self-start">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo motor
              </Button>
            </div>

            <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
              {ORDEM_FILTROS.map((id) => {
                const ativo = filtro === id;
                const n = contagem[id];
                const zero = !semContagem && n === 0;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => alternarFiltro(id)}
                    className={`inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] border px-3 text-[13px] transition-colors ${
                      ativo
                        ? 'border-ink-3 bg-raised text-ink'
                        : 'border-line bg-canvas/60 text-ink-2 hover:border-line-strong hover:text-ink'
                    }`}
                  >
                    <SeveritySymbol estado={SIMBOLO_FILTRO[id]} size={14} decorativo esmaecido={zero} />
                    {ROTULO_FILTRO[id]}
                    <span className={`num ${zero ? 'text-ink-3' : 'text-ink'}`}>{semContagem ? '—' : n}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <header>
          <p className="eyebrow">Estado do sistema</p>
          <h1 className="display mt-2 text-[28px] leading-tight sm:text-[34px]">{titulo}</h1>
        </header>
      )}

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
        <section
          aria-labelledby="primeiro-acesso"
          className="relative overflow-hidden rounded-[var(--radius-panel)] border border-dashed border-line-strong px-6 py-14 text-center"
        >
          <img
            src={harrierIdentity}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] max-h-[540px] w-auto -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.07]"
          />
          <div className="relative">
            <h2 id="primeiro-acesso" className="display text-base">
              Cadastre o primeiro motor
            </h2>
            <ol className="mx-auto mt-8 grid max-w-3xl gap-6 text-left sm:grid-cols-3">
              {PASSOS_PRIMEIRO_ACESSO.map((passo) => (
                <li key={passo.numero} className="flex items-baseline gap-3 sm:block">
                  <span className="num display text-2xl text-ink-3">{passo.numero}</span>
                  <span className="text-[15px] text-ink sm:mt-2 sm:block">{passo.texto}</span>
                </li>
              ))}
            </ol>
            <div className="mt-10">
              <Button onClick={abrirCadastro}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo motor
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-3" aria-label="Motores">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="relative min-w-0 flex-1 basis-64 sm:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
                aria-hidden="true"
              />
              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                aria-label="Buscar motor por nome ou tipo"
                placeholder="Buscar por nome ou tipo"
                className="field h-10 py-0 pl-9"
              />
            </div>
            <IconButton
              label="Atualizar motores"
              onClick={atualizar}
              disabled={carregando}
              className="h-10 w-10 border border-line-strong"
            >
              <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} aria-hidden="true" />
            </IconButton>
            <p role="status" className="num text-[13px] text-ink-2">
              {plural(visiveis.length, 'motor encontrado', 'motores encontrados')}
            </p>
            {comFiltros && (
              <Button size="sm" variant="ghost" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
          </div>

          {visiveis.length === 0 ? (
            <div className="rounded-[var(--radius-panel)] border border-dashed border-line-strong px-6 py-12 text-center">
              <h2 className="display text-base">Nenhum motor encontrado</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-2">
                Nenhum motor combina com a busca e o estado escolhidos.
              </p>
              <Button variant="secondary" size="sm" onClick={limparFiltros} className="mt-5">
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div>
              <div aria-hidden="true" className={`eyebrow hidden gap-x-6 px-5 pb-2 md:grid ${COLUNAS_LISTA}`}>
                <span>Equipamento</span>
                <span>Temperatura por escova</span>
                <span />
                <span />
                <span className="text-right">Estado</span>
                <span />
              </div>
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
            </div>
          )}
        </section>
      )}

      <ModalCadastro
        aberto={cadastroAberto}
        onFechar={fecharCadastro}
        onCadastrar={cadastrarMotor}
        onConcluido={(motor, dados) => {
          // O MAC não volta do backend antes do primeiro lote: guarda o informado para o detalhe mostrar.
          guardarMacDoMotor(motor.id, dados.sensoresIniciais[0]?.macAddress ?? '');
          navigate(`/motores/${motor.id}`);
        }}
      />
    </div>
  );
};
