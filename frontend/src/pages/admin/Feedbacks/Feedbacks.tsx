import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
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

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
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

      <Card>
        {loading ? (
          <div className={styles.loading}>Loading feedbacks...</div>
        ) : feedbacks.length === 0 ? (
          <div className={styles.noData}>No feedbacks found</div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((feedback) => (
                  <tr key={feedback.id}>
                    <td>
                      <span className={`${styles.typeBadge} ${getTypeBadgeClass(feedback.type)}`}>
                        {feedback.type}
                      </span>
                    </td>
                    <td>{feedback.title}</td>
                    <td>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{feedback.userName}</span>
                        <span className={styles.userEmail}>{feedback.userEmail}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(feedback.status)}`}>
                        {formatStatusLabel(feedback.status)}
                      </span>
                    </td>
                    <td>{formatDate(feedback.createdAt)}</td>
                    <td>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.paginationContainer}>
              <div className={styles.paginationInfo}>
                <span>
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} feedbacks
                </span>
                <div className={styles.pageSizeSelector}>
                  <label>Rows per page:</label>
                  <select 
                    value={pageSize} 
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className={styles.pageSizeSelect}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageButton}
                    onClick={() => goToPage(0)}
                    disabled={page === 0}
                    title="First page"
                  >
                    ««
                  </button>
                  <button
                    className={styles.pageButton}
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 0}
                  >
                    Previous
                  </button>
                  
                  <div className={styles.pageNumbers}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (page < 3) {
                        pageNum = i;
                      } else if (page >= totalPages - 3) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`${styles.pageButton} ${page === pageNum ? styles.active : ''}`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className={styles.pageButton}
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages - 1}
                  >
                    Next
                  </button>
                  <button
                    className={styles.pageButton}
                    onClick={() => goToPage(totalPages - 1)}
                    disabled={page === totalPages - 1}
                    title="Last page"
                  >
                    »»
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </Card>

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
