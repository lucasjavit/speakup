import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallStore } from '@/stores/callStore';
import { useWebSocket } from '@/hooks';
import type { MatchFoundPayload } from '@/types';
import styles from './Break.module.css';

interface BreakState {
  partnerName: string;
  topic: string;
  duration: number;
  sessionId: string;
  breakDurationSeconds: number;
}

const DEFAULT_BREAK_DURATION_SECONDS = 30;

export function Break() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as BreakState | null;
  const { joinQueue: joinQueueStore, startCall } = useCallStore();

  // Use breakDurationSeconds from state, fallback to default
  const breakDuration = state?.breakDurationSeconds || DEFAULT_BREAK_DURATION_SECONDS;

  const [countdown, setCountdown] = useState(breakDuration);
  const [canContinue, setCanContinue] = useState(breakDuration === 0);
  const [error, setError] = useState<string | null>(null);

  // WebSocket for rejoining queue
  const { joinQueue, isConnected, connect } = useWebSocket({
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
      navigate('/queue', { state: { position: payload.position } });
    },
    onError: (payload) => {
      console.error('Queue error:', payload.message);
      setError(payload.message || 'Failed to join queue. Please try again.');
    },
    autoConnect: true,
  });

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanContinue(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanContinue(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleContinue = () => {
    if (!canContinue) return;

    if (state?.sessionId && isConnected) {
      joinQueueStore(state.sessionId);
      joinQueue(state.sessionId);
      navigate('/queue');
    } else {
      navigate('/lobby');
    }
  };

  const handleExit = () => {
    navigate('/lobby');
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <div className={styles.checkIcon}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </div>
        </div>

        <h1 className={styles.title}>Great conversation!</h1>

        {state && (
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Partner</span>
              <span className={styles.summaryValue}>{state.partnerName}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Topic</span>
              <span className={styles.summaryValue}>{state.topic}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Duration</span>
              <span className={styles.summaryValue}>{formatDuration(state.duration)}</span>
            </div>
          </div>
        )}

        <div className={styles.timerSection}>
          {countdown > 0 ? (
            <>
              <div className={styles.timerCircle}>
                <span className={styles.timerNumber}>{countdown}</span>
              </div>
              <p className={styles.timerText}>Take a short break...</p>
            </>
          ) : (
            <p className={styles.readyText}>Ready for another conversation?</p>
          )}
        </div>

        {!isConnected && (
          <div className={styles.reconnect}>
            <p>Connection lost</p>
            <button onClick={connect} className={styles.reconnectButton}>
              Reconnect
            </button>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={() => setError(null)} className={styles.dismissButton}>
              Dismiss
            </button>
          </div>
        )}

        <div className={styles.actions}>
          <button
            onClick={handleContinue}
            disabled={!canContinue || !isConnected}
            className={styles.continueButton}
          >
            {canContinue ? 'Find New Partner' : `Wait ${countdown}s`}
          </button>
          <button onClick={handleExit} className={styles.exitButton}>
            Exit to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
