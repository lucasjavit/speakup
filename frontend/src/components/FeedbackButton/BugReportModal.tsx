import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { feedbackService } from '@/services';
import toast from 'react-hot-toast';
import styles from './BugReportModal.module.css';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  // Capture screenshot when modal opens
  useEffect(() => {
    if (isOpen) {
      captureScreenshot();
      // Disable body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const captureScreenshot = async () => {
    try {
      setIsCapturing(true);
      // Hide the modal temporarily to capture the screen behind it
      const modalElement = document.querySelector('[data-feedback-modal]') as HTMLElement;
      if (modalElement) {
        modalElement.style.display = 'none';
      }

      // Wait a bit for modal to hide
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        scale: 0.5, // Reduce quality for smaller file size
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });

      // Show modal again
      if (modalElement) {
        modalElement.style.display = '';
      }

      const screenshotData = canvas.toDataURL('image/png');
      setScreenshot(screenshotData);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      toast.error('Failed to capture screenshot');
    } finally {
      setIsCapturing(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: { title?: string; description?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 255) {
      newErrors.title = 'Title must not exceed 255 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length > 5000) {
      newErrors.description = 'Description must not exceed 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await feedbackService.createFeedback({
        type: 'BUG',
        title: title.trim(),
        description: description.trim(),
        screenshotData: screenshot || undefined,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
      });

      toast.success('Bug report submitted successfully!');
      onClose();
    } catch (error: any) {
      console.error('Failed to submit bug report:', error);
      toast.error(error.response?.data?.message || 'Failed to submit bug report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
      data-feedback-modal
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="bug-report-title">
        <div className={styles.header}>
          <h2 id="bug-report-title" className={styles.title}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z" />
            </svg>
            Report a Bug
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="bug-title" className={styles.label}>
                Title<span className={styles.required}>*</span>
              </label>
              <input
                id="bug-title"
                type="text"
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the bug"
                maxLength={255}
                disabled={isSubmitting}
              />
              {errors.title && <div className={styles.error}>{errors.title}</div>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="bug-description" className={styles.label}>
                Description<span className={styles.required}>*</span>
              </label>
              <textarea
                id="bug-description"
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the bug in detail. What were you doing when it happened? What did you expect to happen?"
                maxLength={5000}
                disabled={isSubmitting}
              />
              {errors.description && <div className={styles.error}>{errors.description}</div>}
            </div>

            {isCapturing ? (
              <div className={styles.loadingScreenshot}>
                Capturing screenshot...
              </div>
            ) : screenshot && (
              <div className={styles.screenshotPreview}>
                <div className={styles.screenshotLabel}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  Screenshot (click to view full size)
                </div>
                <img
                  src={screenshot}
                  alt="Page screenshot"
                  className={styles.screenshotImage}
                  onClick={() => window.open(screenshot, '_blank')}
                />
              </div>
            )}
          </form>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${styles.button} ${styles.submitButton}`}
            onClick={handleSubmit}
            disabled={isSubmitting || isCapturing}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
