import * as signalR from '@microsoft/signalr';
import {
  LeituraEscova,
  MotorStatusDto,
  TelemetriaRealtimeDto,
} from '@/features/telemetria/types/telemetria';
import {
  normalizarLeituraRealtime,
  normalizarStatus,
} from '@/features/telemetria/helpers/normalizacao';
import { logDev } from '@/utils/devLog';

export type StatusConexaoHub =
  | 'conectado'
  | 'conectando'
  | 'reconectando'
  | 'desconectado';

type CallbackLote = (leituras: LeituraEscova[]) => void;
type CallbackStatusMotor = (status: MotorStatusDto) => void;
type CallbackStatus = (status: StatusConexaoHub) => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private callbacksLote: Set<CallbackLote> = new Set();
  private callbacksStatusMotor: Set<CallbackStatusMotor> = new Set();
  private callbacksStatus: Set<CallbackStatus> = new Set();
  private statusAtual: StatusConexaoHub = 'desconectado';

  private notificarStatus(novoStatus: StatusConexaoHub) {
    this.statusAtual = novoStatus;
    logDev(`[SignalR Status]: ${novoStatus.toUpperCase()}`);
    this.callbacksStatus.forEach((cb) => cb(novoStatus));
  }

  public obterStatus(): StatusConexaoHub {
    return this.statusAtual;
  }

  public iniciar() {
    if (this.connection) {
      if (
        this.connection.state === signalR.HubConnectionState.Disconnected
      ) {
        // Sem este aviso, o store não recarrega os motores ao voltar a conexão.
        this.notificarStatus('conectando');
        this.connection
          .start()
          .then(() => this.notificarStatus('conectado'))
          .catch((err) => {
            console.error('[SignalR] Erro ao reiniciar:', err);
            this.notificarStatus('desconectado');
          });
      }
      return;
    }

    this.notificarStatus('conectando');

    // Conecta via proxy relativo /api/telemetriaHub com negociação automática (WebSockets + SSE + LongPolling)
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('/api/telemetriaHub')
      .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
      .configureLogging(import.meta.env.DEV ? signalR.LogLevel.Information : signalR.LogLevel.Warning)
      .build();

    // Única fonte de amostras: um lote por motor, com todas as escovas.
    this.connection.on(
      'ReceberLoteTelemetria',
      (leituras: TelemetriaRealtimeDto[]) => {
        const normalizadas = (leituras ?? []).map(normalizarLeituraRealtime);
        this.callbacksLote.forEach((cb) => cb(normalizadas));
      }
    );

    // Mantido só por compatibilidade com o contrato: não conta como amostra.
    this.connection.on('ReceberTelemetria', () => undefined);

    this.connection.on('ReceberStatusMotor', (status: MotorStatusDto) => {
      const normalizado = normalizarStatus(status);
      this.callbacksStatusMotor.forEach((cb) => cb(normalizado));
    });

    // Ciclo de vida da conexão
    this.connection.onreconnecting((error) => {
      console.warn('[SignalR] Conexão oscilando. Tentando reconectar...', error);
      this.notificarStatus('reconectando');
    });

    this.connection.onreconnected((connectionId) => {
      logDev('[SignalR] Conexão restabelecida! ID:', connectionId);
      this.notificarStatus('conectado');
    });

    this.connection.onclose((error) => {
      console.warn('[SignalR] Conexão fechada:', error);
      this.notificarStatus('desconectado');
    });

    this.connection
      .start()
      .then(() => {
        logDev('[SignalR] Conexão com TelemetriaHub estabelecida com sucesso!');
        this.notificarStatus('conectado');
      })
      .catch((err) => {
        console.error('[SignalR] Falha ao iniciar conexão:', err);
        this.notificarStatus('desconectado');
      });
  }

  public parar() {
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
      this.notificarStatus('desconectado');
    }
  }

  public onLoteTelemetria(callback: CallbackLote): () => void {
    this.callbacksLote.add(callback);
    return () => this.callbacksLote.delete(callback);
  }

  public onStatusMotor(callback: CallbackStatusMotor): () => void {
    this.callbacksStatusMotor.add(callback);
    return () => this.callbacksStatusMotor.delete(callback);
  }

  public onStatusMudou(callback: CallbackStatus): () => void {
    this.callbacksStatus.add(callback);
    callback(this.statusAtual);
    return () => this.callbacksStatus.delete(callback);
  }

  public async assinarMotor(motorId: number): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('AssinarMotor', motorId);
    }
  }

  public async desassinarMotor(motorId: number): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('DesassinarMotor', motorId);
    }
  }
}

export const signalRService = new SignalRService();
