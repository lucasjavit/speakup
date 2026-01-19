import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../Button';
import { ratingService, relationshipService } from '@/services';
import type { FluencyLevel } from '@/types';
import styles from './PostCallRatingModal.module.css';

export interface PostCallRatingModalProps {
  isOpen: boolean;
  conversationId: string;
  partnerId: string;
  partnerName: string;
  onComplete: () => void;
}

const fluencyOptions: { value: FluencyLevel; label: string }[] = [
  { value: 'BASIC', label: 'Basic' },
  { value: 'ELEMENTARY', label: 'Elementary' },
  { value: 'LEVEL_UP', label: 'Level Up' },
  { value: 'EXPERT', label: 'Expert' },
];

export function PostCallRatingModal({
  isOpen,
  conversationId,
  partnerId,
  partnerName,
  onComplete,
}: PostCallRatingModalProps) {
  const [fluencyLevel, setFluencyLevel] = useState<FluencyLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [userBlocked, setUserBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFluencyLevel(null);
      setRatingSubmitted(false);
      setUserBlocked(false);
      setError(null);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleFluencyChange = async (level: FluencyLevel) => {
    if (isSubmitting || ratingSubmitted) return;

    setFluencyLevel(level);
    setIsSubmitting(true);
    setError(null);

    try {
      await ratingService.submitRating({
        conversationId,
        stars: 5, // Default value
        wantToTalkAgain: false,
        partnerFluencyLevel: level,
      });
      setRatingSubmitted(true);
    } catch (err) {
      console.error('Failed to submit rating:', err);
      setError('Failed to submit rating. Please try again.');
      setFluencyLevel(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlock = async () => {
    if (isBlocking) return;

    setIsBlocking(true);
    setError(null);

    try {
      if (userBlocked) {
        await relationshipService.unblockUser(partnerId);
        setUserBlocked(false);
      } else {
        await relationshipService.blockUser({
          targetUserId: partnerId,
          conversationId,
        });
        setUserBlocked(true);
      }
    } catch (err) {
      console.error('Failed to toggle block:', err);
      setError(userBlocked ? 'Failed to unblock user.' : 'Failed to block user.');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleContinue = useCallback(() => {
    if (!ratingSubmitted) return;
    onComplete();
  }, [ratingSubmitted, onComplete]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-call-rating-title"
      >
        <h2 id="post-call-rating-title" className={styles.title}>
          Rate partner's fluency
        </h2>

        <div className={styles.fluencyOptions}>
          {fluencyOptions.map((option) => (
            <label key={option.value} className={styles.fluencyOption}>
              <input
                type="radio"
                name="fluencyLevel"
                value={option.value}
                checked={fluencyLevel === option.value}
                onChange={() => handleFluencyChange(option.value)}
                disabled={ratingSubmitted || isSubmitting}
                className={styles.fluencyRadio}
              />
              <span className={styles.fluencyText}>{option.label}</span>
            </label>
          ))}
        </div>

        {isSubmitting && (
          <div className={styles.statusMessage}>
            <span>Saving...</span>
          </div>
        )}

        {ratingSubmitted && !isSubmitting && (
          <div className={styles.successMessage}>
            <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Rating saved!</span>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            <span>{error}</span>
          </div>
        )}

        <div className={styles.blockSection}>
          <button
            onClick={handleToggleBlock}
            disabled={isBlocking}
            className={`${styles.blockButton} ${userBlocked ? styles.blocked : ''}`}
          >
            {isBlocking
              ? (userBlocked ? 'Unblocking...' : 'Blocking...')
              : (userBlocked ? `Unblock ${partnerName}` : `Block ${partnerName}`)}
          </button>
          <p className={styles.blockHint}>
            {userBlocked
              ? "You won't be matched with this user again."
              : "Block to never be matched with this user again."}
          </p>
        </div>

        <div className={styles.footer}>
          <Button
            variant="primary"
            onClick={handleContinue}
            disabled={!ratingSubmitted}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
