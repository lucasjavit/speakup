import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tooltip } from '@/components/ui';
import { adminService } from '@/services';
import type { DashboardStats, FreeModeStatus } from '@/types';
import styles from './Dashboard.module.css';

export function AdminDashboard() {
  const navigate = useNavigate();
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
  const [transcriptFeatureEnabled, setTranscriptFeatureEnabled] = useState(true);
  const [isTogglingTranscriptFeature, setIsTogglingTranscriptFeature] = useState(false);
  const [feedbackFeatureEnabled, setFeedbackFeatureEnabled] = useState(true);
  const [isTogglingFeedbackFeature, setIsTogglingFeedbackFeature] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, freeModeData, notifyData, settingsPageData, limitData, transcriptFeatureData, feedbackFeatureData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getFreeModeStatus(),
        adminService.getNotifyOnEmptyQueueEnabled(),
        adminService.getSettingsPageEnabled(),
        adminService.getTranscriptDailyLimit(),
        adminService.getTranscriptFeatureEnabled(),
        adminService.getFeedbackFeatureEnabled(),
      ]);
      setStats(statsData);
      setFreeMode(freeModeData);
      setNotifyOnEmptyQueue(notifyData);
      setSettingsPageEnabled(settingsPageData);
      setTranscriptLimit(limitData.value.toString());
      setTranscriptFeatureEnabled(transcriptFeatureData);
      setFeedbackFeatureEnabled(feedbackFeatureData);
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
      const result = await adminService.updateNotifyOnEmptyQueueEnabled(!notifyOnEmptyQueue);
      setNotifyOnEmptyQueue(result);
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
      setSettingsPageEnabled(result);
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

  const handleToggleTranscriptFeature = async () => {
    try {
      setIsTogglingTranscriptFeature(true);
      const result = await adminService.updateTranscriptFeatureEnabled(!transcriptFeatureEnabled);
      setTranscriptFeatureEnabled(result);
    } catch (err) {
      console.error('Failed to toggle transcript feature:', err);
      setError('Failed to update transcript feature');
    } finally {
      setIsTogglingTranscriptFeature(false);
    }
  };

  const handleToggleFeedbackFeature = async () => {
    try {
      setIsTogglingFeedbackFeature(true);
      const result = await adminService.updateFeedbackFeatureEnabled(!feedbackFeatureEnabled);
      setFeedbackFeatureEnabled(result);
    } catch (err) {
      console.error('Failed to toggle feedback feature:', err);
      setError('Failed to update feedback feature');
    } finally {
      setIsTogglingFeedbackFeature(false);
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
      <button className={styles.backButton} onClick={() => navigate('/')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Home
      </button>

      {/* Statistics Overview */}
      <Card className={styles.statsCard}>
        <h2 className={styles.statsHeader}>
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles.statsHeaderIcon}>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
          </svg>
          Estatísticas da Plataforma
        </h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <span className={styles.statValue}>{stats?.totalUsers ?? 0}</span>
            <span className={styles.statLabel}>Total de Usuários</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <span className={styles.statValue}>{stats?.activeUsers ?? 0}</span>
            <span className={styles.statLabel}>Usuários Ativos</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="8" />
              </svg>
            </div>
            <span className={styles.statValue}>
              {stats?.onlineUsers != null && stats.onlineUsers > 1000
                ? '999+'
                : stats?.onlineUsers ?? 0}
            </span>
            <span className={styles.statLabel}>Usuários Online</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </div>
            <span className={styles.statValue}>{stats?.totalSessions ?? 0}</span>
            <span className={styles.statLabel}>Total de Sessões</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className={styles.statValue}>{stats?.activeSessions ?? 0}</span>
            <span className={styles.statLabel}>Sessões Ativas</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <span className={styles.statValue}>{stats?.currentlyRunningSessions ?? 0}</span>
            <span className={styles.statLabel}>Rodando Agora</span>
          </div>
        </div>
      </Card>

      {/* Settings Section */}
      <Card className={styles.settingsContainer}>
        <h2 className={styles.sectionTitle}>
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles.sectionTitleIcon}>
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
          Configurações do Sistema
        </h2>
        
        <div className={styles.settingsGrid}>
          {/* Free Mode Card */}
          <Tooltip content="Quando ativado, os usuários podem participar das sessões sem gastar créditos." position="top">
            <Card className={styles.freeModeCard}>
              <div className={styles.settingCardContent}>
                <div className={styles.settingIconWrapper}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className={styles.settingIcon}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <button
                  className={`${styles.settingToggle} ${freeMode?.enabled ? styles.enabled : styles.disabled}`}
                  onClick={handleToggleFreeMode}
                  disabled={isTogglingFreeMode}
                  title={isTogglingFreeMode ? 'Atualizando...' : freeMode?.enabled ? 'Ativado' : 'Desativado'}
                >
                  <span className={styles.toggleTrack}>
                    <span className={styles.toggleThumb} />
                  </span>
                </button>
                <h3 className={styles.settingTitle}>Modo Gratuito</h3>
              </div>
            </Card>
          </Tooltip>

          {/* Notify on Empty Queue Card */}
          <Tooltip content="Quando ativado, envia um email para todos os usuários quando alguém entra na fila e não há ninguém online. Cooldown de 30 minutos entre envios." position="top">
            <Card className={styles.notifyCard}>
              <div className={styles.settingCardContent}>
                <div className={styles.settingIconWrapper}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className={styles.settingIcon}>
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <button
                  className={`${styles.settingToggle} ${notifyOnEmptyQueue ? styles.enabled : styles.disabled}`}
                  onClick={handleToggleNotify}
                  disabled={isTogglingNotify}
                  title={isTogglingNotify ? 'Atualizando...' : notifyOnEmptyQueue ? 'Ativado' : 'Desativado'}
                >
                  <span className={styles.toggleTrack}>
                    <span className={styles.toggleThumb} />
                  </span>
                </button>
                <h3 className={styles.settingTitle}>Notificar Fila Vazia</h3>
              </div>
            </Card>
          </Tooltip>

          {/* Settings Page Toggle Card */}
          <Tooltip content="Quando ativado, os usuários podem acessar a página de configurações para gerenciar suas API keys." position="top">
            <Card className={styles.settingsPageCard}>
              <div className={styles.settingCardContent}>
                <div className={styles.settingIconWrapper}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className={styles.settingIcon}>
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                </div>
                <button
                  className={`${styles.settingToggle} ${settingsPageEnabled ? styles.enabled : styles.disabled}`}
                  onClick={handleToggleSettingsPage}
                  disabled={isTogglingSettingsPage}
                  title={isTogglingSettingsPage ? 'Atualizando...' : settingsPageEnabled ? 'Ativado' : 'Desativado'}
                >
                  <span className={styles.toggleTrack}>
                    <span className={styles.toggleThumb} />
                  </span>
                </button>
                <h3 className={styles.settingTitle}>Página de Settings</h3>
              </div>
            </Card>
          </Tooltip>

          {/* Transcript Feature Toggle Card */}
          <Tooltip content="Quando ativado, os usuários podem gravar e acessar transcrições de conversas." position="top">
            <Card className={styles.transcriptFeatureCard}>
              <div className={styles.settingCardContent}>
                <div className={styles.settingIconWrapper}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className={styles.settingIcon}>
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <button
                  className={`${styles.settingToggle} ${transcriptFeatureEnabled ? styles.enabled : styles.disabled}`}
                  onClick={handleToggleTranscriptFeature}
                  disabled={isTogglingTranscriptFeature}
                  title={isTogglingTranscriptFeature ? 'Atualizando...' : transcriptFeatureEnabled ? 'Ativado' : 'Desativado'}
                >
                  <span className={styles.toggleTrack}>
                    <span className={styles.toggleThumb} />
                  </span>
                </button>
                <h3 className={styles.settingTitle}>Feature de Transcrição</h3>
              </div>
            </Card>
          </Tooltip>

          {/* Feedback Feature Toggle Card */}
          <Tooltip content="Quando ativado, os usuários podem reportar bugs e enviar sugestões através do sistema de feedback." position="top">
            <Card className={styles.feedbackFeatureCard}>
              <div className={styles.settingCardContent}>
                <div className={styles.settingIconWrapper}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className={styles.settingIcon}>
                    <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z" />
                  </svg>
                </div>
                <button
                  className={`${styles.settingToggle} ${feedbackFeatureEnabled ? styles.enabled : styles.disabled}`}
                  onClick={handleToggleFeedbackFeature}
                  disabled={isTogglingFeedbackFeature}
                  title={isTogglingFeedbackFeature ? 'Atualizando...' : feedbackFeatureEnabled ? 'Ativado' : 'Desativado'}
                >
                  <span className={styles.toggleTrack}>
                    <span className={styles.toggleThumb} />
                  </span>
                </button>
                <h3 className={styles.settingTitle}>Feedback & Bug Reports</h3>
              </div>
            </Card>
          </Tooltip>

          {/* Transcript Daily Limit Card */}
          <Tooltip content="Define quantas transcrições cada usuário pode solicitar por dia." position="top">
            <Card className={styles.transcriptLimitCard}>
              <div className={styles.settingCardContent}>
                <div className={styles.settingIconWrapper}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className={styles.settingIcon}>
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <div className={styles.limitControls}>
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
                <h3 className={styles.settingTitle}>Limite Diário de Transcrições</h3>
              </div>
            </Card>
          </Tooltip>
        </div>
      </Card>
    </div>
  );
}
