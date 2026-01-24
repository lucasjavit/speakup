import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCallStore } from '@/stores/callStore';
import { Button, Card, QueueModal, Tooltip } from '@/components/ui';
import { InsufficientCreditsModal } from '@/components/credits';
import { creditService } from '@/services';
import { sessionService } from '@/services/sessionService';
import { conversationService } from '@/services';
import type { Session, UserStats, CreditWallet } from '@/types';
import styles from './Home.module.css';

export function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { joinQueue: joinQueueStore } = useCallStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [isFreeModeEnabled, setIsFreeModeEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [isCheckingCredits, setIsCheckingCredits] = useState(false);

  // Load data for authenticated users
  useEffect(() => {
    if (isAuthenticated && user?.profileCompleted) {
      setIsLoading(true);
      Promise.all([
        conversationService.getUserStats(),
        sessionService.getActiveSessions(),
        creditService.getWallet(),
        creditService.isFreeModeEnabled(),
      ])
        .then(([statsData, sessionsData, walletData, freeMode]) => {
          setStats(statsData);
          setSessions(sessionsData || []);
          const running = sessionsData?.find((s: Session) => s.currentlyRunning);
          setActiveSession(running || null);
          setWallet(walletData);
          setIsFreeModeEnabled(freeMode);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated, user]);

  const handleFindPartner = async () => {
    if (!activeSession) {
      return;
    }

    // Check if user has credits before joining queue
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
      // Show insufficient credits modal on error to be safe
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

  const formatProficiencyLevel = (level: string): string => {
    const levelMap: Record<string, string> = {
      'BEGINNER': 'A1 - Beginner',
      'ELEMENTARY': 'A2 - Elementary',
      'INTERMEDIATE': 'B1 - Intermediate',
      'UPPER_INTERMEDIATE': 'B2 - Upper Intermediate',
      'ADVANCED': 'C1 - Advanced',
      'FLUENT': 'C2 - Fluent',
    };
    return levelMap[level] || level;
  };

  return (
    <div className={styles.container}>
      {!isAuthenticated && (
        <section className={styles.hero}>
          <h1 className={styles.title}>SpeakUp</h1>
          <p className={styles.subtitle}>
            Practice languages with real people through video conversations
          </p>
          <div className={styles.actions}>
            <Button size="lg" onClick={() => (window.location.href = '/login')}>
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </section>
      )}

      {isAuthenticated && user && (
        <section className={styles.dashboard}>
          {/* Stats Card - Full Width at Top */}
          <Card header={<div></div>} className={styles.statsCard}>
            <div className={styles.statsHeaderContainer}>
              <h2 className={styles.statsHeader}>
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.statsHeaderIcon}>
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
                Your Statistics
              </h2>
              {user.evaluatedLevel && (
                <div className={styles.statsHeaderLevel}>
                  <Tooltip
                    content={
                      <div className={styles.levelTooltip}>
                        <strong>Your Evaluated Level</strong>
                        <p>Based on {user.totalEvaluations || 0} evaluation{(user.totalEvaluations || 0) !== 1 ? 's' : ''} from conversation partners</p>
                        <small>Click to view your full profile</small>
                      </div>
                    }
                    position="bottom"
                  >
                    <button
                      className={styles.levelBadge}
                      onClick={() => navigate('/complete-profile')}
                    >
                      {formatProficiencyLevel(user.evaluatedLevel)}
                    </button>
                  </Tooltip>
                </div>
              )}
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
                <span className={styles.statLabel}>Total Practice Time</span>
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
                <span className={styles.statLabel}>Average Call Duration</span>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                  </svg>
                </div>
                <span className={styles.statValue}>{stats?.conversationsThisWeek || 0}</span>
                <span className={styles.statLabel}>This Week</span>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                  </svg>
                </div>
                <span className={styles.statValue}>{stats?.conversationsThisMonth || 0}</span>
                <span className={styles.statLabel}>This Month</span>
              </div>
            </div>
          </Card>

          {/* Schedule and Practice Now Side by Side */}
          <div className={styles.practiceRow}>
            {/* Session Schedule - Left */}
            <Card header={
              <h2 className={styles.statsHeader}>
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.statsHeaderIcon}>
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                </svg>
                Session Schedule
              </h2>
            } className={styles.scheduleCard}>
              {sessions.length === 0 ? (
                <p className={styles.noSessions}>No sessions scheduled</p>
              ) : (
                <ul className={styles.sessionList}>
                  {sessions.map((session) => (
                    <li key={session.id} className={styles.sessionItem}>
                      <div className={styles.sessionInfo}>
                        <span className={session.currentlyRunning ? styles.sessionLive : styles.sessionScheduled}>
                          {session.currentlyRunning ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" className={styles.statusIcon}>
                              <circle cx="12" cy="12" r="8" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.statusIcon}>
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12,6 12,12 16,14" />
                            </svg>
                          )}
                        </span>
                        <div className={styles.sessionText}>
                          <span className={styles.sessionName}>{session.name}</span>
                          <span className={styles.sessionTime}>
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                          </span>
                        </div>
                      </div>
                      {session.currentlyRunning && (
                        <span className={styles.liveBadge}>Live</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Practice Now - Right */}
            <Card header={
              <div className={styles.practiceHeader}>
                <h2 className={styles.statsHeader}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className={styles.statsHeaderIcon}>
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                  Practice Now
                </h2>
                {!isFreeModeEnabled && (
                  <div className={styles.practiceCredits}>
                    <Tooltip content="Conversations available" position="top">
                      <div
                        className={styles.creditsBadge}
                        onClick={() => navigate('/credits')}
                        style={{ cursor: 'pointer' }}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className={styles.creditsIcon}>
                          <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                        </svg>
                        <span>{wallet?.conversationCredits || 0}</span>
                      </div>
                    </Tooltip>
                    <Tooltip content="Buy more conversations" position="top">
                      <button
                        className={styles.buyMoreButton}
                        onClick={() => navigate('/credits/buy')}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className={styles.buyMoreIcon}>
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                        </svg>
                        Buy
                      </button>
                    </Tooltip>
                  </div>
                )}
              </div>
            } className={styles.practiceCard}>
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
                  <button
                    className={styles.findPartnerButton}
                    disabled={!user.profileCompleted || isCheckingCredits}
                    onClick={handleFindPartner}
                  >
                    {isCheckingCredits ? 'Checking...' : 'Find a Partner'}
                  </button>
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
          </div>
        </section>
      )}

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
