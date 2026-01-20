import { useEffect, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { adminService } from '@/services';
import type { AdminPurchase, PaymentStatus } from '@/types';
import styles from './Payments.module.css';

const STATUS_OPTIONS: PaymentStatus[] = ['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'];

export function AdminPayments() {
  const [purchases, setPurchases] = useState<AdminPurchase[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedStatuses, setSelectedStatuses] = useState<PaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPurchases();
  }, [currentPage, selectedStatuses]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPayments(
        currentPage,
        20,
        selectedStatuses.length > 0 ? selectedStatuses : undefined
      );
      setPurchases(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError('Failed to load payments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (status: PaymentStatus) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      }
      return [...prev, status];
    });
    setCurrentPage(0);
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  const getStatusClass = (status: PaymentStatus) => {
    switch (status) {
      case 'COMPLETED':
        return styles.statusCompleted;
      case 'PENDING':
        return styles.statusPending;
      case 'FAILED':
        return styles.statusFailed;
      case 'REFUNDED':
        return styles.statusRefunded;
      default:
        return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Payments</h2>
        <div className={styles.filters}>
          {STATUS_OPTIONS.map(status => (
            <button
              key={status}
              className={`${styles.filterButton} ${selectedStatuses.includes(status) ? styles.filterActive : ''} ${getStatusClass(status)}`}
              onClick={() => toggleStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : purchases.length === 0 ? (
        <Card className={styles.empty}>
          <p>No payments found.</p>
        </Card>
      ) : (
        <>
          <Card className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Product</th>
                  <th>Credits</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>
                      <div className={styles.userCell}>
                        <span className={styles.userName}>{purchase.userName}</span>
                        <span className={styles.userEmail}>{purchase.userEmail}</span>
                      </div>
                    </td>
                    <td>{purchase.productName}</td>
                    <td>
                      <span className={styles.credits}>
                        {purchase.creditsAmount} {purchase.creditType === 'SESSION' ? 'Sessions' : 'Conversations'}
                      </span>
                    </td>
                    <td>{formatCurrency(purchase.price, purchase.currency)}</td>
                    <td>
                      <span className={`${styles.status} ${getStatusClass(purchase.status)}`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <span>{formatDate(purchase.createdAt)}</span>
                        {purchase.completedAt && (
                          <span className={styles.completedAt}>
                            Completed: {formatDate(purchase.completedAt)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <span className={styles.pageInfo}>
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
