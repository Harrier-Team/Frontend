import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import harrierEmblem from '../assets/harrier-emblem.jpg';
import { useMonitoramento } from '../hooks/useMonitoramento';
import { LoadingState } from '../components/ui/LoadingState';
import { MotorResponse } from '../features/motores/types/motor';
import { useLimitesTermicos } from '../features/motores/hooks/useLimitesTermicos';
import { CollectorRing } from '../features/telemetria/components/CollectorRing';
import { SeveritySymbol } from '../features/telemetria/components/SeveritySymbol';
import { TrendChart } from '../features/telemetria/components/TrendChart';
import { ROTULO_DADO, TEMA_ESTADO } from '../features/telemetria/helpers/apresentacao';
import { dadosDoAnel } from '../features/telemetria/helpers/dadosDoAnel';
import { compararPorUrgencia, ehSeveridadeAnormal, estaDesatualizado } from '../features/telemetria/helpers/estadoHelper';
import { LinhaFrota, subtituloDaFrota, tituloDaFrota } from '../features/telemetria/helpers/frota';
import { resumirEscova, resumirMotor } from '../features/telemetria/helpers/resumoMotor';
import { fraseCurtaPrevisao, previsoesDoMotor } from '../features/telemetria/helpers/previsao';
import { formatarGrau, formatarRelativo } from '../features/telemetria/helpers/statusHelper';
import { useAgora } from '../features/telemetria/hooks/useAgora';
import { useConexaoHub, useTelemetriaMotores } from '../features/telemetria/hooks/useTelemetriaStore';
import { SEVERIDADE_THEME } from '../features/quality-gates/helpers/qualityGateHelper';
import { MotorTelemetria } from '../features/telemetria/store/tipos';

const COR_BARRA = {
  Critico: 'var(--color-sev-critico)',
  AlertaPreditivo: 'var(--color-sev-alerta)',
} as const;

/** Temperaturas por escova em tamanho de projetor. */
const Temperaturas: React.FC<{
  motor: MotorResponse;
  telemetria: MotorTelemetria | undefined;
  desatualizado: boolean;
}> = ({ motor, telemetria, desatualizado }) => {
  const sensores = [...motor.sensores].sort((a, b) => a.numeroEscova - b.numeroEscova);
  return (
    <ul className="flex flex-wrap gap-x-8 gap-y-3">
      {sensores.map((sensor) => {
        const serie = telemetria?.escovas[sensor.numeroEscova];
        const valor = serie?.ultima?.valorCelsius ?? null;
        const { severidade } = resumirEscova(serie);
        const anormal = ehSeveridadeAnormal(severidade);
        return (
          <li key={sensor.id} className="flex items-baseline gap-2">
            <span className="text-[18px] text-ink-3">E{sensor.numeroEscova}</span>
            <span
              className="num display inline-flex items-center gap-2 text-[40px] leading-none"
              style={{
                color: anormal ? SEVERIDADE_THEME[severidade!].color : desatualizado ? 'var(--color-ink-2)' : 'var(--color-ink)',
                opacity: anormal && desatualizado ? 0.6 : 1,
              }}
            >
              {anormal && <SeveritySymbol estado={severidade!} size={26} decorativo />}
              <span className="sr-only">Escova {sensor.numeroEscova}:</span>
              {formatarGrau(valor).replace('--', '—')}
              {valor !== null && <span className="text-[20px] text-ink-3">°C</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

const EstadoGrande: React.FC<{ linha: LinhaFrota; agora: number }> = ({ linha, agora }) => {
  const { resumo } = linha;
  const tema = TEMA_ESTADO[resumo.principal];
  const desatualizado = estaDesatualizado(resumo.dado);
  const anormal = ehSeveridadeAnormal(resumo.severidade);
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
      <span
        className="inline-flex items-center gap-2.5 text-[26px]"
        style={{
          color: anormal ? tema.color : 'var(--color-ink-2)',
          opacity: anormal && desatualizado ? 0.6 : 1,
        }}
      >
        <SeveritySymbol estado={resumo.principal} size={28} decorativo />
        {tema.label}
      </span>
      {resumo.dado !== 'sem-leitura' && (
        <span className="num text-[18px] text-ink-3">
          {ROTULO_DADO[resumo.dado]} · {formatarRelativo(resumo.ultimoLoteEm, agora)}
          {desatualizado && ' · desatualizado'}
        </span>
      )}
    </div>
  );
};

/**
 * Com previsão ativa, a frase grande é a mensagem central: "Escova 2 → 95 °C
 * em ~8 min". A estimativa é a do backend, ancorada no último lote.
 */
const PrevisaoGrande: React.FC<{ telemetria: MotorTelemetria | undefined; desatualizado: boolean }> = ({
  telemetria,
  desatualizado,
}) => {
  const item = previsoesDoMotor(telemetria?.escovas)[0];
  if (!item) return null;
  return (
    <p
      className="num display flex items-center gap-3 text-[clamp(26px,3vw,40px)] leading-tight"
      style={{ color: SEVERIDADE_THEME[item.severidade].color, opacity: desatualizado ? 0.6 : 1 }}
    >
      <Clock className="h-[0.9em] w-[0.9em] shrink-0" aria-hidden="true" />
      {fraseCurtaPrevisao(item.numeroEscova, item.previsao)}
    </p>
  );
};

const CartaoMotor: React.FC<{ linha: LinhaFrota & { motor: MotorResponse }; agora: number }> = ({ linha, agora }) => {
  const { principal } = linha.resumo;
  const desatualizado = estaDesatualizado(linha.resumo.dado);
  const barra = principal === 'Critico' || principal === 'AlertaPreditivo' ? COR_BARRA[principal] : null;
  return (
    <li
      className="relative space-y-4 overflow-hidden rounded-[var(--radius-panel)] border border-line bg-panel p-6 pl-7"
      style={{
        background:
          principal === 'Critico'
            ? 'color-mix(in srgb, var(--color-sev-critico) 8%, var(--color-panel))'
            : undefined,
      }}
    >
      {barra && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: barra, opacity: desatualizado ? 0.6 : 1 }}
        />
      )}
      <div>
        <h2 className="display text-[30px] leading-tight">{linha.motor.nome}</h2>
        <p className="text-[16px] text-ink-3">{linha.motor.tipo}</p>
      </div>
      <EstadoGrande linha={linha} agora={agora} />
      <PrevisaoGrande telemetria={linha.telemetria} desatualizado={desatualizado} />
      <Temperaturas motor={linha.motor} telemetria={linha.telemetria} desatualizado={desatualizado} />
    </li>
  );
};

/** Um único motor: anel coletor grande e, abaixo, a tendência da sessão. */
const MotorUnico: React.FC<{ linha: LinhaFrota & { motor: MotorResponse }; agora: number }> = ({ linha, agora }) => {
  const { motor, telemetria } = linha;
  const [escovaAtiva, setEscovaAtiva] = useState<number | null>(null);
  const limites = useLimitesTermicos(motor.id);
  const desatualizado = estaDesatualizado(linha.resumo.dado);
  const sensores = [...motor.sensores].sort((a, b) => a.numeroEscova - b.numeroEscova);
  const anel = dadosDoAnel(sensores.map((s) => s.numeroEscova), telemetria);
  const escovas = telemetria?.escovas;
  const series = useMemo(
    () =>
      Object.entries(escovas ?? {})
        .map(([numero, serie]) => ({ numeroEscova: Number(numero), pontos: serie.pontos }))
        .sort((a, b) => a.numeroEscova - b.numeroEscova),
    [escovas]
  );

  return (
    <div className="space-y-8">
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(320px,560px)_minmax(0,1fr)]">
        <div className="rounded-[var(--radius-panel)] border border-line bg-panel px-6 py-6">
          <CollectorRing
            escovas={anel.escovas}
            desatualizado={desatualizado}
            maiorTemperatura={anel.maiorTemperatura}
            assimetria={anel.assimetria}
            selecionada={escovaAtiva}
            onSelecionar={setEscovaAtiva}
            ampliado
          />
        </div>
        <div className="space-y-6">
          <div>
            <h2 className="display text-[36px] leading-tight">{motor.nome}</h2>
            <p className="text-[18px] text-ink-3">{motor.tipo}</p>
          </div>
          <EstadoGrande linha={linha} agora={agora} />
          <PrevisaoGrande telemetria={telemetria} desatualizado={desatualizado} />
          <Temperaturas motor={motor} telemetria={telemetria} desatualizado={desatualizado} />
        </div>
      </section>
      <TrendChart
        series={series}
        limites={limites}
        agora={agora}
        destacada={escovaAtiva}
        onDestacar={setEscovaAtiva}
      />
    </div>
  );
};

/**
 * `?modo=tv`: só a visão geral, em tamanho de projetor, sem navegação. As
 * idades se atualizam sozinhas (relógio global). Esc ou o botão discreto saem.
 */
export const ModoApresentacao: React.FC = () => {
  const { motores, carregando, erro } = useMonitoramento();
  const telemetria = useTelemetriaMotores();
  const agora = useAgora();
  const hub = useConexaoHub();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Voltar ao mesmo endereço sem a busca (`?modo=tv`).
  const sair = useCallback(() => navigate(pathname, { replace: true }), [navigate, pathname]);

  useEffect(() => {
    const aoTeclar = (event: KeyboardEvent) => {
      if (event.key === 'Escape') sair();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [sair]);

  const linhas = useMemo(
    () =>
      motores
        .map((motor) => ({ motor, telemetria: telemetria[motor.id], resumo: resumirMotor(telemetria[motor.id], agora) }))
        .sort(
          (a, b) =>
            compararPorUrgencia(a.resumo.principal, b.resumo.principal) ||
            a.motor.nome.localeCompare(b.motor.nome, 'pt-BR')
        ),
    [motores, telemetria, agora]
  );
  const titulo = tituloDaFrota(linhas, erro);
  const subtitulo = subtituloDaFrota(linhas, agora);
  const hora = new Date(agora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const conectado = hub === 'conectado';

  return (
    <div className="flex min-h-screen flex-col px-6 pb-12 pt-5 sm:px-10">
      <header className="flex items-center gap-4">
        <img
          src={harrierEmblem}
          alt=""
          width={46}
          height={33}
          className="harrier-emblema h-[33px] w-[46px] object-contain"
        />
        <span
          className="text-[14px] font-medium uppercase text-ink"
          style={{ fontStretch: '125%', letterSpacing: '0.34em' }}
        >
          Harrier
        </span>
        <div className="ml-auto flex items-center gap-5 text-[15px] text-ink-2">
          <span role="status" className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ background: conectado ? 'var(--color-flare)' : 'var(--color-sev-atencao)' }}
            />
            <span className={conectado ? '' : 'text-sev-atencao'}>
              {conectado ? 'Hub conectado' : hub === 'desconectado' ? 'Sem conexão' : 'Reconectando…'}
            </span>
          </span>
          <span className="num hidden sm:inline">{hora}</span>
          <button
            type="button"
            onClick={sair}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] px-2.5 text-[13px] text-ink-3 transition-colors hover:bg-raised hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Sair <span className="hidden sm:inline">(Esc)</span>
          </button>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="mx-auto mt-10 w-full max-w-[1600px] flex-1 space-y-10 outline-none">
        <div>
          <p className="eyebrow">Estado do sistema</p>
          <h1 className="display mt-2 text-[clamp(36px,5.4vw,72px)] leading-[1.05]">{titulo}</h1>
          {subtitulo && <p className="num mt-3 max-w-4xl text-[clamp(16px,1.7vw,24px)] text-ink-2">{subtitulo}</p>}
        </div>

        {carregando && motores.length === 0 ? (
          <LoadingState label="Carregando motores" />
        ) : linhas.length === 1 ? (
          <MotorUnico linha={linhas[0]} agora={agora} />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {linhas.map((linha) => (
              <CartaoMotor key={linha.motor.id} linha={linha} agora={agora} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};
