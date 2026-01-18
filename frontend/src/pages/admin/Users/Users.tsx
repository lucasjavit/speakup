import { useEffect, useState } from 'react';
import { Button, Card, Input } from '@/components/ui';
import { adminService } from '@/services';
import { useAuthStore, isSuperAdmin } from '@/stores/authStore';
import type { AdminUser, Role } from '@/types';
import styles from './Users.module.css';

const ROLES: Role[] = ['USER', 'MODERATOR', 'PAYMENT_ADMIN', 'SUPER_ADMIN'];

export function AdminUsers() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, [currentPage, search]);

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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Users</h2>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <Button type="submit">Search</Button>
        </form>
      </div>

      {error && <div className={styles.error}>{error}</div>}

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
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <img
                          src={user.avatarUrl || '/default-avatar.png'}
                          alt={user.name}
                          className={styles.avatar}
                        />
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
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
    </div>
  );
}
