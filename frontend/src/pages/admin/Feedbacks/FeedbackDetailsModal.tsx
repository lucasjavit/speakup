import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { feedbackService } from '@/services';
import type { Feedback, FeedbackStatus } from '@/types';
import toast from 'react-hot-toast';
import styles from './FeedbackDetailsModal.module.css';

interface FeedbackDetailsModalProps {
  feedbackId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function FeedbackDetailsModal({ feedbackId, onClose, onUpdate }: FeedbackDetailsModalProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<FeedbackStatus>('OPEN');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadFeedback();
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [feedbackId]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const data = await feedbackService.getAdminFeedback(feedbackId);
      setFeedback(data);
      setNotes(data.adminNotes || '');
      setStatus(data.status);
    } catch (error) {
      console.error('Failed to load feedback:', error);
      toast.error('Failed to load feedback details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!feedback) return;

    setIsUpdating(true);
    try {
      await feedbackService.updateFeedbackStatus(feedbackId, { status });
      toast.success('Status updated successfully');
      onUpdate();
      loadFeedback();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!feedback) return;

    setIsUpdating(true);
    try {
      await feedbackService.updateAdminNotes(feedbackId, { notes });
      toast.success('Notes updated successfully');
      onUpdate();
      loadFeedback();
    } catch (error) {
      console.error('Failed to update notes:', error);
      toast.error('Failed to update notes');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!feedback && !loading) {
    return null;
  }

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Feedback Details</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : feedback ? (
            <>
              <div className={styles.section}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Type:</span>
                  <span className={`${styles.badge} ${styles[feedback.type.toLowerCase()]}`}>
                    {feedback.type}
                  </span>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Status:</span>
                  <span className={`${styles.badge} ${styles[feedback.status.toLowerCase().replace('_', '')]}`}>
                    {feedback.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.fieldLabel}>Title</div>
                <div className={styles.fieldValue}>{feedback.title}</div>
              </div>

              <div className={styles.section}>
                <div className={styles.fieldLabel}>Description</div>
                <div className={styles.fieldValue}>{feedback.description}</div>
              </div>

              <div className={styles.section}>
                <div className={styles.fieldLabel}>User Information</div>
                <div className={styles.userInfo}>
                  <div><strong>Name:</strong> {feedback.userName}</div>
                  <div><strong>Email:</strong> {feedback.userEmail}</div>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.fieldLabel}>Additional Information</div>
                <div className={styles.additionalInfo}>
                  <div><strong>Page URL:</strong> {feedback.pageUrl}</div>
                  <div><strong>Created:</strong> {formatDate(feedback.createdAt)}</div>
                  {feedback.resolvedAt && (
                    <div><strong>Resolved:</strong> {formatDate(feedback.resolvedAt)}</div>
                  )}
                </div>
              </div>

              {(feedback.screenshotData || feedback.screenshotUrl) && (
                <div className={styles.section}>
                  <div className={styles.fieldLabel}>Screenshot</div>
                  <img
                    src={feedback.screenshotData || feedback.screenshotUrl || ''}
                    alt="Screenshot"
                    className={styles.screenshot}
                    onClick={() => window.open(feedback.screenshotData || feedback.screenshotUrl || '', '_blank')}
                  />
                </div>
              )}

              <div className={styles.section}>
                <div className={styles.fieldLabel}>Update Status</div>
                <div className={styles.statusUpdate}>
                  <select
                    className={styles.select}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
                    disabled={isUpdating}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <button
                    className={styles.button}
                    onClick={handleUpdateStatus}
                    disabled={isUpdating || status === feedback.status}
                  >
                    Update Status
                  </button>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.fieldLabel}>Admin Notes</div>
                <textarea
                  className={styles.textarea}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add admin notes..."
                  disabled={isUpdating}
                />
                <button
                  className={styles.button}
                  onClick={handleUpdateNotes}
                  disabled={isUpdating || notes === (feedback.adminNotes || '')}
                >
                  Update Notes
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
