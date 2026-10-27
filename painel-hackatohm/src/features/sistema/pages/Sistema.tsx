import React, { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { idadeEmSegundos } from '@/features/telemetria/helpers/estadoHelper';
import { formatarRelativo } from '@/features/telemetria/helpers/statusHelper';
import { useAgora } from '@/features/telemetria/hooks/useAgora';
import { useConexaoHub, useTelemetriaMotores } from '@/features/telemetria/hooks/useTelemetriaStore';
import { PipelineDiagram } from '../components/PipelineDiagram';
import { useSaude } from '../hooks/useSaude';
import { montarPipeline } from '../helpers/pipeline';
import { cadenciaMedianaSegundos, EstadoSaude, ResultadoSaude } from '../helpers/saude';

const TEXTO_HUB = {
  conectado: 'Conectado',
  conectando: 'Conectando',
  reconectando: 'Reconectando',
  desconectado: 'Sem conexão',
} as const;

const TEXTO_SAUDE: Record<EstadoSaude, string> = {
  saudavel: 'Saudável',
  degradado: 'Degradado',
  indisponivel: 'Indisponível',
};

const Medida: React.FC<{ rotulo: string; valor: React.ReactNode; nota?: string }> = ({ rotulo, valor, nota }) => (
  <div className="px-5 py-4">
    <dt className="eyebrow">{rotulo}</dt>
    <dd className="num display mt-1.5 text-2xl text-ink">{valor}</dd>
    {nota && <p className="mt-1 text-[13px] text-ink-3">{nota}</p>}
  </div>
);

const ChecagemSaude: React.FC<{ rota: string; explicacao: string; resultado: ResultadoSaude | null }> = ({
  rota,
  explicacao,
  resultado,
}) => (
  <div className="px-5 py-4">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h3 className="font-mono text-[13px] text-ink">GET {rota}</h3>
      <p className="num text-[13px] text-ink-2">
        {resultado === null
          ? 'Consultando…'
          : `${TEXTO_SAUDE[resultado.estado]} · ${resultado.httpStatus === null ? 'sem resposta' : `HTTP ${resultado.httpStatus}`}`}
      </p>
    </div>
    <p className="mt-1 text-[13px] text-ink-3">{explicacao}</p>
    {resultado && (resultado.itens.length > 0 || resultado.bruto) && (
      <details className="mt-2 text-[13px] text-ink-2">
        <summary className="w-fit rounded-sm text-ink-3 hover:text-ink">Detalhe técnico</summary>
        {resultado.itens.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {resultado.itens.map((item) => (
              <li key={item.nome}>
                <span className="font-mono text-[12px]">{item.nome}</span>: {TEXTO_SAUDE[item.estado]}
                {item.descricao && ` (${item.descricao})`}
              </li>
            ))}
          </ul>
        )}
        {resultado.bruto && (
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-canvas px-3 py-2 font-mono text-[12px] text-ink-2">
            {resultado.bruto}
          </pre>
        )}
      </details>
    )}
  </div>
);

export const Sistema: React.FC = () => {
  const saude = useSaude();
  const hub = useConexaoHub();
  const motores = useTelemetriaMotores();
  const agora = useAgora();

  const { ultimoLoteEm, lotes, cadencia } = useMemo(() => {
    const lista = Object.values(motores);
    const instantes = lista
      .map((m) => m.ultimoLoteEm)
      .filter((v): v is string => v !== null)
      .sort((a, b) => Date.parse(b) - Date.parse(a));
    return {
      ultimoLoteEm: instantes[0] ?? null,
      lotes: lista.reduce((soma, m) => soma + m.lotesNaSessao, 0),
      cadencia: cadenciaMedianaSegundos(
        lista.flatMap((m) => Object.values(m.escovas).map((s) => s.pontos.map((p) => p.t)))
      ),
    };
  }, [motores]);

  const idade = idadeEmSegundos(ultimoLoteEm, agora);
  const etapas = montarPipeline({
    live: saude.live,
    ready: saude.ready,
    hub,
    idadeUltimoLoteSegundos: idade,
    lotesNaSessao: lotes,
  });
  const falhas = etapas.filter((e) => e.estado === 'falha');
  const atencoes = etapas.filter((e) => e.estado === 'atencao');
  const titulo =
    falhas.length > 0
      ? `${falhas.map((e) => e.nome).join(', ')}: com falha`
      : atencoes.length > 0
        ? `${atencoes.map((e) => e.nome).join(', ')}: atenção`
        : etapas.every((e) => e.estado === 'ok')
          ? 'Caminho dos dados operando'
          : 'Caminho dos dados em verificação';

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Sistema</p>
          <h1 className="display mt-2 text-[28px] leading-tight sm:text-[34px]">{titulo}</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink-2">
            Do sensor ao painel: cada etapa mostra o que o painel consegue verificar. Etapa que ele não enxerga
            aparece como não verificada, nunca como operando.
          </p>
        </div>
        <IconButton
          label="Verificar de novo"
          onClick={saude.consultar}
          disabled={saude.consultando}
          className="h-10 w-10 shrink-0 border border-line-strong"
        >
          <RefreshCw className={`h-4 w-4 ${saude.consultando ? 'animate-spin' : ''}`} aria-hidden="true" />
        </IconButton>
      </header>

      <section aria-labelledby="pipeline">
        <h2 id="pipeline" className="sr-only">
          Etapas do caminho dos dados
        </h2>
        <PipelineDiagram etapas={etapas} />
      </section>

      <section aria-labelledby="sessao" className="space-y-3">
        <h2 id="sessao" className="display text-base">
          Nesta sessão
        </h2>
        <Panel>
          <dl className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            <Medida rotulo="Hub" valor={TEXTO_HUB[hub]} nota="SignalR, conexão ao vivo" />
            <Medida
              rotulo="Último lote"
              valor={ultimoLoteEm ? formatarRelativo(ultimoLoteEm, agora) : '—'}
              nota="O mais recente entre os motores"
            />
            <Medida rotulo="Lotes recebidos" valor={lotes} nota="Desde que a página abriu" />
            <Medida
              rotulo="Cadência medida"
              valor={cadencia === null ? '—' : `${cadencia.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`}
              nota="Mediana entre lotes; referência do ESP: ~10 s"
            />
          </dl>
        </Panel>
      </section>

      <section aria-labelledby="saude" className="space-y-3">
        <h2 id="saude" className="display text-base">
          Saúde da API
        </h2>
        <Panel>
          <ChecagemSaude
            rota="/health/live"
            explicacao="A aplicação está viva e a fila de telemetria disponível."
            resultado={saude.live}
          />
          <ChecagemSaude
            rota="/health/ready"
            explicacao="O PostgreSQL responde e a fila pode aceitar tráfego."
            resultado={saude.ready}
          />
        </Panel>
        <p className="text-[13px] text-ink-3">
          {saude.consultadoEm
            ? `Consultado ${formatarRelativo(new Date(saude.consultadoEm).toISOString(), agora)}; atualiza a cada 15 s.`
            : 'Consultando…'}
        </p>
      </section>
    </div>
  );
};
