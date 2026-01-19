import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCallStore } from '@/stores/callStore';
import { useWebSocket, useActiveCallCheck } from '@/hooks';
import { conversationService } from '@/services';
import { sessionService } from '@/services/sessionService';
import type { UserStats, Session, MatchFoundPayload } from '@/types';
import styles from './Lobby.module.css';

export function Lobby() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { joinQueue: joinQueueStore, startCall } = useCallStore();

  // Check for active conversation on page load (e.g., after refresh)
  const { isChecking: isCheckingActiveCall } = useActiveCallCheck();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket connection
  const { isConnected, connect, joinQueue } = useWebSocket({
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
      setError(payload.message);
    },
    autoConnect: true,
  });

  // Load user stats and sessions
  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, sessionsData] = await Promise.all([
          conversationService.getUserStats(),
          sessionService.getActiveSessions(),
        ]);

        setStats(statsData);
        setSessions(sessionsData || []);

        // Find currently running session
        const running = sessionsData?.find((s: Session) => s.currentlyRunning);
        setActiveSession(running || null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleJoinSession = () => {
    if (!activeSession || !isConnected) return;

    joinQueueStore(activeSession.id);
    joinQueue(activeSession.id);
    navigate('/queue');
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading || isCheckingActiveCall) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          {isCheckingActiveCall ? 'Checking for active call...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Welcome, {user?.name?.split(' ')[0]}!</h1>
        {!isConnected && (
          <button onClick={connect} className={styles.reconnectBtn}>
            Reconnect
          </button>
        )}
      </header>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <h2>Your Statistics</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats?.totalConversations || 0}</span>
            <span className={styles.statLabel}>Total Calls</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {stats ? formatDuration(stats.totalDurationSeconds) : '0m'}
            </span>
            <span className={styles.statLabel}>Total Time</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {stats?.averageDurationSeconds
                ? `${Math.round(stats.averageDurationSeconds / 60)}m`
                : '0m'}
            </span>
            <span className={styles.statLabel}>Avg Duration</span>
          </div>
        </div>
      </section>

      {/* Session Section */}
      <section className={styles.sessionSection}>
        <h2>Practice Session</h2>

        {activeSession ? (
          <div className={styles.activeSession}>
            <div className={styles.sessionInfo}>
              <h3>{activeSession.name}</h3>
              <p>
                {activeSession.startTime} - {activeSession.endTime}
              </p>
              <span className={styles.sessionBadge}>Now Running</span>
            </div>
            <button
              onClick={handleJoinSession}
              className={styles.joinButton}
              disabled={!isConnected}
            >
              {isConnected ? 'Join Session' : 'Connecting...'}
            </button>
          </div>
        ) : (
          <div className={styles.noSession}>
            <p>No session is currently running.</p>
            {sessions.length > 0 && (
              <div className={styles.upcomingSessions}>
                <h4>Upcoming Sessions</h4>
                <ul>
                  {sessions
                    .filter(s => s.status === 'ACTIVE')
                    .slice(0, 3)
                    .map(session => (
                      <li key={session.id}>
                        <strong>{session.name}</strong>
                        <span>
                          {session.startTime} - {session.endTime}
                        </span>
                        <span className={styles.sessionDays}>
                          {session.daysOfWeek.join(', ')}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Connection Status */}
      <div className={styles.connectionStatus}>
        <span className={isConnected ? styles.connected : styles.disconnected}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
}
