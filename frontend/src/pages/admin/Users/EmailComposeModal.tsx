import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui';
import styles from './EmailComposeModal.module.css';

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (subject: string, body: string, scheduledAt?: string) => Promise<void>;
  recipientDescription: string;
}

export function EmailComposeModal({
  isOpen,
  onClose,
  onSend,
  recipientDescription,
}: EmailComposeModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) {
        onClose();
      }
    },
    [onClose, sending]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setSubject('');
      setBody('');
      setScheduleEnabled(false);
      setScheduledAt('');
      setError('');
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required');
      return;
    }
    if (scheduleEnabled) {
      if (!scheduledAt.trim()) {
        setError('Please pick a date and time for the scheduled email');
        return;
      }
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate.getTime() <= Date.now()) {
        setError('Scheduled time must be in the future');
        return;
      }
    }
    setSending(true);
    setError('');
    try {
      const iso = scheduleEnabled && scheduledAt ? new Date(scheduledAt).toISOString() : undefined;
      await onSend(subject.trim(), body.trim(), iso);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={sending ? undefined : onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Compose Email</h2>
          <span className={styles.recipients}>To: {recipientDescription}</span>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.field}>
            <label htmlFor="email-subject" className={styles.label}>Subject</label>
            <input
              id="email-subject"
              type="text"
              className={styles.input}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              maxLength={200}
              disabled={sending}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="email-body" className={styles.label}>Message</label>
            <textarea
              id="email-body"
              className={styles.textarea}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={10}
              maxLength={10000}
              disabled={sending}
            />
          </div>
          <div className={styles.scheduleRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(e) => setScheduleEnabled(e.target.checked)}
                disabled={sending}
              />
              <span>Schedule for later</span>
            </label>
            {scheduleEnabled && (
              <div className={styles.field}>
                <label htmlFor="email-scheduled-at" className={styles.label}>Send at</label>
                <input
                  id="email-scheduled-at"
                  type="datetime-local"
                  className={styles.input}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                  disabled={sending}
                />
              </div>
            )}
          </div>
          <div className={styles.footer}>
            <Button type="button" variant="ghost" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending
                ? (scheduleEnabled ? 'Scheduling...' : 'Sending...')
                : scheduleEnabled
                  ? 'Schedule Email'
                  : 'Send Email'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
