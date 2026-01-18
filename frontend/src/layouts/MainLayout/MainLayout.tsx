import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isAuthenticated, logout } = useAuthStore();

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
                <Link to="/session" className={styles.navLink}>
                  Sessions
                </Link>
                <div className={styles.userMenu}>
                  <img
                    src={user?.avatarUrl || '/default-avatar.png'}
                    alt={user?.name}
                    className={styles.avatar}
                  />
                  <span className={styles.userName}>{user?.name}</span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Logout
                  </Button>
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
