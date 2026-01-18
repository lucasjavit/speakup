import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { adminService } from '@/services';
import type { DashboardStats } from '@/types';
import styles from './Dashboard.module.css';

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard stats');
      console.error(err);
    } finally {
      setLoading(false);
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
