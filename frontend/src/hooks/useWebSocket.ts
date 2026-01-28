import { useEffect, useCallback, useState, useRef } from 'react';
import { matchingService, extractMatchFound, extractQueuePosition, extractError, extractWaitingReconnection } from '@/services/matchingService';
import type { WebSocketMessage, MatchFoundPayload, QueuePositionPayload, ErrorPayload, WaitingReconnectionPayload } from '@/types';

interface UseWebSocketReturn {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinQueue: (sessionId: string) => void;
  leaveQueue: () => void;
  notifyCallEnded: (conversationId: string, reason: 'TIMER' | 'USER_LEFT' | 'ERROR') => void;
  rejoinCall: (conversationId: string) => void;
}

interface UseWebSocketOptions {
  onMatchFound?: (payload: MatchFoundPayload) => void;
  onQueueUpdate?: (payload: QueuePositionPayload) => void;
  onQueueLeft?: () => void;
  onPartnerDisconnected?: () => void;
  onPartnerReconnected?: () => void;
  onWaitingReconnection?: (payload: WaitingReconnectionPayload) => void;
  onReconnectionTimeout?: () => void;
  onCallEndedWithError?: () => void;
  onMatchCancelled?: (reason: string) => void;
  onError?: (payload: ErrorPayload) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);

  // Use refs to store callbacks to avoid effect re-runs
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  // Track if already connected to avoid duplicate connections
  const connectedRef = useRef(false);

  // Setup effect - runs once on mount
  useEffect(() => {
    const handleMessage = (message: WebSocketMessage) => {
      const {
        onMatchFound,
        onQueueUpdate,
        onQueueLeft,
        onPartnerDisconnected,
        onPartnerReconnected,
        onWaitingReconnection,
        onReconnectionTimeout,
        onCallEndedWithError,
        onMatchCancelled,
        onError,
      } = callbacksRef.current;

      switch (message.type) {
        case 'MATCH_FOUND': {
          const payload = extractMatchFound(message);
          if (payload && onMatchFound) {
            onMatchFound(payload);
          }
          break;
        }
        case 'QUEUE_JOINED':
        case 'QUEUE_POSITION': {
          const payload = extractQueuePosition(message);
          if (payload && onQueueUpdate) {
            onQueueUpdate(payload);
          }
          break;
        }
        case 'QUEUE_LEFT':
          onQueueLeft?.();
          break;
        case 'PARTNER_DISCONNECTED':
          onPartnerDisconnected?.();
          break;
        case 'PARTNER_RECONNECTED':
          onPartnerReconnected?.();
          break;
        case 'WAITING_RECONNECTION': {
          const payload = extractWaitingReconnection(message);
          if (payload && onWaitingReconnection) {
            onWaitingReconnection(payload);
          }
          break;
        }
        case 'RECONNECTION_TIMEOUT':
          onReconnectionTimeout?.();
          break;
        case 'CALL_ENDED_ERROR':
          onCallEndedWithError?.();
          break;
        case 'MATCH_CANCELLED': {
          const reason = message.payload?.reason as string;
          onMatchCancelled?.(reason || 'Unknown reason');
          break;
        }
        case 'ERROR': {
          const payload = extractError(message);
          if (payload && onError) {
            onError(payload);
          }
          break;
        }
      }
    };

    const unsubMessage = matchingService.onMessage(handleMessage);

    const unsubConnect = matchingService.onConnect(() => {
      setIsConnected(true);
      callbacksRef.current.onConnect?.();
    });

    const unsubDisconnect = matchingService.onDisconnect(() => {
      setIsConnected(false);
      callbacksRef.current.onDisconnect?.();
    });

    // Auto connect if enabled and not already connected
    if (callbacksRef.current.autoConnect && !connectedRef.current) {
      connectedRef.current = true;
      matchingService.connect();
    }

    // Set initial state
    setIsConnected(matchingService.isConnected());

    return () => {
      unsubMessage();
      unsubConnect();
      unsubDisconnect();
    };
  }, []); // Empty deps - only run once

  const connect = useCallback(() => {
    matchingService.connect();
  }, []);

  const disconnect = useCallback(() => {
    matchingService.disconnect();
  }, []);

  const joinQueue = useCallback((sessionId: string) => {
    matchingService.joinQueue(sessionId);
  }, []);

  const leaveQueue = useCallback(() => {
    matchingService.leaveQueue();
  }, []);

  const notifyCallEnded = useCallback((conversationId: string, reason: 'TIMER' | 'USER_LEFT' | 'ERROR') => {
    matchingService.notifyCallEnded(conversationId, reason);
  }, []);

  const rejoinCall = useCallback((conversationId: string) => {
    matchingService.rejoinCall(conversationId);
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    joinQueue,
    leaveQueue,
    notifyCallEnded,
    rejoinCall,
  };
}
