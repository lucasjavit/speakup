import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { creditService } from '@/services';
import type { CreditWallet } from '@/types';
import styles from './CreditBalance.module.css';

interface CreditBalanceProps {
  compact?: boolean;
}

export function CreditBalance({ compact = false }: CreditBalanceProps) {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFreeModeEnabled, setIsFreeModeEnabled] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [walletData, freeMode] = await Promise.all([
        creditService.getWallet(),
        creditService.isFreeModeEnabled(),
      ]);
      setWallet(walletData);
      setIsFreeModeEnabled(freeMode);
    } catch (err) {
      console.error('Error loading wallet:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Hide component when free mode is enabled
  if (isFreeModeEnabled) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!wallet) {
    return null;
  }

  const conversationCredits = wallet.conversationCredits;

  if (compact) {
    return (
      <div className={`${styles.container} ${styles.compact}`} onClick={() => navigate('/credits')}>
        <div className={styles.compactCredits}>
          <div className={styles.creditItem}>
            <svg viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
              <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
            </svg>
            <span>{conversationCredits}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIconWrapper}>
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles.headerIcon}>
            <path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        </div>
        <h3>Your Conversations</h3>
        <button
          className={styles.headerBuyButton}
          onClick={() => navigate('/credits/buy')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles.buyIcon}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
          </svg>
          Buy More
        </button>
      </div>
      <div className={styles.content}>
        <div className={styles.credits}>
          <div className={styles.creditCard}>
            <div className={styles.creditIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
              </svg>
            </div>
            <div className={styles.creditInfo}>
              <span className={styles.creditValue}>{conversationCredits}</span>
              <span className={styles.creditLabel}>Conversations Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
