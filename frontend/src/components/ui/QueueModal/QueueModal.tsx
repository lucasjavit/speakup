import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useCallStore } from '@/stores/callStore';
import { useWebSocket } from '@/hooks';
import type { MatchFoundPayload } from '@/types';
import styles from './QueueModal.module.css';

export interface QueueModalProps {
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
}

export function QueueModal({ isOpen, sessionId, onClose }: QueueModalProps) {
  const navigate = useNavigate();
  const { queuePosition, leaveQueue: leaveQueueStore, startCall } = useCallStore();

  const { leaveQueue, isConnected, connect, joinQueue } = useWebSocket({
    onMatchFound: (payload: MatchFoundPayload) => {
      startCall({
        conversationId: payload.conversationId,
        peerId: payload.peerId,
        partnerName: payload.partnerName,
        partnerAvatar: payload.partnerAvatar || null,
        partnerCountry: payload.partnerCountry || null,
        topic: payload.topic,
        isInitiator: payload.isInitiator,
        startedAt: null,
        sessionId: payload.sessionId,
        callDurationSeconds: payload.callDurationSeconds || 600,
        breakDurationSeconds: payload.breakDurationSeconds || 30,
      });
      navigate('/call');
    },
    onQueueUpdate: (payload) => {
      useCallStore.getState().updateQueuePosition(payload.position);
    },
    onQueueLeft: () => {
      leaveQueueStore();
      onClose();
    },
    onError: (payload) => {
      console.error('Queue error:', payload.message);
      leaveQueueStore();
      onClose();
    },
    autoConnect: true,
  });

  // Join queue when modal opens
  useEffect(() => {
    if (isOpen && sessionId && isConnected) {
      joinQueue(sessionId);
    }
  }, [isOpen, sessionId, isConnected, joinQueue]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleLeave();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleLeave = () => {
    leaveQueue();
    leaveQueueStore();
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-modal-title"
      >
        <div className={styles.content}>
          <div className={styles.spinner}>
            <div className={styles.spinnerRing}></div>
          </div>

          <h2 id="queue-modal-title" className={styles.title}>
            Looking for a partner...
          </h2>

          <div className={styles.info}>
            {queuePosition > 0 && (
              <p className={styles.position}>
                Position in queue: <strong>{queuePosition}</strong>
              </p>
            )}
            <p className={styles.hint}>
              We're matching you with someone at your level
            </p>
          </div>

          {!isConnected && (
            <div className={styles.reconnect}>
              <p>Connection lost</p>
              <button onClick={connect} className={styles.reconnectButton}>
                Reconnect
              </button>
            </div>
          )}

          <button onClick={handleLeave} className={styles.leaveButton}>
            Leave Queue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
