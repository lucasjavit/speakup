import type { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore, isAdmin, canManageSessions, canManageUsers, canManagePayments } from '@/stores/authStore';
import { Button } from '@/components/ui';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();

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
            SpeakUp Admin
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
          <Link to="/" className={styles.backLink}>
            Back to App
          </Link>
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
              />
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userRole}>{user.role.replace('_', ' ')}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
