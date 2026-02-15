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
  const [notifyOnEmptyQueue, setNotifyOnEmptyQueue] = useState(false);
  const [isTogglingNotify, setIsTogglingNotify] = useState(false);
  const [settingsPageEnabled, setSettingsPageEnabled] = useState(false);
  const [isTogglingSettingsPage, setIsTogglingSettingsPage] = useState(false);
  const [transcriptLimit, setTranscriptLimit] = useState('2');
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, freeModeData, notifyData, settingsPageData, limitData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getFreeModeStatus(),
        adminService.getNotifyOnEmptyQueue(),
        adminService.getSettingsPageEnabled(),
        adminService.getTranscriptDailyLimit(),
      ]);
      setStats(statsData);
      setFreeMode(freeModeData);
      setNotifyOnEmptyQueue(notifyData.enabled);
      setSettingsPageEnabled(settingsPageData.enabled);
      setTranscriptLimit(limitData.value.toString());
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

  const handleToggleNotify = async () => {
    try {
      setIsTogglingNotify(true);
      const result = await adminService.updateNotifyOnEmptyQueue(!notifyOnEmptyQueue);
      setNotifyOnEmptyQueue(result.enabled);
    } catch (err) {
      console.error('Failed to toggle notify on empty queue:', err);
      setError('Failed to update notification setting');
    } finally {
      setIsTogglingNotify(false);
    }
  };

  const handleToggleSettingsPage = async () => {
    try {
      setIsTogglingSettingsPage(true);
      const result = await adminService.updateSettingsPageEnabled(!settingsPageEnabled);
      setSettingsPageEnabled(result.enabled);
    } catch (err) {
      console.error('Failed to toggle settings page:', err);
      setError('Failed to update settings page');
    } finally {
      setIsTogglingSettingsPage(false);
    }
  };

  const handleUpdateTranscriptLimit = async () => {
    const limitValue = parseInt(transcriptLimit);
    if (isNaN(limitValue) || limitValue < 0) {
      setError('Invalid limit value');
      return;
    }

    try {
      setIsUpdatingLimit(true);
      setError('');
      await adminService.updateTranscriptDailyLimit(limitValue);
      setError('');
    } catch (err) {
      console.error('Failed to update transcript limit:', err);
      setError('Failed to update transcript limit');
    } finally {
      setIsUpdatingLimit(false);
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

      {/* Notify on Empty Queue Card */}
      <Card className={styles.notifyCard}>
        <div className={styles.freeModeHeader}>
          <div className={styles.freeModeInfo}>
            <h3 className={styles.notifyTitle}>
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.freeModeIcon}>
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              Notificar Fila Vazia
            </h3>
            <p className={styles.freeModeDescription}>
              Quando ativado, envia um email para todos os usuários quando alguém entra na fila e não há ninguém online. Cooldown de 30 minutos entre envios.
            </p>
          </div>
          <button
            className={`${styles.freeModeToggle} ${notifyOnEmptyQueue ? styles.enabled : styles.disabled}`}
            onClick={handleToggleNotify}
            disabled={isTogglingNotify}
          >
            <span className={styles.toggleTrack}>
              <span className={styles.toggleThumb} />
            </span>
            <span className={styles.toggleLabel}>
              {isTogglingNotify ? 'Atualizando...' : notifyOnEmptyQueue ? 'Ativado' : 'Desativado'}
            </span>
          </button>
        </div>
        {notifyOnEmptyQueue && (
          <div className={styles.notifyActive}>
            <span className={styles.notifyActiveBadge}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="8" />
              </svg>
              Notificação por email está ativa
            </span>
          </div>
        )}
      </Card>

      {/* Settings Page Toggle Card */}
      <Card className={styles.settingsPageCard}>
        <div className={styles.freeModeHeader}>
          <div className={styles.freeModeInfo}>
            <h3 className={styles.settingsPageTitle}>
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.freeModeIcon}>
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
              Página de Settings
            </h3>
            <p className={styles.freeModeDescription}>
              Quando ativado, os usuários podem acessar a página de configurações para gerenciar suas API keys.
            </p>
          </div>
          <button
            className={`${styles.freeModeToggle} ${settingsPageEnabled ? styles.enabled : styles.disabled}`}
            onClick={handleToggleSettingsPage}
            disabled={isTogglingSettingsPage}
          >
            <span className={styles.toggleTrack}>
              <span className={styles.toggleThumb} />
            </span>
            <span className={styles.toggleLabel}>
              {isTogglingSettingsPage ? 'Atualizando...' : settingsPageEnabled ? 'Ativado' : 'Desativado'}
            </span>
          </button>
        </div>
        {settingsPageEnabled && (
          <div className={styles.settingsPageActive}>
            <span className={styles.settingsPageActiveBadge}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="8" />
              </svg>
              Página de settings está ativa
            </span>
          </div>
        )}
      </Card>

      {/* Transcript Daily Limit Card */}
      <Card className={styles.transcriptLimitCard}>
        <div className={styles.freeModeHeader}>
          <div className={styles.freeModeInfo}>
            <h3 className={styles.settingsPageTitle}>
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.freeModeIcon}>
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              Limite Diário de Transcrições
            </h3>
            <p className={styles.freeModeDescription}>
              Define quantas transcrições cada usuário pode solicitar por dia.
            </p>
          </div>
        </div>
        <div className={styles.transcriptLimitInput}>
          <label className={styles.limitLabel}>Transcrições por dia:</label>
          <input
            type="number"
            min="0"
            max="100"
            value={transcriptLimit}
            onChange={(e) => setTranscriptLimit(e.target.value)}
            className={styles.limitField}
          />
          <button
            onClick={handleUpdateTranscriptLimit}
            disabled={isUpdatingLimit}
            className={styles.limitButton}
          >
            {isUpdatingLimit ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
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
          <div className={styles.statLabel}>Users online</div>
          <div className={styles.statValue}>
            {stats?.onlineUsers != null && stats.onlineUsers > 1000
              ? '999+'
              : stats?.onlineUsers ?? 0}
          </div>
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
