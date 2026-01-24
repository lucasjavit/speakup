import type { ReactNode } from 'react';
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore, isAdmin, canManageSessions, canManageUsers, canManagePayments } from '@/stores/authStore';
import { BackButton } from '@/components/ui';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || !user || !isAdmin(user.role)) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', show: true },
    { path: '/admin/sessions', label: 'Sessions', show: canManageSessions(user.role) },
    { path: '/admin/users', label: 'Users', show: canManageUsers(user.role) },
    { path: '/admin/payments', label: 'Payments', show: canManagePayments(user.role) },
  ].filter(item => item.show);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link to="/admin" className={styles.logo}>
            SpeakYou Admin
          </Link>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navLink} ${location.pathname === item.path ? styles.active : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <BackButton to="/" label="Back to Home" className={styles.backButton} />
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>
              {navItems.find(item => item.path === location.pathname)?.label || 'Admin'}
            </h1>

            <div className={styles.userMenu}>
              <img
                src={user.avatarUrl || '/default-avatar.png'}
                alt={user.name}
                className={styles.avatar}
                onClick={() => navigate('/complete-profile')}
                title="Edit profile"
              />
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userRole}>{user.role.replace('_', ' ')}</span>
              </div>
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
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
