import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { adminService } from '@/services';
import toast from 'react-hot-toast';
import styles from './Settings.module.css';

interface FeatureSettings {
  feedbackFeature: boolean;
  transcriptFeature: boolean;
  settingsPage: boolean;
  notifyOnEmptyQueue: boolean;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<FeatureSettings>({
    feedbackFeature: true,
    transcriptFeature: true,
    settingsPage: false,
    notifyOnEmptyQueue: false,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [feedbackFeature, transcriptFeature, settingsPage, notifyOnEmptyQueue] = await Promise.all([
        adminService.getFeedbackFeatureEnabled(),
        adminService.getTranscriptFeatureEnabled(),
        adminService.getSettingsPageEnabled(),
        adminService.getNotifyOnEmptyQueueEnabled(),
      ]);

      setSettings({
        feedbackFeature,
        transcriptFeature,
        settingsPage,
        notifyOnEmptyQueue,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof FeatureSettings) => {
    const newValue = !settings[key];
    setUpdating(key);

    try {
      switch (key) {
        case 'feedbackFeature':
          await adminService.updateFeedbackFeatureEnabled(newValue);
          toast.success(`Feedback feature ${newValue ? 'enabled' : 'disabled'}`);
          break;
        case 'transcriptFeature':
          await adminService.updateTranscriptFeatureEnabled(newValue);
          toast.success(`Transcript feature ${newValue ? 'enabled' : 'disabled'}`);
          break;
        case 'settingsPage':
          await adminService.updateSettingsPageEnabled(newValue);
          toast.success(`Settings page ${newValue ? 'enabled' : 'disabled'}`);
          break;
        case 'notifyOnEmptyQueue':
          await adminService.updateNotifyOnEmptyQueueEnabled(newValue);
          toast.success(`Empty queue notification ${newValue ? 'enabled' : 'disabled'}`);
          break;
      }

      setSettings((prev) => ({ ...prev, [key]: newValue }));
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      toast.error(`Failed to update setting`);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>System Settings</h1>
      </div>

      <div className={styles.settingsSections}>
        <Card>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Features</h2>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Feedback & Bug Reports</div>
                <div className={styles.settingDescription}>
                  Allow users to report bugs and send feedback through the feedback system.
                  When disabled, the feedback button and page will be hidden from users.
                </div>
              </div>
              <div className={styles.settingControl}>
                <span className={`${styles.statusBadge} ${settings.feedbackFeature ? styles.enabled : styles.disabled}`}>
                  {settings.feedbackFeature ? 'Enabled' : 'Disabled'}
                </span>
                <div
                  className={`${styles.toggle} ${settings.feedbackFeature ? styles.active : ''}`}
                  onClick={() => !updating && handleToggle('feedbackFeature')}
                  style={{ opacity: updating === 'feedbackFeature' ? 0.6 : 1 }}
                />
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Transcript Feature</div>
                <div className={styles.settingDescription}>
                  Allow users to record and access conversation transcripts.
                  When disabled, the transcripts page will be hidden from users.
                </div>
              </div>
              <div className={styles.settingControl}>
                <span className={`${styles.statusBadge} ${settings.transcriptFeature ? styles.enabled : styles.disabled}`}>
                  {settings.transcriptFeature ? 'Enabled' : 'Disabled'}
                </span>
                <div
                  className={`${styles.toggle} ${settings.transcriptFeature ? styles.active : ''}`}
                  onClick={() => !updating && handleToggle('transcriptFeature')}
                  style={{ opacity: updating === 'transcriptFeature' ? 0.6 : 1 }}
                />
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>User Settings Page</div>
                <div className={styles.settingDescription}>
                  Allow users to access the Settings page to configure their API keys and preferences.
                </div>
              </div>
              <div className={styles.settingControl}>
                <span className={`${styles.statusBadge} ${settings.settingsPage ? styles.enabled : styles.disabled}`}>
                  {settings.settingsPage ? 'Enabled' : 'Disabled'}
                </span>
                <div
                  className={`${styles.toggle} ${settings.settingsPage ? styles.active : ''}`}
                  onClick={() => !updating && handleToggle('settingsPage')}
                  style={{ opacity: updating === 'settingsPage' ? 0.6 : 1 }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Notifications</h2>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Notify on Empty Queue</div>
                <div className={styles.settingDescription}>
                  Send an email notification to all users when someone joins the queue and no other users are online.
                </div>
              </div>
              <div className={styles.settingControl}>
                <span className={`${styles.statusBadge} ${settings.notifyOnEmptyQueue ? styles.enabled : styles.disabled}`}>
                  {settings.notifyOnEmptyQueue ? 'Enabled' : 'Disabled'}
                </span>
                <div
                  className={`${styles.toggle} ${settings.notifyOnEmptyQueue ? styles.active : ''}`}
                  onClick={() => !updating && handleToggle('notifyOnEmptyQueue')}
                  style={{ opacity: updating === 'notifyOnEmptyQueue' ? 0.6 : 1 }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
