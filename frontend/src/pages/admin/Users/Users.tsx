import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '@/components/ui';
import { UserLevel } from '@/components/ui/UserLevel';
import { adminService } from '@/services';
import { useAuthStore, isSuperAdmin } from '@/stores/authStore';
import type { AdminUser, Role } from '@/types';
import { EmailComposeModal } from './EmailComposeModal';
import { ScheduledEmailsPanel } from './ScheduledEmailsPanel';
import styles from './Users.module.css';

const ROLES: Role[] = ['USER', 'MODERATOR', 'PAYMENT_ADMIN', 'SUPER_ADMIN'];

export function AdminUsers() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Online presence
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Email state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<'all' | 'selected'>('all');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [refreshScheduled, setRefreshScheduled] = useState(0);

  useEffect(() => {
    loadUsers();
  }, [currentPage, pageSize, search]);

  useEffect(() => {
    const fetchOnline = async () => {
      try {
        const ids = await adminService.getOnlineUserIds();
        setOnlineUserIds(new Set(ids));
      } catch {
        // ignore
      }
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 30_000);
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers(currentPage, pageSize, search || undefined);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      await adminService.updateUserRole(userId, role);
      loadUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleStatusToggle = async (userId: string, currentActive: boolean) => {
    try {
      await adminService.updateUserStatus(userId, !currentActive);
      loadUsers();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Email handlers
  const handleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map((u) => u.id)));
    }
  };

  const handleSendEmail = async (subject: string, body: string, scheduledAt?: string) => {
    const userIds = emailTarget === 'selected' ? Array.from(selectedUserIds) : undefined;
    if (scheduledAt) {
      await adminService.scheduleEmail(subject, body, scheduledAt, userIds);
      setEmailSuccess('Email scheduled successfully.');
      setRefreshScheduled(prev => prev + 1); // Trigger refresh of scheduled emails panel
    } else {
      const result = await adminService.sendEmail(subject, body, userIds);
      setEmailSuccess(result.message);
    }
    setSelectedUserIds(new Set());
    setTimeout(() => setEmailSuccess(''), 5000);
  };

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate('/')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Home
      </button>

      <div className={styles.header}>
        <h2 className={styles.title}>Users</h2>
        <div className={styles.headerActions}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <Button type="submit">Search</Button>
          </form>
          <div className={styles.emailActions}>
            <Button
              variant="outline"
              onClick={() => { setEmailTarget('all'); setEmailModalOpen(true); }}
            >
              Email All Users
            </Button>
            {selectedUserIds.size > 0 && (
              <Button
                onClick={() => { setEmailTarget('selected'); setEmailModalOpen(true); }}
              >
                Email Selected ({selectedUserIds.size})
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {emailSuccess && <div className={styles.success}>{emailSuccess}</div>}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : users.length === 0 ? (
        <Card className={styles.empty}>
          <p>No users found.</p>
        </Card>
      ) : (
        <>
          <Card className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkboxCol}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedUserIds.size === users.length && users.length > 0}
                    />
                  </th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Proficiency Level</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className={styles.checkboxCol}>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </td>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatarWrapper}>
                          <img
                            src={user.avatarUrl || '/default-avatar.png'}
                            alt={user.name}
                            className={styles.avatar}
                          />
                          {onlineUserIds.has(user.id) && (
                            <span className={styles.onlineDot} title="Online" />
                          )}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <UserLevel user={user} variant="card" />
                    </td>
                    <td>
                      {isSuperAdmin(currentUser?.role) && user.id !== currentUser?.id ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                          className={styles.roleSelect}
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={styles.role}>{user.role.replace('_', ' ')}</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`${styles.status} ${user.active ? styles.active : styles.inactive}`}
                      >
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusToggle(user.id, user.active)}
                        >
                          {user.active ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              <span>
                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} users
              </span>
              <div className={styles.pageSizeSelector}>
                <label>Rows per page:</label>
                <select 
                  value={pageSize} 
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className={styles.pageSizeSelect}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(0)}
                  disabled={currentPage === 0}
                  title="First page"
                >
                  ««
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                
                <div className={styles.pageNumbers}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`${styles.pageButton} ${currentPage === pageNum ? styles.active : ''}`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(totalPages - 1)}
                  disabled={currentPage === totalPages - 1}
                  title="Last page"
                >
                  »»
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <ScheduledEmailsPanel key={refreshScheduled} />

      <EmailComposeModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSend={handleSendEmail}
        recipientDescription={
          emailTarget === 'all'
            ? 'all active users'
            : `${selectedUserIds.size} selected user(s)`
        }
      />
    </div>
  );
}
