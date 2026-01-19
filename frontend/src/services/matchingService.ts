import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import type {
  QueueStatusResponse,
  JoinQueueRequest,
  WebSocketMessage,
  ClientMessage,
  MatchFoundPayload,
  QueuePositionPayload,
  ErrorPayload,
  WaitingReconnectionPayload,
} from '@/types';

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionHandler = () => void;

class MatchingService {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectHandlers: Set<ConnectionHandler> = new Set();
  private disconnectHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  // Connect to WebSocket
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = useAuthStore.getState().token;
    if (!token) {
      console.error('No auth token available for WebSocket connection');
      return;
    }

    const wsUrl = this.getWebSocketUrl(token);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startPing();
      this.connectHandlers.forEach(handler => handler());
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('WebSocket message received:', message.type);
        this.messageHandlers.forEach(handler => handler(message));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.stopPing();
      this.disconnectHandlers.forEach(handler => handler());

      // Attempt reconnection if not intentionally closed
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  // Disconnect from WebSocket
  disconnect(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  // Send a message through WebSocket
  send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  // Join the matching queue
  joinQueue(sessionId: string): void {
    this.send({
      type: 'JOIN_QUEUE',
      payload: { sessionId },
    });
  }

  // Leave the matching queue
  leaveQueue(): void {
    this.send({ type: 'LEAVE_QUEUE' });
  }

  // Notify that call ended
  notifyCallEnded(conversationId: string, reason: 'TIMER' | 'USER_LEFT' | 'ERROR'): void {
    this.send({
      type: 'CALL_ENDED',
      payload: { conversationId, reason },
    });
  }

  // Rejoin an active call (after disconnect/reconnect)
  rejoinCall(conversationId: string): void {
    this.send({
      type: 'REJOIN_CALL',
      payload: { conversationId },
    });
  }

  // Subscribe to messages
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  // Subscribe to connection events
  onConnect(handler: ConnectionHandler): () => void {
    this.connectHandlers.add(handler);
    return () => this.connectHandlers.delete(handler);
  }

  // Subscribe to disconnection events
  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.add(handler);
    return () => this.disconnectHandlers.delete(handler);
  }

  // Check if connected
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // REST API methods (alternative to WebSocket)
  async joinQueueRest(request: JoinQueueRequest): Promise<QueueStatusResponse> {
    const response = await api.post<QueueStatusResponse>('/matching/join', request);
    return response.data;
  }

  async leaveQueueRest(): Promise<void> {
    await api.delete('/matching/leave');
  }

  async getQueueStatus(): Promise<QueueStatusResponse> {
    const response = await api.get<QueueStatusResponse>('/matching/status');
    return response.data;
  }

  private getWebSocketUrl(token: string): string {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Try to get host from VITE_WS_URL or VITE_API_BASE_URL
    const wsUrl = import.meta.env.VITE_WS_URL;
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    let host = window.location.host;

    if (wsUrl) {
      // Direct WebSocket URL provided
      return `${wsUrl}/ws/matching?token=${token}`;
    }

    if (apiUrl) {
      try {
        // Try parsing as absolute URL
        const url = new URL(apiUrl);
        host = url.host;
      } catch {
        // If it's a relative path like /api/v1, use current host
        // For development with proxy, use backend port
        if (import.meta.env.DEV) {
          host = 'localhost:8080';
        }
      }
    }

    return `${wsProtocol}//${host}/ws/matching?token=${token}`;
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.connect();
      }
    }, delay);
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'PING' });
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Export singleton instance
export const matchingService = new MatchingService();

// Helper to extract typed payloads
export function extractMatchFound(message: WebSocketMessage): MatchFoundPayload | null {
  if (message.type === 'MATCH_FOUND') {
    return message.payload as unknown as MatchFoundPayload;
  }
  return null;
}

export function extractQueuePosition(message: WebSocketMessage): QueuePositionPayload | null {
  if (message.type === 'QUEUE_POSITION' || message.type === 'QUEUE_JOINED') {
    return message.payload as unknown as QueuePositionPayload;
  }
  return null;
}

export function extractError(message: WebSocketMessage): ErrorPayload | null {
  if (message.type === 'ERROR') {
    return message.payload as unknown as ErrorPayload;
  }
  return null;
}

export function extractWaitingReconnection(message: WebSocketMessage): WaitingReconnectionPayload | null {
  if (message.type === 'WAITING_RECONNECTION') {
    return message.payload as unknown as WaitingReconnectionPayload;
  }
  return null;
}
