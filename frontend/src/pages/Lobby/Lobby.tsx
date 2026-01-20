import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCallStore } from '@/stores/callStore';
import { useActiveCallCheck } from '@/hooks';
import { conversationService, creditService } from '@/services';
import { sessionService } from '@/services/sessionService';
import { BackButton, QueueModal } from '@/components/ui';
import { CreditBalance, InsufficientCreditsModal } from '@/components/credits';
import type { UserStats, Session } from '@/types';
import styles from './Lobby.module.css';

export function Lobby() {
  const { user: _user } = useAuthStore();
  const { joinQueue: joinQueueStore } = useCallStore();

  // Check for active conversation on page load (e.g., after refresh)
  const { isChecking: isCheckingActiveCall } = useActiveCallCheck();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [isCheckingCredits, setIsCheckingCredits] = useState(false);

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

  const handleJoinSession = async () => {
    if (!activeSession) return;

    try {
      setIsCheckingCredits(true);
      const canJoin = await creditService.canJoinSession();
      if (!canJoin) {
        setShowInsufficientCredits(true);
        return;
      }
      joinQueueStore(activeSession.id);
      setIsQueueOpen(true);
    } catch (err) {
      console.error('Error checking credits:', err);
      setShowInsufficientCredits(true);
    } finally {
      setIsCheckingCredits(false);
    }
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
      <div className={styles.topBar}>
        <BackButton to="/" label="Home" className={styles.backButton} />
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Credits Section */}
      <section className={styles.creditsSection}>
        <CreditBalance />
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          <h2>Your Statistics</h2>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2a9 9 0 0 0-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z"/>
              </svg>
            </div>
            <span className={styles.statValue}>{stats?.totalConversations || 0}</span>
            <span className={styles.statLabel}>Total Calls</span>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </div>
            <span className={styles.statValue}>
              {stats ? formatDuration(stats.totalDurationSeconds) : '0m'}
            </span>
            <span className={styles.statLabel}>Total Time</span>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
            </div>
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
        <div className={styles.sectionHeader}>
          <div className={styles.sessionSectionIcon}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2>Practice Session</h2>
        </div>

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
              disabled={isCheckingCredits}
            >
              {isCheckingCredits ? 'Checking...' : 'Join Session'}
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

      {activeSession && (
        <QueueModal
          isOpen={isQueueOpen}
          sessionId={activeSession.id}
          onClose={() => setIsQueueOpen(false)}
        />
      )}

      <InsufficientCreditsModal
        isOpen={showInsufficientCredits}
        onClose={() => setShowInsufficientCredits(false)}
      />
    </div>
  );
}
