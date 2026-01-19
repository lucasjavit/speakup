// Queue and matching types

export interface QueueStatusResponse {
  inQueue: boolean;
  sessionId: string | null;
  position: number;
  estimatedWaitSeconds: number;
  queueSize: number;
}

export interface JoinQueueRequest {
  sessionId: string;
}

// WebSocket message types
export type WebSocketMessageType =
  | 'CONNECTED'
  | 'QUEUE_JOINED'
  | 'QUEUE_LEFT'
  | 'QUEUE_POSITION'
  | 'MATCH_FOUND'
  | 'MATCH_CANCELLED'
  | 'PARTNER_DISCONNECTED'
  | 'PARTNER_RECONNECTED'
  | 'WAITING_RECONNECTION'
  | 'RECONNECTION_TIMEOUT'
  | 'ERROR'
  | 'PONG';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: Record<string, unknown>;
}

export interface ConnectedPayload {
  peerId: string;
}

export interface QueueJoinedPayload {
  position: number;
  estimatedWait: number;
}

export interface QueuePositionPayload {
  position: number;
  estimatedWait: number;
}

export interface MatchFoundPayload {
  conversationId: string;
  peerId: string;
  partnerName: string;
  partnerAvatar: string;
  topic: string;
  isInitiator: boolean;
  sessionId: string;
  callDurationSeconds: number;
  breakDurationSeconds: number;
}

export interface MatchCancelledPayload {
  reason: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export interface WaitingReconnectionPayload {
  partnerName: string;
  timeoutSeconds: number;
}

export interface ReconnectionTimeoutPayload {
  reason: string;
}

// Client to server message types
export type ClientMessageType =
  | 'JOIN_QUEUE'
  | 'LEAVE_QUEUE'
  | 'CALL_ENDED'
  | 'REJOIN_CALL'
  | 'PING';

export interface ClientMessage {
  type: ClientMessageType;
  payload?: Record<string, unknown>;
}

export interface JoinQueueMessage extends ClientMessage {
  type: 'JOIN_QUEUE';
  payload: {
    sessionId: string;
  };
}

export interface LeaveQueueMessage extends ClientMessage {
  type: 'LEAVE_QUEUE';
}

export interface CallEndedMessage extends ClientMessage {
  type: 'CALL_ENDED';
  payload: {
    conversationId: string;
    reason: 'TIMER' | 'USER_LEFT' | 'ERROR';
  };
}

export interface PingMessage extends ClientMessage {
  type: 'PING';
}

export interface RejoinCallMessage extends ClientMessage {
  type: 'REJOIN_CALL';
  payload: {
    conversationId: string;
  };
}
