import { useAuthStore } from '@/stores/authStore';
import type { Role } from '@/types';

export interface Permissions {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canManageSessions: boolean;
  canManageUsers: boolean;
  canManagePayments: boolean;
  canCreateAdmins: boolean;
}

function checkIsAdmin(role?: Role): boolean {
  return role === 'MODERATOR' || role === 'PAYMENT_ADMIN' || role === 'SUPER_ADMIN';
}

function checkIsSuperAdmin(role?: Role): boolean {
  return role === 'SUPER_ADMIN';
}

function checkCanManageSessions(role?: Role): boolean {
  return role === 'MODERATOR' || role === 'SUPER_ADMIN';
}

function checkCanManageUsers(role?: Role): boolean {
  return role === 'MODERATOR' || role === 'SUPER_ADMIN';
}

function checkCanManagePayments(role?: Role): boolean {
  return role === 'PAYMENT_ADMIN' || role === 'SUPER_ADMIN';
}

function checkCanCreateAdmins(role?: Role): boolean {
  return role === 'SUPER_ADMIN';
}

export function usePermissions(): Permissions {
  const role = useAuthStore((state) => state.user?.role);

  return {
    isAdmin: checkIsAdmin(role),
    isSuperAdmin: checkIsSuperAdmin(role),
    canManageSessions: checkCanManageSessions(role),
    canManageUsers: checkCanManageUsers(role),
    canManagePayments: checkCanManagePayments(role),
    canCreateAdmins: checkCanCreateAdmins(role),
  };
}

// Export individual check functions for use outside of React components
export {
  checkIsAdmin as isAdmin,
  checkIsSuperAdmin as isSuperAdmin,
  checkCanManageSessions as canManageSessions,
  checkCanManageUsers as canManageUsers,
  checkCanManagePayments as canManagePayments,
  checkCanCreateAdmins as canCreateAdmins,
};
