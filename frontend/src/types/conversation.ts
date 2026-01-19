// Conversation types

export type ConversationStatus = 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface UserSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Conversation {
  id: string;
  userA: UserSummary;
  userB: UserSummary;
  sessionId: string | null;
  topic: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  status: ConversationStatus;
  hasRecordingA: boolean;
  hasRecordingB: boolean;
  createdAt: string;
}

export interface UserStats {
  totalConversations: number;
  totalDurationSeconds: number;
  totalDurationMinutes: number;
  averageDurationSeconds: number;
}

export interface EndConversationRequest {
  completed: boolean;
}

// Call state for the UI
export type CallState =
  | 'idle'           // Not in a call
  | 'connecting'     // WebRTC connecting
  | 'connected'      // In call
  | 'reconnecting'   // Trying to reconnect
  | 'ended';         // Call ended

export interface CallInfo {
  conversationId: string;
  peerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  topic: string;
  isInitiator: boolean;
  startedAt: Date | null;
  callDurationSeconds: number;
}
