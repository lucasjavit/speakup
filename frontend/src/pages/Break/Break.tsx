import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallStore } from '@/stores/callStore';
import { ratingService, creditService } from '@/services';
import { PostCallRatingModal, QueueModal } from '@/components/ui';
import { CreditBalance, InsufficientCreditsModal } from '@/components/credits';
import styles from './Break.module.css';

interface BreakState {
  conversationId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  topic: string;
  duration: number;
  sessionId: string;
  breakDurationSeconds: number;
}

const DEFAULT_BREAK_DURATION_SECONDS = 30;

export function Break() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as BreakState | null;
  const { logout } = useAuthStore();
  const { joinQueue: joinQueueStore } = useCallStore();

  // Use breakDurationSeconds from state, fallback to default
  const breakDuration = state?.breakDurationSeconds || DEFAULT_BREAK_DURATION_SECONDS;

  const [countdown, setCountdown] = useState(breakDuration);
  const [canContinue, setCanContinue] = useState(breakDuration === 0);

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingCompleted, setRatingCompleted] = useState(false);

  // Queue modal state
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Credit check state
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [isCheckingCredits, setIsCheckingCredits] = useState(false);

  // Check if rating already exists and show modal on mount
  useEffect(() => {
    if (state?.conversationId) {
      ratingService.getRatingForConversation(state.conversationId)
        .then(rating => {
          if (rating) {
            // Rating already exists, don't show modal
            setRatingCompleted(true);
          } else {
            // No rating yet, show modal
            setShowRatingModal(true);
          }
        })
        .catch(err => {
          console.warn('Could not check existing rating:', err);
          // Show modal anyway if we can't check
          setShowRatingModal(true);
        });
    } else {
      // No conversation ID, skip rating
      setRatingCompleted(true);
    }
  }, [state?.conversationId]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanContinue(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanContinue(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleRatingComplete = () => {
    setShowRatingModal(false);
    setRatingCompleted(true);
  };

  const handleContinue = async () => {
    if (!canContinue || !ratingCompleted) return;

    if (state?.sessionId) {
      try {
        setIsCheckingCredits(true);
        const canJoin = await creditService.canJoinSession();
        if (!canJoin) {
          setShowInsufficientCredits(true);
          return;
        }
        joinQueueStore(state.sessionId);
        setIsQueueOpen(true);
      } catch (err) {
        console.error('Error checking credits:', err);
        setShowInsufficientCredits(true);
      } finally {
        setIsCheckingCredits(false);
      }
    } else {
      navigate('/');
    }
  };

  const handleExit = () => {
    navigate('/');
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <div className={styles.checkIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
          </div>

          <h1 className={styles.title}>Great conversation!</h1>

          {/* Credits Balance */}
          <div className={styles.creditsSection}>
            <CreditBalance />
          </div>

          {state && (
            <div className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <div className={styles.summaryIcon}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div className={styles.summaryText}>
                  <span className={styles.summaryLabel}>Partner</span>
                  <span className={styles.summaryValue}>{state.partnerName}</span>
                </div>
              </div>
              <div className={styles.summaryRow}>
                <div className={styles.summaryIcon}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                  </svg>
                </div>
                <div className={styles.summaryText}>
                  <span className={styles.summaryLabel}>Topic</span>
                  <span className={styles.summaryValue}>{state.topic}</span>
                </div>
              </div>
              <div className={styles.summaryRow}>
                <div className={styles.summaryIcon}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                </div>
                <div className={styles.summaryText}>
                  <span className={styles.summaryLabel}>Duration</span>
                  <span className={styles.summaryValue}>{formatDuration(state.duration)}</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.timerSection}>
            {countdown > 0 ? (
              <>
                <div className={styles.timerCircle}>
                  <span className={styles.timerNumber}>{countdown}</span>
                </div>
                <p className={styles.timerText}>Take a short break...</p>
              </>
            ) : (
              <p className={styles.readyText}>Ready for another conversation?</p>
            )}
          </div>

          <div className={styles.actions}>
            <button
              onClick={handleContinue}
              disabled={!canContinue || !ratingCompleted || isCheckingCredits}
              className={styles.continueButton}
            >
              {isCheckingCredits
                ? 'Checking...'
                : !ratingCompleted
                  ? 'Complete rating first'
                  : canContinue
                    ? 'Find New Partner'
                    : `Wait ${countdown}s`}
            </button>
            <button onClick={handleExit} className={styles.exitButton}>
              Exit to Home
            </button>
          </div>
        </div>
      </div>

      {/* Post-Call Rating Modal */}
      {state && (
        <PostCallRatingModal
          isOpen={showRatingModal}
          conversationId={state.conversationId}
          partnerId={state.partnerId}
          partnerName={state.partnerName}
          onComplete={handleRatingComplete}
        />
      )}

      {/* Queue Modal */}
      {state?.sessionId && (
        <QueueModal
          isOpen={isQueueOpen}
          sessionId={state.sessionId}
          onClose={() => setIsQueueOpen(false)}
        />
      )}

      <InsufficientCreditsModal
        isOpen={showInsufficientCredits}
        onClose={() => setShowInsufficientCredits(false)}
      />
    </div>
  );
}
