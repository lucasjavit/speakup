import { useEffect, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { adminService, type ScheduledEmailResponse } from '@/services/adminService';
import styles from './ScheduledEmailsPanel.module.css';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function statusLabel(status: ScheduledEmailResponse['status']): string {
  const labels: Record<ScheduledEmailResponse['status'], string> = {
    PENDING: 'Pending',
    SENDING: 'Sending',
    SENT: 'Sent',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
  };
  return labels[status] ?? status;
}

export function ScheduledEmailsPanel() {
  const [emails, setEmails] = useState<ScheduledEmailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await adminService.getScheduledEmails();
      setEmails(list);
    } catch (err) {
      setError('Failed to load scheduled emails');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      setCancellingId(id);
      await adminService.cancelScheduledEmail(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
      console.error(err);
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (status: ScheduledEmailResponse['status']) =>
    status === 'PENDING' || status === 'SENDING';

  if (loading && emails.length === 0) {
    return (
      <Card className={styles.card}>
        <h3 className={styles.title}>Scheduled Emails</h3>
        <div className={styles.loading}>Loading...</div>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Scheduled Emails</h3>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {emails.length === 0 ? (
        <p className={styles.empty}>No scheduled emails.</p>
      ) : (
        <ul className={styles.list}>
          {emails.map((email) => (
            <li key={email.id} className={styles.item}>
              <div className={styles.itemMain}>
                <span className={styles.subject}>{email.subject}</span>
                <span className={`${styles.status} ${styles[email.status.toLowerCase()]}`}>
                  {statusLabel(email.status)}
                </span>
              </div>
              <div className={styles.itemMeta}>
                <span>Send at: {formatDateTime(email.scheduledAt)}</span>
                <span>Recipients: {email.recipientCount}</span>
                {email.sentAt && (
                  <span>Sent: {formatDateTime(email.sentAt)}</span>
                )}
                {email.errorMessage && (
                  <span className={styles.errorMsg}>{email.errorMessage}</span>
                )}
              </div>
              {canCancel(email.status) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancel(email.id)}
                  disabled={cancellingId === email.id}
                >
                  {cancellingId === email.id ? 'Cancelling...' : 'Cancel'}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
