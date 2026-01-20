import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { creditService, paymentService } from '@/services';
import { BackButton, Card, Tooltip } from '@/components/ui';
import type { CreditWallet, CreditTransaction, Purchase } from '@/types';
import styles from './Credits.module.css';

export function Credits() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [activeTab, setActiveTab] = useState<'transactions' | 'purchases'>('transactions');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [walletData, transactionsData, purchasesData] = await Promise.all([
        creditService.getWallet(),
        creditService.getTransactionHistory(0, 10),
        paymentService.getPurchaseHistory(0, 10),
      ]);

      setWallet(walletData);
      setTransactions(transactionsData.content);
      setPurchases(purchasesData.content);
    } catch (err) {
      console.error('Error loading credit data:', err);
      setError('Failed to load credit data');
    } finally {
      setIsLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        );
      case 'CONSUME':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
          </svg>
        );
      case 'REFUND':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.5 6.9c1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-.53.12-1.03.3-1.48.54l1.47 1.47c.41-.17.91-.27 1.51-.27zM5.33 4.06L4.06 5.33 7.5 8.77c0 2.08 1.56 3.21 3.91 3.91l3.51 3.51c-.34.48-1.05.91-2.42.91-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c.96-.18 1.82-.55 2.45-1.12l2.22 2.22 1.27-1.27L5.33 4.06z"/>
          </svg>
        );
      case 'BONUS':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        );
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'PURCHASE': return 'Purchase';
      case 'CONSUME': return 'Used';
      case 'REFUND': return 'Refund';
      case 'BONUS': return 'Bonus';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'PENDING': return 'Pending';
      case 'FAILED': return 'Failed';
      case 'REFUNDED': return 'Refunded';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'COMPLETED': return styles.statusCompleted;
      case 'PENDING': return styles.statusPending;
      case 'FAILED': return styles.statusFailed;
      case 'REFUNDED': return styles.statusRefunded;
      default: return '';
    }
  };

  const getTransactionTypeClass = (type: string) => {
    switch (type) {
      case 'PURCHASE': return styles.typePurchase;
      case 'CONSUME': return styles.typeConsume;
      case 'REFUND': return styles.typeRefund;
      case 'BONUS': return styles.typeBonus;
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <BackButton to="/" label="Home" />
        <h1 className={styles.pageTitle}>My Credits</h1>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Balance Card */}
      <section className={styles.balanceSection}>
        <div className={styles.balanceCard}>
          <div className={styles.balanceContent}>
            <div className={styles.balanceLeft}>
              <div className={styles.balanceIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                </svg>
              </div>
              <div className={styles.balanceInfo}>
                <span className={styles.balanceLabel}>Available Balance</span>
                <span className={styles.balanceValue}>{wallet?.conversationCredits || 0}</span>
                <span className={styles.balanceUnit}>conversations</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/credits/buy')}
              className={styles.buyButton}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Buy Credits
            </button>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className={styles.statsSection}>
        <Tooltip content="Total credit movements in your account" position="top">
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{transactions.length}</span>
              <span className={styles.statLabel}>Transactions</span>
            </div>
          </div>
        </Tooltip>
        <Tooltip content="Credit packs you've bought" position="top">
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z"/>
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{purchases.length}</span>
              <span className={styles.statLabel}>Purchases</span>
            </div>
          </div>
        </Tooltip>
        <Tooltip content="Conversations you've completed" position="top">
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {transactions.filter(t => t.transactionType === 'CONSUME').length}
              </span>
              <span className={styles.statLabel}>Conversations</span>
            </div>
          </div>
        </Tooltip>
      </section>

      {/* History Section */}
      <section className={styles.historySection}>
        <div className={styles.historyHeader}>
          <h2 className={styles.historyTitle}>History</h2>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'transactions' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
              </svg>
              Transactions
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'purchases' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('purchases')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z"/>
              </svg>
              Purchases
            </button>
          </div>
        </div>

        <Card className={styles.historyCard}>
          {activeTab === 'transactions' ? (
            transactions.length > 0 ? (
              <ul className={styles.historyList}>
                {transactions.map(tx => (
                  <li key={tx.id} className={styles.historyItem}>
                    <div className={`${styles.itemIcon} ${getTransactionTypeClass(tx.transactionType)}`}>
                      {getTransactionIcon(tx.transactionType)}
                    </div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemMain}>
                        <span className={styles.itemType}>
                          {getTransactionTypeLabel(tx.transactionType)}
                        </span>
                        <span className={styles.itemDescription}>
                          {tx.description}
                        </span>
                      </div>
                      <span className={styles.itemDate}>
                        {formatDate(tx.createdAt)}
                      </span>
                    </div>
                    <div className={styles.itemAmount}>
                      <span className={tx.amount > 0 ? styles.positive : styles.negative}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                      <span className={styles.balanceAfter}>
                        Balance: {tx.balanceAfter}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <p className={styles.emptyTitle}>No transactions yet</p>
                <p className={styles.emptyText}>Your transaction history will appear here</p>
              </div>
            )
          ) : (
            purchases.length > 0 ? (
              <ul className={styles.historyList}>
                {purchases.map(purchase => (
                  <li key={purchase.id} className={styles.historyItem}>
                    <div className={`${styles.itemIcon} ${styles.typePurchase}`}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z"/>
                      </svg>
                    </div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemMain}>
                        <span className={styles.itemType}>
                          {purchase.productName}
                        </span>
                        <span className={styles.itemDescription}>
                          {purchase.creditsAmount} conversations
                        </span>
                      </div>
                      <span className={styles.itemDate}>
                        {formatDate(purchase.createdAt)}
                      </span>
                    </div>
                    <div className={styles.itemAmount}>
                      <span className={styles.price}>
                        {formatCurrency(purchase.price)}
                      </span>
                      <span className={`${styles.status} ${getStatusClass(purchase.status)}`}>
                        {getStatusLabel(purchase.status)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z"/>
                  </svg>
                </div>
                <p className={styles.emptyTitle}>No purchases yet</p>
                <p className={styles.emptyText}>Your purchase history will appear here</p>
                <button
                  onClick={() => navigate('/credits/buy')}
                  className={styles.emptyButton}
                >
                  Buy Credits
                </button>
              </div>
            )
          )}
        </Card>
      </section>
    </div>
  );
}
