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
  const [currentPage, setCurrentPage] = useState(0);
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

  useEffect(() => {
    loadUsers();
  }, [currentPage, search]);

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
      const data = await adminService.getUsers(currentPage, 10, search || undefined);
      setUsers(data.content);
      setTotalPages(data.totalPages);
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
    loadUsers();
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

      <ScheduledEmailsPanel />

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
