import { create } from 'zustand';
import type { CallInfo, CallState } from '@/types';

interface CallStoreState {
  // Call state
  callState: CallState;
  callInfo: CallInfo | null;

  // Queue state
  isInQueue: boolean;
  queuePosition: number;
  queueSessionId: string | null;

  // Reconnection state
  isWaitingReconnection: boolean;
  reconnectionTimeoutSeconds: number;
  disconnectedPartnerName: string | null;

  // Actions
  setCallState: (state: CallState) => void;
  setCallInfo: (info: CallInfo | null) => void;
  startCall: (info: CallInfo) => void;
  endCall: () => void;

  // Queue actions
  joinQueue: (sessionId: string) => void;
  updateQueuePosition: (position: number) => void;
  leaveQueue: () => void;

  // Reconnection actions
  setWaitingReconnection: (waiting: boolean, partnerName?: string, timeoutSeconds?: number) => void;
  clearReconnectionState: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  callState: 'idle' as CallState,
  callInfo: null,
  isInQueue: false,
  queuePosition: 0,
  queueSessionId: null,
  isWaitingReconnection: false,
  reconnectionTimeoutSeconds: 0,
  disconnectedPartnerName: null,
};

export const useCallStore = create<CallStoreState>((set) => ({
  ...initialState,

  setCallState: (callState) => set({ callState }),

  setCallInfo: (callInfo) => set({ callInfo }),

  startCall: (info) => set({
    callState: 'connecting',
    callInfo: info,
    isInQueue: false,
    queuePosition: 0,
    queueSessionId: null,
  }),

  endCall: () => set({
    callState: 'ended',
    callInfo: null,
  }),

  joinQueue: (sessionId) => set({
    isInQueue: true,
    queuePosition: 0,
    queueSessionId: sessionId,
  }),

  updateQueuePosition: (position) => set({
    queuePosition: position,
  }),

  leaveQueue: () => set({
    isInQueue: false,
    queuePosition: 0,
    queueSessionId: null,
  }),

  setWaitingReconnection: (waiting, partnerName, timeoutSeconds) => set({
    isWaitingReconnection: waiting,
    disconnectedPartnerName: partnerName || null,
    reconnectionTimeoutSeconds: timeoutSeconds || 0,
  }),

  clearReconnectionState: () => set({
    isWaitingReconnection: false,
    reconnectionTimeoutSeconds: 0,
    disconnectedPartnerName: null,
  }),

  reset: () => set(initialState),
}));
