import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, ArrowRight, Plus, RefreshCw, Search, Thermometer, X } from 'lucide-react';
import collectorReference from '@/assets/collector-reference.jpg';
import { useMonitoramento } from '@/hooks/useMonitoramento';
import { KpiStatsBar } from '@/components/KpiStatsBar';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Panel } from '@/components/ui/Panel';
import { ModalCadastro } from '@/features/motores/components/ModalCadastro';
import { MotorRow } from '@/features/motores/components/MotorRow';
import { NivelStatus } from '@/features/telemetria/types/telemetria';
import { compararPorUrgencia, formatarGrau, STATUS_THEME } from '@/features/telemetria/helpers/statusHelper';

type Filtro = NivelStatus | 'todos';
const normalizar = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

export const VisaoGeral: React.FC = () => {
  const { motores, motoresComStatus, carregando, erro, recarregar, cadastrarMotor, kpis, statusConexaoHub } = useMonitoramento();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');
  const [params, setParams] = useSearchParams();
  const cadastroAberto = params.get('novo') === 'true';
  const carregandoInicial = carregando && motores.length === 0;
  const indisponivel = carregandoInicial || (!!erro && motores.length === 0);
  const ordenados = useMemo(() => [...motoresComStatus].sort((a, b) => compararPorUrgencia(a.statusGeral, b.statusGeral) || a.nome.localeCompare(b.nome, 'pt-BR')), [motoresComStatus]);
  const visiveis = ordenados.filter((motor) => (filtro === 'todos' || motor.statusGeral === filtro) && normalizar(`${motor.nome} ${motor.tipo}`).includes(normalizar(busca.trim())));
  const maisQuente = useMemo(() => {
    let melhor: { motor: string; escova: number; valor: number } | null = null;
    for (const motor of motoresComStatus) {
      for (const sensor of motor.sensores) {
        const valor = sensor.ultimaLeitura?.valorCelsius;
        if (typeof valor === 'number' && Number.isFinite(valor) && (!melhor || valor > melhor.valor)) {
          melhor = { motor: motor.nome, escova: sensor.numeroEscova, valor };
        }
      }
    }
    return melhor;
  }, [motoresComStatus]);

  const titulo = carregandoInicial
    ? 'Conectando ao seu monitoramento'
    : erro && motores.length === 0
      ? 'Não foi possível obter os dados'
      : kpis.totalMotores === 0
        ? 'Seu monitoramento começa aqui'
        : kpis.perigo > 0
          ? `${kpis.perigo} ${kpis.perigo === 1 ? 'motor em estado crítico' : 'motores em estado crítico'}`
          : kpis.atencao > 0
            ? `${kpis.atencao} ${kpis.atencao === 1 ? 'motor pede atenção' : 'motores pedem atenção'}`
            : !maisQuente
              ? 'Aguardando as primeiras leituras'
              : kpis.offline > 0
                ? `${kpis.offline} ${kpis.offline === 1 ? 'motor aguardando sinal' : 'motores aguardando sinal'}`
                : kpis.semAvaliacao > 0
                  ? `${kpis.semAvaliacao} ${kpis.semAvaliacao === 1 ? 'motor sem avaliação dos Quality Gates' : 'motores sem avaliação dos Quality Gates'}`
                  : 'Quality Gates sem alertas';
  const corResumo = indisponivel ? 'text-ink-2' : kpis.perigo > 0 ? 'text-hot' : kpis.atencao > 0 ? 'text-warn' : 'text-ink';
  const abrirCadastro = () => setParams({ novo: 'true' });
  const fecharCadastro = () => setParams({}, { replace: true });
  const limparFiltros = () => { setBusca(''); setFiltro('todos'); };

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Central de monitoramento</p>
          <h1 className="display text-[28px] leading-tight sm:text-[32px]">Visão geral</h1>
          <p className="mt-2 text-sm text-ink-2">Acompanhe a temperatura das escovas e priorize sua inspeção.</p>
        </div>
        <Button onClick={abrirCadastro} className="self-start sm:self-auto">
          <Plus className="h-4 w-4" aria-hidden="true" /> Novo motor
        </Button>
      </header>

      <section className="system-overview relative isolate overflow-hidden rounded-2xl border border-line" aria-label="Resumo do monitoramento">
        <div className="relative z-10 max-w-[700px] px-6 py-7 sm:px-8 sm:py-8 lg:max-w-[66%]">
          <div className="mb-4 flex items-center gap-2 text-[11px] text-ink-2"><Activity className="h-3.5 w-3.5" aria-hidden="true" /> ESTADO DO SISTEMA</div>
          <h2 className={`display text-[22px] leading-snug sm:text-[26px] ${corResumo}`}>{titulo}</h2>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-2">
            {indisponivel ? 'Os indicadores ficam disponíveis após o carregamento dos motores.' : kpis.totalMotores === 0 ? 'Conecte seus sensores e reúna as leituras de cada motor em um só lugar.' : 'Os motores que precisam de atenção aparecem primeiro na lista.'}
          </p>
          <div className="mt-5 flex items-start gap-2 text-[12px] text-ink-2">
            <Thermometer className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {maisQuente ? <p>Maior leitura registrada: <span className="num font-medium text-ink">{formatarGrau(maisQuente.valor)} °C</span><span className="mt-0.5 block text-ink-3">{maisQuente.motor} · Escova {maisQuente.escova}</span></p> : <p>Escovas e anéis coletores<span className="mt-0.5 block text-ink-3">Monitoramento contínuo de temperatura</span></p>}
          </div>
        </div>
        <img src={collectorReference} alt="" className="collector-visual pointer-events-none absolute inset-y-0 right-0 -z-0 hidden h-full w-[49%] object-cover opacity-80 lg:block" />
      </section>

      <KpiStatsBar kpis={kpis} filtroAtivo={filtro} onSelecionarFiltro={setFiltro} indisponivel={indisponivel} />

      {statusConexaoHub !== 'conectado' && motores.length > 0 && (
        <Alert tone="warning" title="Telemetria sem conexão ao vivo" message="As leituras exibidas podem estar desatualizadas. A conexão será retomada automaticamente." />
      )}
      {erro && <Alert tone="error" title="Não foi possível carregar os motores" message="Verifique a conexão com o serviço de monitoramento e tente novamente." action={<Button size="sm" variant="secondary" busy={carregando} onClick={() => void recarregar()}>Tentar novamente</Button>} />}

      <section className="space-y-4" aria-labelledby="motores-titulo">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 id="motores-titulo" className="display text-lg">Motores monitorados <span className="num ml-1 text-sm text-ink-3">{indisponivel ? '—' : kpis.totalMotores}</span></h2>
            <p className="mt-1 text-xs text-ink-3">Selecione um motor para ver suas escovas e regras.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
              <input type="search" aria-label="Buscar motores por nome ou tipo" placeholder="Buscar por nome ou tipo..." value={busca} onChange={(e) => setBusca(e.target.value)} className="field pl-9" />
            </div>
            <Button variant="secondary" busy={carregando} onClick={() => void recarregar()} aria-label="Atualizar lista de motores" title="Atualizar lista de motores" className="px-3">
              <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} aria-hidden="true" />
            </Button>
          </div>
        </div>

        {(filtro !== 'todos' || busca.trim()) && <div className="flex flex-wrap items-center gap-3 text-xs text-ink-2" role="status">
          <span>{visiveis.length} {visiveis.length === 1 ? 'motor encontrado' : 'motores encontrados'}{filtro !== 'todos' && ` · ${STATUS_THEME[filtro].label}`}</span>
          <button type="button" onClick={limparFiltros} className="inline-flex min-h-9 items-center gap-1 text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"><X className="h-3 w-3" aria-hidden="true" /> Limpar filtros</button>
        </div>}

        {carregandoInicial ? <LoadingState label="Carregando motores" /> : motores.length === 0 ? !erro && (
          <div className="rounded-2xl border border-line bg-panel px-6 py-9 sm:px-8">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-lg">
                <p className="eyebrow mb-2">Primeiro acesso</p>
                <h3 className="display text-lg">Tudo pronto para o primeiro motor</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">Cadastre o equipamento e vincule o MAC do ESP32 de cada escova. As temperaturas aparecem assim que os sensores enviarem suas leituras.</p>
              </div>
              <Button variant="secondary" onClick={abrirCadastro}>Cadastrar motor <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
            </div>
            <ol className="mt-7 grid gap-3 border-t border-line pt-5 text-xs text-ink-2 sm:grid-cols-3">
              {['Identifique o motor', 'Vincule suas escovas', 'Acompanhe as leituras'].map((passo, i) => <li key={passo} className="flex items-center gap-2"><span className="num flex h-6 w-6 items-center justify-center rounded-full border border-line-strong text-[10px] text-ink">0{i + 1}</span>{passo}</li>)}
            </ol>
          </div>
        ) : visiveis.length === 0 ? <EmptyState title="Nenhum motor neste filtro" description="Busque outro nome ou altere o estado selecionado." action={<Button variant="secondary" onClick={limparFiltros}>Limpar filtros</Button>} /> : (
          <Panel>
            <div className="hidden grid-cols-[minmax(200px,0.9fr)_minmax(0,2fr)_128px] gap-x-6 bg-raised/30 px-5 py-3 text-[10px] uppercase tracking-[0.12em] text-ink-3 md:grid"><span>Equipamento</span><span>Temperatura por escova</span><span className="text-right">Estado</span></div>
            {visiveis.map((motor) => <MotorRow key={motor.id} motor={motor} />)}
          </Panel>
        )}
      </section>
      <ModalCadastro aberto={cadastroAberto} onFechar={fecharCadastro} onCadastrar={cadastrarMotor} />
    </div>
  );
};
