import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallStore } from '@/stores/callStore';
import { useWebSocket } from '@/hooks';
import { BackButton } from '@/components/ui';
import type { MatchFoundPayload } from '@/types';
import styles from './Queue.module.css';

export function Queue() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isInQueue, queuePosition, leaveQueue: leaveQueueStore, startCall, callInfo } = useCallStore();

  const { leaveQueue, isConnected, connect } = useWebSocket({
    onMatchFound: (payload: MatchFoundPayload) => {
      startCall({
        conversationId: payload.conversationId,
        peerId: payload.peerId,
        partnerName: payload.partnerName,
        partnerAvatar: payload.partnerAvatar || null,
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
      navigate('/');
    },
    onError: (payload) => {
      console.error('Queue error:', payload.message);
      leaveQueueStore();
      navigate('/');
    },
    autoConnect: true,
  });

  // Get initial position from navigation state
  const initialPosition = (location.state as { position?: number })?.position || queuePosition;

  // Redirect if not in queue (only if not transitioning to a call)
  useEffect(() => {
    // Don't redirect if we have call info (transitioning to call)
    if (callInfo) {
      return;
    }
    if (!isInQueue && !location.state) {
      navigate('/');
    }
  }, [isInQueue, location.state, navigate, callInfo]);

  const handleLeave = () => {
    leaveQueue();
    leaveQueueStore();
    navigate('/');
  };

  const position = queuePosition || initialPosition;

  return (
    <div className={styles.container}>
      <BackButton to="/" label="Home" className={styles.backButton} />
      <div className={styles.content}>
        <div className={styles.spinner}>
          <div className={styles.spinnerRing}></div>
        </div>

        <h1 className={styles.title}>Looking for a partner...</h1>

        <div className={styles.info}>
          {position > 0 && (
            <p className={styles.position}>
              Position in queue: <strong>{position}</strong>
            </p>
          )}
          <p className={styles.hint}>
            We're matching you with someone at your level
          </p>
        </div>

        {!isConnected && (
          <div className={styles.reconnect}>
            <p>Connection lost</p>
            <button onClick={connect}>Reconnect</button>
          </div>
        )}

        <button onClick={handleLeave} className={styles.leaveButton}>
          Leave Queue
        </button>
      </div>
    </div>
  );
}
