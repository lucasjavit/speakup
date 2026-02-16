import { useEffect, useState } from 'react';
import { DataTable } from '@/components/ui';
import type { Column } from '@/components/ui';
import { feedbackService } from '@/services';
import type { FeedbackSummary, FeedbackStats, FeedbackStatus, FeedbackType } from '@/types';
import { FeedbackDetailsModal } from './FeedbackDetailsModal';
import toast from 'react-hot-toast';
import styles from './Feedbacks.module.css';

export function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState<FeedbackSummary[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<FeedbackType | ''>('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [page, pageSize, statusFilter, typeFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feedbacksData, statsData] = await Promise.all([
        feedbackService.getAllFeedbacks(
          page,
          pageSize,
          statusFilter || undefined,
          typeFilter || undefined
        ),
        feedbackService.getFeedbackStats(),
      ]);

      setFeedbacks(feedbacksData.content);
      setTotalPages(feedbacksData.totalPages);
      setTotalElements(feedbacksData.totalElements);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load feedbacks:', error);
      toast.error('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      await feedbackService.deleteFeedback(id);
      toast.success('Feedback deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete feedback:', error);
      toast.error('Failed to delete feedback');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeBadgeClass = (type: FeedbackType) => {
    switch (type) {
      case 'BUG':
        return styles.bug;
      case 'SUGGESTION':
        return styles.suggestion;
      case 'OTHER':
        return styles.other;
      default:
        return '';
    }
  };

  const getStatusBadgeClass = (status: FeedbackStatus) => {
    switch (status) {
      case 'OPEN':
        return styles.open;
      case 'IN_PROGRESS':
        return styles.inProgress;
      case 'RESOLVED':
        return styles.resolved;
      case 'CLOSED':
        return styles.closed;
      default:
        return '';
    }
  };

  const formatStatusLabel = (status: FeedbackStatus) => {
    return status.replace('_', ' ');
  };

  const columns: Column<FeedbackSummary>[] = [
    {
      key: 'type',
      label: 'Type',
      render: (feedback) => (
        <span className={`${styles.typeBadge} ${getTypeBadgeClass(feedback.type)}`}>
          {feedback.type}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (feedback) => feedback.title,
    },
    {
      key: 'user',
      label: 'User',
      render: (feedback) => (
        <div className={styles.userInfo}>
          <span className={styles.userName}>{feedback.userName}</span>
          <span className={styles.userEmail}>{feedback.userEmail}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (feedback) => (
        <span className={`${styles.statusBadge} ${getStatusBadgeClass(feedback.status)}`}>
          {formatStatusLabel(feedback.status)}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (feedback) => formatDate(feedback.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (feedback) => (
        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={() => setSelectedFeedbackId(feedback.id)}
          >
            View Details
          </button>
          <button
            className={`${styles.actionButton} ${styles.danger}`}
            onClick={() => handleDelete(feedback.id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Feedbacks</h1>
      </div>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.open}</div>
            <div className={styles.statLabel}>Open</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.inProgress}</div>
            <div className={styles.statLabel}>In Progress</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.resolved}</div>
            <div className={styles.statLabel}>Resolved</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.bugs}</div>
            <div className={styles.statLabel}>Bugs</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.suggestions}</div>
            <div className={styles.statLabel}>Suggestions</div>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as FeedbackStatus | '');
              setPage(0);
            }}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Type</label>
          <select
            className={styles.select}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as FeedbackType | '');
              setPage(0);
            }}
          >
            <option value="">All Types</option>
            <option value="BUG">Bug</option>
            <option value="SUGGESTION">Suggestion</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <DataTable
        data={feedbacks}
        columns={columns}
        getRowKey={(feedback) => feedback.id}
        loading={loading}
        emptyMessage="No feedbacks found"
        currentPage={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
        paginationLabel="feedbacks"
      />

      {selectedFeedbackId && (
        <FeedbackDetailsModal
          feedbackId={selectedFeedbackId}
          onClose={() => setSelectedFeedbackId(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}
