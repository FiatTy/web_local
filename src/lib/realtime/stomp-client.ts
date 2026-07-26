import { Client, type IMessage, type IStompSocket, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAccessToken } from '@/lib/auth/token-store';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/backend';
const RECONNECT_DELAY = 5000;

type TopicHandler = (payload: unknown) => void;
type ConnectionListener = (connected: boolean) => void;

function parseBody(body: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

class RealtimeClient {
  private client: Client | null = null;
  private connected = false;
  private handlers = new Map<string, Set<TopicHandler>>();
  private subscriptions = new Map<string, StompSubscription>();
  private connectionListeners = new Set<ConnectionListener>();

  isConnected(): boolean {
    return this.connected;
  }

  activate(): void {
    if (this.client) {
      if (!this.client.active) {
        this.client.activate();
      }
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws`) as unknown as IStompSocket,
      reconnectDelay: RECONNECT_DELAY,
      beforeConnect: () => {
        const token = getAccessToken();
        if (!token) {
          void client.deactivate();
          return;
        }
        client.connectHeaders = { Authorization: `Bearer ${token}` };
      },
    });

    client.onConnect = () => {
      this.connected = true;
      this.subscriptions.clear();
      this.handlers.forEach((_handlers, topic) => this.openSubscription(topic));
      this.emitConnection(true);
    };

    client.onStompError = () => {
      this.subscriptions.clear();
    };

    client.onWebSocketClose = () => {
      this.connected = false;
      this.subscriptions.clear();
      this.emitConnection(false);
    };

    this.client = client;
    client.activate();
  }

  deactivate(): void {
    const client = this.client;
    this.client = null;
    this.connected = false;
    this.subscriptions.clear();
    this.handlers.clear();
    if (client) {
      void client.deactivate();
    }
    this.emitConnection(false);
  }

  subscribe(topic: string, handler: TopicHandler): () => void {
    let topicHandlers = this.handlers.get(topic);
    if (!topicHandlers) {
      topicHandlers = new Set();
      this.handlers.set(topic, topicHandlers);
    }
    topicHandlers.add(handler);

    if (this.connected) {
      this.openSubscription(topic);
    }

    return () => this.removeHandler(topic, handler);
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  private removeHandler(topic: string, handler: TopicHandler): void {
    const topicHandlers = this.handlers.get(topic);
    if (!topicHandlers) {
      return;
    }
    topicHandlers.delete(handler);
    if (topicHandlers.size > 0) {
      return;
    }
    this.handlers.delete(topic);
    this.subscriptions.get(topic)?.unsubscribe();
    this.subscriptions.delete(topic);
  }

  private openSubscription(topic: string): void {
    if (!this.client || this.subscriptions.has(topic)) {
      return;
    }
    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      const payload = parseBody(message.body);
      this.handlers.get(topic)?.forEach((handler) => handler(payload));
    });
    this.subscriptions.set(topic, subscription);
  }

  private emitConnection(connected: boolean): void {
    this.connectionListeners.forEach((listener) => listener(connected));
  }
}

export const realtimeClient = new RealtimeClient();
