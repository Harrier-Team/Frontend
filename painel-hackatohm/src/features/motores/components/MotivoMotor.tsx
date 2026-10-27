import React from 'react';
import { Link } from 'react-router-dom';
import { MotorTelemetria } from '@/features/telemetria/store/tipos';
import { ResumoMotor } from '@/features/telemetria/helpers/resumoMotor';
import { TEMA_ESTADO } from '@/features/telemetria/helpers/apresentacao';
import {
  ehSeveridadeAnormal,
  estaDesatualizado,
  idadeEmSegundos,
  LIMITE_ATRASO_SEGUNDOS,
} from '@/features/telemetria/helpers/estadoHelper';
import {
  GrupoDiagnostico,
  resumirDiagnosticos,
} from '@/features/telemetria/helpers/diagnosticos';
import { descreverMotivo, motivoDoMotor } from '@/features/telemetria/helpers/linhaMotor';
import { formatarRelativo } from '@/features/telemetria/helpers/statusHelper';
import { SeveritySymbol } from '@/features/telemetria/components/SeveritySymbol';
import { CopyableCode } from '@/components/ui/CopyableCode';
import { obterTipoRegra } from '@/features/quality-gates/helpers/tiposRegra';

interface MotivoMotorProps {
  motorId: number;
  nome: string;
  resumo: ResumoMotor;
  telemetria: MotorTelemetria | undefined;
  grupos: GrupoDiagnostico[];
  /** Números das escovas cadastradas, para apontar as que estão sem dado. */
  escovasCadastradas: number[];
  mac: string | null;
  agora: number;
}

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

const Caixa: React.FC<{
  cor?: string;
  tingido?: boolean;
  children: React.ReactNode;
  rotulo: string;
}> = ({ cor, tingido, children, rotulo }) => (
  <section
    aria-label={rotulo}
    className="relative overflow-hidden rounded-[var(--radius-panel)] border border-line bg-panel px-5 py-4"
    style={{
      background: tingido && cor ? `color-mix(in srgb, ${cor} 8%, var(--color-panel))` : undefined,
    }}
  >
    {cor && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px]" style={{ background: cor }} />}
    {children}
  </section>
);

/**
 * Faixa de contexto do motor: por que está neste estado. Severidade e motivo
 * vêm do backend; aqui só se escolhe o texto de cada situação.
 */
export const MotivoMotor: React.FC<MotivoMotorProps> = ({
  motorId,
  nome,
  resumo,
  telemetria,
  grupos,
  escovasCadastradas,
  mac,
  agora,
}) => {
  const principal = resumo.principal;
  const tema = TEMA_ESTADO[principal];
  const desatualizado = estaDesatualizado(resumo.dado);
  const diag = resumirDiagnosticos(grupos);

  if (ehSeveridadeAnormal(resumo.severidade)) {
    const motivo = motivoDoMotor(telemetria, resumo.motivo);
    const regra = motivo ? obterTipoRegra(motivo.tipoRegra).rotulo : null;
    const alertasPreditivos = diag.alertas - diag.criticos;
    return (
      <Caixa rotulo="Motivo" cor={tema.color} tingido={principal === 'Critico'}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5">
            <SeveritySymbol estado={principal} size={18} esmaecido={desatualizado} />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] text-ink">
              {motivo?.mensagemDiagnostico ?? (motivo ? descreverMotivo(motivo, nome) : tema.label)}
            </p>
            <p className="num mt-1 text-[13px] text-ink-2">
              {regra && <>Regra: {regra} · </>}
              {plural(diag.criticos, 'crítico', 'críticos')} · {plural(alertasPreditivos, 'alerta', 'alertas')} ·{' '}
              {plural(diag.dentroDoLimite, 'normal', 'normais')}
            </p>
            {desatualizado && (
              <p className="mt-1 text-[13px] text-ink-3">
                Último lote {formatarRelativo(resumo.ultimoLoteEm, agora)}. Este diagnóstico está desatualizado: era{' '}
                {tema.label.toLowerCase()} e não há confirmação recente.
              </p>
            )}
          </div>
        </div>
      </Caixa>
    );
  }

  if (principal === 'sem-leitura') {
    return (
      <Caixa rotulo="Aguardando primeiro lote">
        <div className="flex items-start gap-3">
          <span className="mt-0.5">
            <SeveritySymbol estado="sem-leitura" size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] text-ink">Aguardando primeiro lote</p>
            <p className="mt-1 text-[13px] text-ink-2">
              O ESP ainda não enviou leituras deste motor. Ele deve enviar todas as escovas em cada lote, a cada ~10 s.
            </p>
            {mac ? (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
                MAC do ESP
                <CopyableCode texto={mac} rotulo="MAC do ESP" />
              </p>
            ) : (
              <p className="mt-2 text-[13px] text-ink-3">O MAC aparece aqui quando o primeiro lote chegar.</p>
            )}
          </div>
        </div>
      </Caixa>
    );
  }

  if (principal === 'offline') {
    return (
      <Caixa rotulo="Sem dados recentes">
        <div className="flex items-start gap-3">
          <span className="mt-0.5">
            <SeveritySymbol estado="offline" size={18} />
          </span>
          <div>
            <p className="text-[15px] text-ink">Sem dados recentes</p>
            <p className="mt-1 text-[13px] text-ink-2">
              Último lote {formatarRelativo(resumo.ultimoLoteEm, agora)}. Os valores abaixo são os últimos recebidos e
              estão desatualizados. Verifique a energia e o Wi-Fi do ESP.
            </p>
          </div>
        </div>
      </Caixa>
    );
  }

  if (principal === 'degradado') {
    const semDado = escovasCadastradas.filter((numero) => {
      const idade = idadeEmSegundos(telemetria?.escovas[numero]?.ultima?.dataHora, agora);
      return idade === null || idade > LIMITE_ATRASO_SEGUNDOS;
    });
    return (
      <Caixa rotulo="Dados incompletos">
        <div className="flex items-start gap-3">
          <span className="mt-0.5">
            <SeveritySymbol estado="degradado" size={18} />
          </span>
          <div>
            <p className="text-[15px] text-ink">Algumas escovas estão sem dado recente</p>
            <p className="mt-1 text-[13px] text-ink-2">
              {semDado.length > 0
                ? `Sem leitura recente: ${semDado.map((n) => `escova ${n}`).join(', ')}.`
                : 'O backend informa leituras incompletas neste motor.'}
            </p>
          </div>
        </div>
      </Caixa>
    );
  }

  if (principal === 'sem-regras') {
    return (
      <Caixa rotulo="Sem regras">
        <div className="flex items-start gap-3">
          <span className="mt-0.5">
            <SeveritySymbol estado="sem-regras" size={18} />
          </span>
          <div>
            <p className="text-[15px] text-ink">Sem regras: nada está sendo avaliado</p>
            <p className="mt-1 text-[13px] text-ink-2">
              As temperaturas chegam, mas sem regra vinculada o painel não consegue dizer se estão normais.{' '}
              <Link to={`/motores/${motorId}/regras`} className="text-ink underline underline-offset-2">
                Vincular regras
              </Link>
            </p>
          </div>
        </div>
      </Caixa>
    );
  }

  if (principal === 'aguardando-amostras') {
    return (
      <Caixa rotulo="Aguardando amostras">
        <div className="flex items-start gap-3">
          <span className="mt-0.5">
            <SeveritySymbol estado="aguardando-amostras" size={18} />
          </span>
          <div>
            <p className="text-[15px] text-ink">Aguardando amostras</p>
            <p className="mt-1 text-[13px] text-ink-2">
              As regras precisam de mais de uma leitura (ou de mais de uma escova) para serem avaliadas. Isto não
              significa que o motor está normal.
            </p>
          </div>
        </div>
      </Caixa>
    );
  }

  return (
    <Caixa rotulo="Situação">
      <div className="flex items-center gap-3">
        <SeveritySymbol estado="Normal" size={18} />
        <p className="text-[15px] text-ink-2">
          Todas as regras avaliadas estão dentro do limite
          {desatualizado ? ', mas o último lote está desatualizado' : ''}.
        </p>
      </div>
    </Caixa>
  );
};
