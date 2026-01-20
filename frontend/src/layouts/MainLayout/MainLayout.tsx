import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, isAdmin } from '@/stores/authStore';
import { creditService } from '@/services';
import { Button } from '@/components/ui';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isFreeModeEnabled, setIsFreeModeEnabled] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      creditService.isFreeModeEnabled()
        .then(setIsFreeModeEnabled)
        .catch(console.error);
    }
  }, [isAuthenticated]);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            SpeakUp
          </Link>

          <nav className={styles.nav}>
            {isAuthenticated ? (
              <>
                <Link to="/" className={styles.navLink}>
                  Home
                </Link>
                {!isFreeModeEnabled && (
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
                  <img
                    src={user?.avatarUrl || '/default-avatar.png'}
                    alt={user?.name}
                    className={styles.avatar}
                    onClick={() => navigate('/complete-profile')}
                    title={user?.name || 'Edit profile'}
                  />
                  <button
                    className={styles.logoutButton}
                    onClick={() => {
                      logout();
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
        <p>&copy; {new Date().getFullYear()} SpeakUp. All rights reserved.</p>
      </footer>
    </div>
  );
}
