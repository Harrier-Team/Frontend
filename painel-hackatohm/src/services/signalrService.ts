import * as signalR from '@microsoft/signalr';
import { TelemetriaRealtimeDto } from '../types/telemetria';

export type StatusConexaoHub =
  | 'conectado'
  | 'conectando'
  | 'reconectando'
  | 'desconectado';

type CallbackLote = (leituras: TelemetriaRealtimeDto[]) => void;
type CallbackIndividual = (leitura: TelemetriaRealtimeDto) => void;
type CallbackStatus = (status: StatusConexaoHub) => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private callbacksLote: Set<CallbackLote> = new Set();
  private callbacksIndividual: Set<CallbackIndividual> = new Set();
  private callbacksStatus: Set<CallbackStatus> = new Set();
  private statusAtual: StatusConexaoHub = 'desconectado';

  private notificarStatus(novoStatus: StatusConexaoHub) {
    this.statusAtual = novoStatus;
    console.info(`[SignalR Status]: ${novoStatus.toUpperCase()}`);
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
        this.connection.start().catch((err) => {
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
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Eventos enviados pelo backend via ITelemetriaClient
    this.connection.on(
      'ReceberLoteTelemetria',
      (leituras: TelemetriaRealtimeDto[]) => {
        console.info('[SignalR Live Push] Lote de leituras recebido:', leituras);
        this.callbacksLote.forEach((cb) => cb(leituras));
      }
    );

    this.connection.on(
      'ReceberTelemetria',
      (leitura: TelemetriaRealtimeDto) => {
        console.info('[SignalR Live Push] Leitura individual recebida:', leitura);
        this.callbacksIndividual.forEach((cb) => cb(leitura));
      }
    );

    // Ciclo de vida da conexão
    this.connection.onreconnecting((error) => {
      console.warn('[SignalR] Conexão oscilando. Tentando reconectar...', error);
      this.notificarStatus('reconectando');
    });

    this.connection.onreconnected((connectionId) => {
      console.info('[SignalR] Conexão restabelecida! ID:', connectionId);
      this.notificarStatus('conectado');
    });

    this.connection.onclose((error) => {
      console.warn('[SignalR] Conexão fechada:', error);
      this.notificarStatus('desconectado');
    });

    this.connection
      .start()
      .then(() => {
        console.info('[SignalR] Conexão com TelemetriaHub estabelecida com sucesso!');
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

  public onTelemetria(callback: CallbackIndividual): () => void {
    this.callbacksIndividual.add(callback);
    return () => this.callbacksIndividual.delete(callback);
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
