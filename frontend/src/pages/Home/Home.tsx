import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCallStore } from '@/stores/callStore';
import { Button, Card, QueueModal } from '@/components/ui';
import { sessionService } from '@/services/sessionService';
import { conversationService } from '@/services';
import type { Session, UserStats } from '@/types';
import styles from './Home.module.css';

export function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { joinQueue: joinQueueStore } = useCallStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

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
          setSessions(sessionsData || []);
          const running = sessionsData?.find((s: Session) => s.currentlyRunning);
          setActiveSession(running || null);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated, user]);

  const handleFindPartner = () => {
    if (!activeSession) {
      return;
    }

    joinQueueStore(activeSession.id);
    setIsQueueOpen(true);
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
          <Card header={<h2>Your Statistics</h2>} className={styles.statsCard}>
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

          {/* Schedule and Practice Now Side by Side */}
          <div className={styles.practiceRow}>
            {/* Session Schedule - Left */}
            <Card header={<h2>Session Schedule</h2>} className={styles.scheduleCard}>
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
            <Card header={<h2>Practice Now</h2>} className={styles.practiceCard}>
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
                    disabled={!user.profileCompleted}
                    onClick={handleFindPartner}
                  >
                    Find a Partner
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
    </div>
  );
}
