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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await adminService.getScheduledEmails();
      // Show all emails (SENT emails are auto-deleted by backend after sending)
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled email?')) {
      return;
    }
    try {
      setDeletingId(id);
      await adminService.cancelScheduledEmail(id);
      // Remove from list immediately
      setEmails(prev => prev.filter(email => email.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

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
              <div className={styles.actions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(email.id)}
                  disabled={deletingId === email.id}
                  className={styles.deleteButton}
                >
                  {deletingId === email.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
