import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { MotorResponse } from '../types/motor';
import { motorService } from '../services/motorService';
import { MotorQualityRulesSection } from '../components/MotorQualityRulesSection';
import { EscovaItem } from '../components/EscovaItem';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { Menu } from '../../../components/ui/Menu';
import { Panel } from '../../../components/ui/Panel';
import { useMonitoramento } from '../../../hooks/useMonitoramento';
import { obterMensagemErro } from '../../../utils/errorHelper';

export const DetalhesMotor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deletarMotor, motoresComStatus } = useMonitoramento();
  const [motor, setMotor] = useState<MotorResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroOperacao, setErroOperacao] = useState<string | null>(null);
  const motorMonitorado = motor ? motoresComStatus.find((item) => item.id === motor.id) : undefined;

  useEffect(() => {
    if (!id) return;
    // oxlint-disable-next-line react/set-state-in-effect
    setCarregando(true);
    motorService
      .obterPorId(Number(id))
      .then((data) => setMotor(data))
      .catch((err) => {
        console.error(err);
        setMotor(null);
      })
      .finally(() => setCarregando(false));
  }, [id]);

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

  if (carregando) return <LoadingState label="Carregando motor" rows={2} />;
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

  return (
    <div className="space-y-12">
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
            <p className="mt-1 text-[15px] text-ink-2">{motor.tipo}</p>
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
      </div>

      <section className="space-y-4" aria-labelledby="escovas">
        <h2 id="escovas" className="display text-base">
          Escovas<span className="num ml-2 text-ink-3">{sensores.length}</span>
        </h2>
        {sensores.length === 0 ? (
          <EmptyState title="Nenhuma escova vinculada" description="Cadastre um sensor para ver as temperaturas." />
        ) : (
          <Panel>
            {sensores.map((sensor) => (
              <EscovaItem
                key={sensor.id}
                sensor={
                  motorMonitorado?.sensores.find((item) => item.id === sensor.id) ?? {
                    ...sensor,
                    status: 'offline',
                  }
                }
              />
            ))}
          </Panel>
        )}
      </section>

      <MotorQualityRulesSection motorId={motor.id} />

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
