import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, DataTable } from '@/components/ui';
import type { Column } from '@/components/ui';
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

  const columns: Column<AdminUser>[] = [
    {
      key: 'user',
      label: 'User',
      render: (user) => (
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
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (user) => user.email,
    },
    {
      key: 'proficiency',
      label: 'Proficiency Level',
      render: (user) => <UserLevel user={user} variant="card" />,
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => (
        isSuperAdmin(currentUser?.role) && user.id !== currentUser?.id ? (
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
        )
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (user) => (
        <span
          className={`${styles.status} ${user.active ? styles.active : styles.inactive}`}
        >
          {user.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        user.id !== currentUser?.id ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusToggle(user.id, user.active)}
          >
            {user.active ? 'Deactivate' : 'Activate'}
          </Button>
        ) : null
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

      <DataTable
        data={users}
        columns={columns}
        getRowKey={(user) => user.id}
        loading={loading}
        emptyMessage="No users found"
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(0);
        }}
        pageSizes={[10, 25, 50, 100]}
        selectable
        selectedKeys={selectedUserIds}
        onSelectionChange={setSelectedUserIds}
        paginationLabel="users"
      />

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
