import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { MotorResponse } from '../types/motor';
import { motorService } from '../services/motorService';
import { MotorQualityRulesSection } from '../components/MotorQualityRulesSection';
import { BrushCard } from '../components/BrushCard';
import { MotorAsymmetryCard } from '../components/MotorAsymmetryCard';
import { DiagnosticosPanel } from '../components/DiagnosticosPanel';
import { DispositivoMotor } from '../components/DispositivoMotor';
import { MotivoMotor } from '../components/MotivoMotor';
import { escolherMac, lerMacDoMotor } from '../helpers/macMotor';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { Menu } from '../../../components/ui/Menu';
import { Tabs } from '../../../components/ui/Tabs';
import { idDaAba, idDoPainel } from '../../../components/ui/tabsIds';
import { ApiErrorState } from '../../../components/ui/ApiErrorState';
import { useMonitoramento } from '../../../hooks/useMonitoramento';
import { ehNaoEncontrado, obterMensagemErro } from '../../../utils/errorHelper';
import { useMotorTelemetria } from '../../telemetria/hooks/useTelemetriaStore';
import { useLimitesTermicos } from '../hooks/useLimitesTermicos';
import { useRegrasQualidadeMotor } from '../hooks/useRegrasQualidadeMotor';
import { useAssinarMotor } from '../../telemetria/hooks/useAssinarMotor';
import { useAgora } from '../../telemetria/hooks/useAgora';
import { resumirMotor } from '../../telemetria/helpers/resumoMotor';
import { agruparDiagnosticos } from '../../telemetria/helpers/diagnosticos';
import { TIPO_ASSIMETRIA } from '../../quality-gates/helpers/tiposRegra';
import { SeverityBadge } from '../../telemetria/components/SeverityBadge';
import { FreshnessIndicator } from '../../telemetria/components/FreshnessIndicator';
import { TrendChart } from '../../telemetria/components/TrendChart';

type AbaMotor = 'monitoramento' | 'regras' | 'dispositivo';
const ABAS: Array<{ id: AbaMotor; rotulo: string; contagem?: number }> = [
  { id: 'monitoramento', rotulo: 'Monitoramento' },
  { id: 'regras', rotulo: 'Regras' },
  { id: 'dispositivo', rotulo: 'Dispositivo' },
];

function abaDaRota(segmento: string | undefined): AbaMotor | null {
  if (segmento === undefined) return 'monitoramento';
  return segmento === 'regras' || segmento === 'dispositivo' ? segmento : null;
}

export const DetalhesMotor: React.FC = () => {
  const { id, aba: segmentoAba } = useParams<{ id: string; aba?: string }>();
  const navigate = useNavigate();
  const { deletarMotor } = useMonitoramento();
  const [motor, setMotor] = useState<MotorResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<{ mensagem: string; naoEncontrado: boolean } | null>(
    null
  );
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroOperacao, setErroOperacao] = useState<string | null>(null);
  const motorId = id ? Number(id) : null;
  const telemetria = useMotorTelemetria(motorId ?? -1);
  const agora = useAgora();
  const resumo = resumirMotor(telemetria, agora);
  useAssinarMotor(motorId);
  const limites = useLimitesTermicos(motorId ?? -1);
  const regrasMotor = useRegrasQualidadeMotor(motorId ?? -1);
  const aba = abaDaRota(segmentoAba);

  const carregar = useCallback(() => {
    if (motorId === null) return;
    setCarregando(true);
    setErroCarga(null);
    motorService
      .obterPorId(motorId)
      .then((data) => setMotor(data))
      .catch((err: unknown) => {
        setMotor(null);
        setErroCarga({
          mensagem: obterMensagemErro(err, 'Não foi possível carregar o motor.'),
          naoEncontrado: ehNaoEncontrado(err),
        });
      })
      .finally(() => setCarregando(false));
  }, [motorId]);

  useEffect(() => {
    // A troca de motor exige sincronização com a API.
    // oxlint-disable-next-line react/set-state-in-effect
    carregar();
  }, [carregar]);

  const escovas = telemetria?.escovas;
  const series = useMemo(
    () =>
      Object.entries(escovas ?? {})
        .map(([numero, serie]) => ({ numeroEscova: Number(numero), pontos: serie.pontos }))
        .sort((a, b) => a.numeroEscova - b.numeroEscova),
    [escovas]
  );
  const grupos = useMemo(
    () =>
      agruparDiagnosticos(
        Object.values(escovas ?? {})
          .map((serie) => serie.ultima)
          .filter((leitura): leitura is NonNullable<typeof leitura> => leitura !== null)
      ),
    [escovas]
  );

  const handleExcluir = async () => {
    if (!motor) return;
    setExcluindo(true);
    try {
      await deletarMotor(motor.id);
      navigate('/');
    } catch (error) {
      setConfirmandoExclusao(false);
      setErroOperacao(obterMensagemErro(error, 'Não foi possível excluir o motor.'));
    } finally {
      setExcluindo(false);
    }
  };

  if (aba === null && motorId !== null) return <Navigate to={`/motores/${motorId}`} replace />;
  if (carregando) return <LoadingState label="Carregando motor" rows={2} />;
  if (erroCarga && !erroCarga.naoEncontrado) {
    return (
      <ApiErrorState
        title="Não foi possível carregar o motor"
        message={erroCarga.mensagem}
        onRetry={carregar}
        action={
          <Link to="/">
            <Button variant="ghost">Voltar aos motores</Button>
          </Link>
        }
      />
    );
  }
  if (!motor)
    return (
      <EmptyState
        title="Motor não encontrado"
        description="Ele pode ter sido excluído ou o endereço está incorreto."
        action={
          <Link to="/">
            <Button variant="secondary">Voltar aos motores</Button>
          </Link>
        }
      />
    );

  const sensores = [...motor.sensores].sort((a, b) => a.numeroEscova - b.numeroEscova);
  const mac = escolherMac(telemetria, lerMacDoMotor(motor.id));
  const abaAtiva: AbaMotor = aba ?? 'monitoramento';
  const desatualizado = resumo.dado === 'atrasado' || resumo.dado === 'offline';
  const grupoAssimetria = grupos.find((g) => g.tipoRegra === TIPO_ASSIMETRIA);

  // A contagem só aparece com os vínculos carregados: zero falso seria pior que nenhum número.
  const abas = ABAS.map((a) =>
    a.id === 'regras' && !regrasMotor.carregando && !regrasMotor.erro
      ? { ...a, contagem: regrasMotor.vinculos.length }
      : a
  );

  const irParaAba = (proxima: string) =>
    navigate(proxima === 'monitoramento' ? `/motores/${motor.id}` : `/motores/${motor.id}/${proxima}`);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <Link
          to="/"
          className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 text-[13px] text-ink-2 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Motores
        </Link>

        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="display text-[28px] leading-tight sm:text-[34px]">{motor.nome}</h1>
            <p className="mt-1 text-[15px] text-ink-2">
              {motor.tipo}
              <span aria-hidden="true" className="px-1.5 text-ink-3">
                ·
              </span>
              {plural(sensores.length, 'escova', 'escovas')}
              {mac && (
                <>
                  <span aria-hidden="true" className="px-1.5 text-ink-3">
                    ·
                  </span>
                  <span className="whitespace-nowrap">
                    ESP <span className="font-mono text-[13px]">{mac}</span>
                  </span>
                </>
              )}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <SeverityBadge estado={resumo.principal} tingido esmaecido={desatualizado} />
              <FreshnessIndicator dado={resumo.dado} ultimoLoteEm={resumo.ultimoLoteEm} agora={agora} />
            </div>
          </div>
          <Menu
            label="Mais ações"
            items={[
              {
                label: 'Excluir motor',
                tone: 'danger',
                icon: <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />,
                onSelect: () => setConfirmandoExclusao(true),
              },
            ]}
          />
        </header>

        {erroOperacao && <Alert tone="error" title="Não foi possível concluir" message={erroOperacao} />}
        {telemetria?.erro && (
          <Alert
            tone="warning"
            title="Não foi possível atualizar o status do motor"
            message={telemetria.erro}
          />
        )}

        <MotivoMotor
          motorId={motor.id}
          nome={motor.nome}
          resumo={resumo}
          telemetria={telemetria}
          grupos={grupos}
          escovasCadastradas={sensores.map((s) => s.numeroEscova)}
          mac={mac}
          agora={agora}
        />
      </div>

      <Tabs
        label="Seções do motor"
        prefixo="motor"
        valor={abaAtiva}
        onChange={irParaAba}
        itens={abas}
      />

      <div
        role="tabpanel"
        id={idDoPainel('motor', abaAtiva)}
        aria-labelledby={idDaAba('motor', abaAtiva)}
        tabIndex={0}
        className="space-y-10 outline-offset-8"
      >
        {abaAtiva === 'monitoramento' && (
          <>
            {sensores.length === 0 ? (
              <EmptyState
                title="Nenhuma escova vinculada"
                description="Cadastre um sensor para ver as temperaturas."
              />
            ) : (
              <section aria-labelledby="escovas" className="space-y-4">
                <h2 id="escovas" className="sr-only">
                  Escovas
                </h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                  {sensores.map((sensor) => (
                    <BrushCard
                      key={sensor.id}
                      numeroEscova={sensor.numeroEscova}
                      modelo={sensor.modelo}
                      serie={escovas?.[sensor.numeroEscova]}
                      dado={resumo.dado}
                      agora={agora}
                      limites={limites}
                    />
                  ))}
                  {sensores.length > 1 && (
                    <MotorAsymmetryCard escovas={escovas} grupo={grupoAssimetria} dado={resumo.dado} />
                  )}
                </div>
              </section>
            )}

            <TrendChart series={series} limites={limites} agora={agora} />

            <DiagnosticosPanel
              motorId={motor.id}
              grupos={grupos}
              temLeitura={series.some((s) => s.pontos.length > 0)}
              dado={resumo.dado}
            />
          </>
        )}

        {abaAtiva === 'regras' && <MotorQualityRulesSection motorId={motor.id} controle={regrasMotor} escovas={escovas} />}

        {abaAtiva === 'dispositivo' && <DispositivoMotor motor={motor} telemetria={telemetria} mac={mac} />}
      </div>

      <ConfirmDialog
        open={confirmandoExclusao}
        title={`Excluir ${motor.nome}?`}
        description="O motor, suas escovas e os vínculos com regras serão removidos. Não dá para desfazer."
        confirmLabel="Excluir motor"
        busy={excluindo}
        onCancel={() => setConfirmandoExclusao(false)}
        onConfirm={handleExcluir}
      />
    </div>
  );
};

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}
