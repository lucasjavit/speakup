import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { adminService } from '@/services';
import type { DashboardStats, FreeModeStatus } from '@/types';
import styles from './Dashboard.module.css';

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [freeMode, setFreeMode] = useState<FreeModeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTogglingFreeMode, setIsTogglingFreeMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, freeModeData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getFreeModeStatus(),
      ]);
      setStats(statsData);
      setFreeMode(freeModeData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFreeMode = async () => {
    if (!freeMode) return;

    try {
      setIsTogglingFreeMode(true);
      const newStatus = await adminService.updateFreeMode(!freeMode.enabled, freeMode.message);
      setFreeMode(newStatus);
    } catch (err) {
      console.error('Failed to toggle free mode:', err);
      setError('Failed to update free mode');
    } finally {
      setIsTogglingFreeMode(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      {/* Free Mode Card */}
      <Card className={styles.freeModeCard}>
        <div className={styles.freeModeHeader}>
          <div className={styles.freeModeInfo}>
            <h3 className={styles.freeModeTitle}>
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.freeModeIcon}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Modo Gratuito
            </h3>
            <p className={styles.freeModeDescription}>
              Quando ativado, os usuários podem participar das sessões sem gastar créditos.
            </p>
          </div>
          <button
            className={`${styles.freeModeToggle} ${freeMode?.enabled ? styles.enabled : styles.disabled}`}
            onClick={handleToggleFreeMode}
            disabled={isTogglingFreeMode}
          >
            <span className={styles.toggleTrack}>
              <span className={styles.toggleThumb} />
            </span>
            <span className={styles.toggleLabel}>
              {isTogglingFreeMode ? 'Atualizando...' : freeMode?.enabled ? 'Ativado' : 'Desativado'}
            </span>
          </button>
        </div>
        {freeMode?.enabled && (
          <div className={styles.freeModeActive}>
            <span className={styles.freeModeActiveBadge}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="8" />
              </svg>
              Modo gratuito está ativo
            </span>
          </div>
        )}
      </Card>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statLabel}>Total Users</div>
          <div className={styles.statValue}>{stats?.totalUsers ?? 0}</div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statLabel}>Active Users</div>
          <div className={styles.statValue}>{stats?.activeUsers ?? 0}</div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statLabel}>Total Sessions</div>
          <div className={styles.statValue}>{stats?.totalSessions ?? 0}</div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statLabel}>Active Sessions</div>
          <div className={styles.statValue}>{stats?.activeSessions ?? 0}</div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statLabel}>Running Now</div>
          <div className={styles.statValue}>{stats?.currentlyRunningSessions ?? 0}</div>
        </Card>
      </div>
    </div>
  );
}
