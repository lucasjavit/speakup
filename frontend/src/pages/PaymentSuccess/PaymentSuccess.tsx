import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '@/services';
import { Card } from '@/components/ui';
import type { Purchase } from '@/types';
import styles from './PaymentSuccess.module.css';

export function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!sessionId) {
      navigate('/credits');
      return;
    }

    loadPurchase();

    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [sessionId]);

  async function loadPurchase() {
    try {
      setIsLoading(true);
      const data = await paymentService.getPurchaseBySessionId(sessionId!);
      setPurchase(data);

      // If completed, redirect to credits page after a brief delay
      if (data.status === 'COMPLETED') {
        setTimeout(() => navigate('/credits'), 1500);
        return;
      }

      // If still pending, poll again (max 10 attempts over ~30 seconds)
      if (data.status === 'PENDING' && attemptsRef.current < 10) {
        attemptsRef.current++;
        pollingRef.current = setTimeout(loadPurchase, 3000);
      }
    } catch (err) {
      console.error('Error loading purchase:', err);
      setError('Failed to load purchase details');
    } finally {
      setIsLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <div className={styles.errorIcon}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h1 className={styles.title}>Something went wrong</h1>
          <p className={styles.description}>{error}</p>
          <button onClick={() => navigate('/credits')} className={styles.button}>
            Go to Credits
          </button>
        </Card>
      </div>
    );
  }

  const isPending = purchase?.status === 'PENDING';
  const isCompleted = purchase?.status === 'COMPLETED';

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        {isCompleted ? (
          <>
            <div className={styles.successIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className={styles.title}>Payment Successful!</h1>
            <p className={styles.description}>
              Your credits have been added to your account.
            </p>
          </>
        ) : isPending ? (
          <>
            <div className={styles.pendingIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </div>
            <h1 className={styles.title}>Processing Payment...</h1>
            <p className={styles.description}>
              Your payment is being processed. This may take a few moments.
            </p>
          </>
        ) : (
          <>
            <div className={styles.errorIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <h1 className={styles.title}>Payment Failed</h1>
            <p className={styles.description}>
              Unfortunately, your payment could not be processed.
            </p>
          </>
        )}

        {purchase && (
          <div className={styles.purchaseDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Product</span>
              <span className={styles.detailValue}>{purchase.productName}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Credits</span>
              <span className={styles.detailValue}>
                {purchase.creditsAmount} {purchase.creditType === 'SESSION' ? 'Sessions' : 'Conversations'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Amount</span>
              <span className={styles.detailValue}>{formatCurrency(purchase.price)}</span>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={() => navigate('/credits')} className={styles.button}>
            View My Credits
          </button>
          <button onClick={() => navigate('/')} className={styles.secondaryButton}>
            Go to Home
          </button>
        </div>
      </Card>
    </div>
  );
}
