import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/ui';
import type { Column } from '@/components/ui';
import { adminService } from '@/services';
import type { AdminPurchase, PaymentStatus } from '@/types';
import styles from './Payments.module.css';

const STATUS_OPTIONS: PaymentStatus[] = ['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'];

export function AdminPayments() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<AdminPurchase[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedStatuses, setSelectedStatuses] = useState<PaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPurchases();
  }, [currentPage, pageSize, selectedStatuses]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPayments(
        currentPage,
        pageSize,
        selectedStatuses.length > 0 ? selectedStatuses : undefined
      );
      setPurchases(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
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

  const columns: Column<AdminPurchase>[] = [
    {
      key: 'user',
      label: 'User',
      render: (purchase) => (
        <div className={styles.userCell}>
          <span className={styles.userName}>{purchase.userName}</span>
          <span className={styles.userEmail}>{purchase.userEmail}</span>
        </div>
      ),
    },
    {
      key: 'product',
      label: 'Product',
      render: (purchase) => purchase.productName,
    },
    {
      key: 'credits',
      label: 'Credits',
      render: (purchase) => (
        <span className={styles.credits}>
          {purchase.creditsAmount} {purchase.creditType === 'SESSION' ? 'Sessions' : 'Conversations'}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (purchase) => formatCurrency(purchase.price, purchase.currency),
    },
    {
      key: 'status',
      label: 'Status',
      render: (purchase) => (
        <span className={`${styles.status} ${getStatusClass(purchase.status)}`}>
          {purchase.status}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (purchase) => (
        <div className={styles.dateCell}>
          <span>{formatDate(purchase.createdAt)}</span>
          {purchase.completedAt && (
            <span className={styles.completedAt}>
              Completed: {formatDate(purchase.completedAt)}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate('/')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Home
      </button>

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

      <DataTable
        data={purchases}
        columns={columns}
        getRowKey={(purchase) => purchase.id}
        loading={loading}
        emptyMessage="No payments found"
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(0);
        }}
        paginationLabel="payments"
      />
    </div>
  );
}
