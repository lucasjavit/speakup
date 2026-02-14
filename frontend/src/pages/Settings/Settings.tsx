import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '@/components/ui';
import { userService } from '@/services';
import styles from './Settings.module.css';

export function Settings() {
  const navigate = useNavigate();
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    userService.isSettingsPageEnabled().then((enabled) => {
      if (!enabled) {
        navigate('/', { replace: true });
      } else {
        loadSettings();
      }
    }).catch(() => {
      navigate('/', { replace: true });
    });
  }, [navigate]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await userService.getMySettings();
      if (data.openaiApiKey) {
        setOpenaiApiKey(data.openaiApiKey);
        setHasExistingKey(true);
      }
    } catch {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const data = await userService.updateMySettings({ openaiApiKey });
      setOpenaiApiKey(data.openaiApiKey);
      setHasExistingKey(!!data.openaiApiKey);
      setShowKey(false);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await userService.updateMySettings({ openaiApiKey: '' });
      setOpenaiApiKey('');
      setHasExistingKey(false);
      setShowKey(false);
      setSuccess('API key removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to remove API key');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpenaiApiKey(e.target.value);
  };

  const handleEditKey = () => {
    setOpenaiApiKey('');
    setShowKey(true);
    setHasExistingKey(false);
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <Card className={styles.card}>
        <h2 className={styles.sectionTitle}>
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles.sectionIcon}>
            <path d="M21 11c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V5l9-4 9 4v6z" />
          </svg>
          AI Integration
        </h2>
        <p className={styles.sectionDescription}>
          Configure your OpenAI API key to enable AI-powered features in the future.
        </p>

        <div className={styles.field}>
          <label className={styles.label}>OpenAI API Key</label>
          <div className={styles.inputGroup}>
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder={hasExistingKey ? '••••••••' : 'sk-proj-...'}
              value={openaiApiKey}
              onChange={handleKeyChange}
              disabled={hasExistingKey}
              className={styles.input}
            />
            {!hasExistingKey && (
              <button
                type="button"
                className={styles.toggleVisibility}
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Hide' : 'Show'}
              >
                {showKey ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            )}
          </div>
          <span className={styles.hint}>
            Get your API key from{' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
              platform.openai.com
            </a>
          </span>
        </div>

        <div className={styles.actions}>
          {hasExistingKey ? (
            <>
              <Button onClick={handleEditKey} variant="outline">
                Change Key
              </Button>
              <Button onClick={handleClear} variant="ghost" disabled={saving}>
                Remove Key
              </Button>
            </>
          ) : (
            <Button onClick={handleSave} disabled={saving || !openaiApiKey.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
