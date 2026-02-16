import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, isAdmin } from '@/stores/authStore';
import { creditService, presenceService, userService } from '@/services';
import { transcriptService } from '@/services/transcriptService';
import { Button } from '@/components/ui';
import { FeedbackButton } from '@/components/FeedbackButton';
import styles from './MainLayout.module.css';

const PRESENCE_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isFreeModeEnabled, setIsFreeModeEnabled] = useState<boolean | null>(null);
  const [isSettingsPageEnabled, setIsSettingsPageEnabled] = useState(false);
  const [isTranscriptFeatureEnabled, setIsTranscriptFeatureEnabled] = useState(true);
  const [isFeedbackFeatureEnabled, setIsFeedbackFeatureEnabled] = useState(true);
  
  // Don't show feedback button on admin pages
  const showFeedbackButton = isAuthenticated && isFeedbackFeatureEnabled && !location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isAuthenticated) {
      creditService.isFreeModeEnabled()
        .then(setIsFreeModeEnabled)
        .catch(console.error);
      userService.isSettingsPageEnabled()
        .then(setIsSettingsPageEnabled)
        .catch(console.error);
      transcriptService.isFeatureEnabled()
        .then(setIsTranscriptFeatureEnabled)
        .catch(console.error);
      userService.isFeedbackFeatureEnabled()
        .then(setIsFeedbackFeatureEnabled)
        .catch(console.error);
    }
  }, [isAuthenticated]);

  // Heartbeat for "usuários logados" count in admin dashboard
  useEffect(() => {
    if (!isAuthenticated) return;
    presenceService.touch().catch(() => {});
    const id = setInterval(() => {
      presenceService.touch().catch(() => {});
    }, PRESENCE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <span>SpeakYou</span>
            <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              <circle cx="9" cy="10" r="1.5"/>
              <circle cx="12" cy="10" r="1.5"/>
              <circle cx="15" cy="10" r="1.5"/>
            </svg>
          </Link>

          <nav className={styles.nav}>
            {isAuthenticated ? (
              <>
                {isTranscriptFeatureEnabled && (
                  <Link to="/conversations" className={styles.navLink}>
                    Transcripts
                  </Link>
                )}
                {isFeedbackFeatureEnabled && (
                  <Link to="/feedback" className={styles.navLink}>
                    Feedback
                  </Link>
                )}
                {isFreeModeEnabled === false && (
                  <Link to="/credits" className={styles.navLink}>
                    Credits
                  </Link>
                )}
                {isAdmin(user?.role) && (
                  <Link to="/admin" className={styles.navLink}>
                    Admin
                  </Link>
                )}
                <div className={styles.userMenu}>
                  {isSettingsPageEnabled && <Link to="/settings" className={styles.settingsButton} title="Settings">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </Link>}
                  <img
                    src={user?.avatarUrl || '/default-avatar.png'}
                    alt={user?.name}
                    className={styles.avatar}
                    onClick={() => navigate('/complete-profile')}
                    title={user?.name || 'Edit profile'}
                  />
                  <button
                    className={styles.logoutButton}
                    onClick={async () => {
                      await logout();
                      navigate('/login');
                    }}
                    title="Logout"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} SpeakYou. All rights reserved.</p>
      </footer>

      {showFeedbackButton && <FeedbackButton />}
    </div>
  );
}
