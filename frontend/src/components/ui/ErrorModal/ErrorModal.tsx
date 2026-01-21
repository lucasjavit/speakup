import { useEffect } from 'react';
import styles from './ErrorModal.module.css';

export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string;
  actionLabel?: string;
  onAction?: () => void;
  severity?: 'error' | 'warning' | 'info';
}

export function ErrorModal({
  isOpen,
  onClose,
  title = 'Error',
  message,
  details,
  actionLabel,
  onAction,
  severity = 'error',
}: ErrorModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        );
      case 'info':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        );
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles[severity]}`}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-title"
        aria-describedby="error-message"
      >
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        <div className={styles.iconContainer}>
          {getIcon()}
        </div>

        <h2 id="error-title" className={styles.title}>{title}</h2>

        <p id="error-message" className={styles.message}>{message}</p>

        {details && (
          <div className={styles.details}>
            <code>{details}</code>
          </div>
        )}

        <div className={styles.actions}>
          {onAction && actionLabel && (
            <button className={styles.actionButton} onClick={onAction}>
              {actionLabel}
            </button>
          )}
          <button className={styles.closeAction} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
