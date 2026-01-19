import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCallStore } from '@/stores/callStore';
import { useWebSocket } from '@/hooks';
import { Button, Card } from '@/components/ui';
import { sessionService } from '@/services/sessionService';
import { conversationService } from '@/services';
import type { Session, UserStats, MatchFoundPayload } from '@/types';
import styles from './Home.module.css';

export function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { joinQueue: joinQueueStore, startCall } = useCallStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // WebSocket connection
  const { isConnected, joinQueue } = useWebSocket({
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
      setIsJoining(false);
      // On error, fallback to lobby
      navigate('/lobby');
    },
    autoConnect: true,
  });

  // Load data for authenticated users
  useEffect(() => {
    if (isAuthenticated && user?.profileCompleted) {
      setIsLoading(true);
      Promise.all([
        conversationService.getUserStats(),
        sessionService.getActiveSessions(),
      ])
        .then(([statsData, sessionsData]) => {
          setStats(statsData);
          const running = sessionsData?.find((s: Session) => s.currentlyRunning);
          setActiveSession(running || null);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated, user]);

  const handleFindPartner = () => {
    if (!activeSession || !isConnected) {
      // Fallback to lobby if not connected
      navigate('/lobby');
      return;
    }

    setIsJoining(true);
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

  const formatTime = (time: string): string => {
    // Convert "08:00:00" to "8:00 AM"
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatCallDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>SpeakUp</h1>
        <p className={styles.subtitle}>
          Practice languages with real people through video conversations
        </p>
        {!isAuthenticated && (
          <div className={styles.actions}>
            <Button size="lg" onClick={() => (window.location.href = '/login')}>
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        )}
      </section>

      {isAuthenticated && user && (
        <section className={styles.dashboard}>
          <Card header={<h2>Welcome back, {user.name}!</h2>}>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats?.totalConversations || 0}</span>
                <span className={styles.statLabel}>Total Calls</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {stats ? formatDuration(stats.totalDurationSeconds) : '0m'}
                </span>
                <span className={styles.statLabel}>Total Time</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {stats?.averageDurationSeconds
                    ? `${Math.round(stats.averageDurationSeconds / 60)}m`
                    : '0m'}
                </span>
                <span className={styles.statLabel}>Avg Duration</span>
              </div>
            </div>
            {!user.profileCompleted && (
              <div className={styles.alert}>
                <p>Complete your profile to start practicing!</p>
                <Button
                  size="sm"
                  onClick={() => navigate('/complete-profile')}
                >
                  Complete Profile
                </Button>
              </div>
            )}
          </Card>

          <Card header={<h2>Practice Now</h2>}>
            {isLoading ? (
              <p className={styles.noSession}>Loading sessions...</p>
            ) : activeSession ? (
              <div className={styles.sessionCard}>
                <div className={styles.sessionRow}>
                  <div className={styles.sessionDetails}>
                    <div className={styles.sessionDetail}>
                      <svg className={styles.detailIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12,6 12,12 16,14" />
                      </svg>
                      <span>{formatTime(activeSession.startTime)} - {formatTime(activeSession.endTime)}</span>
                    </div>
                    <div className={styles.sessionDetail}>
                      <svg className={styles.detailIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>1-on-1 Video Call</span>
                    </div>
                    <div className={styles.sessionDetail}>
                      <svg className={styles.detailIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>{formatCallDuration(activeSession.callDurationSeconds || 600)} per conversation</span>
                    </div>
                  </div>
                  <div className={styles.sessionBadgeWrapper}>
                    <span className={styles.sessionBadge}>Live Now</span>
                  </div>
                </div>
                <Button
                  fullWidth
                  disabled={!user.profileCompleted || isJoining}
                  onClick={handleFindPartner}
                >
                  {isJoining ? 'Connecting...' : 'Find a Partner'}
                </Button>
              </div>
            ) : (
              <div className={styles.noSessionCard}>
                <div className={styles.noSessionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                </div>
                <p className={styles.noSessionText}>No session is currently running</p>
                <p className={styles.noSessionHint}>Check back during scheduled session times</p>
              </div>
            )}
          </Card>
        </section>
      )}
    </div>
  );
}
