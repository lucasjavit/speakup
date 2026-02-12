import api, { apiCall } from '@/lib/axios';
import type {
  ApiResult,
  Session,
  CreateSessionRequest,
  UpdateSessionRequest,
  SessionStatus,
  AdminUser,
  Role,
  DashboardStats,
  AdminPurchase,
  PaymentStatus,
  FreeModeStatus,
  ApplicationSetting,
} from '@/types';

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ScheduledEmailResponse {
  id: string;
  subject: string;
  body: string;
  status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  scheduledAt: string;
  sentAt: string | null;
  recipientType: string;
  userIds: string | null;
  recipientCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export const adminService = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    return apiCall<DashboardStats>(api.get<ApiResult<DashboardStats>>('/admin/dashboard/stats'));
  },

  // Sessions
  getSessions: async (page = 0, size = 10): Promise<PaginatedResponse<Session>> => {
    return apiCall<PaginatedResponse<Session>>(
      api.get<ApiResult<PaginatedResponse<Session>>>(`/admin/sessions?page=${page}&size=${size}`)
    );
  },

  getAllSessions: async (): Promise<Session[]> => {
    return apiCall<Session[]>(api.get<ApiResult<Session[]>>('/admin/sessions/all'));
  },

  getActiveSessions: async (): Promise<Session[]> => {
    return apiCall<Session[]>(api.get<ApiResult<Session[]>>('/admin/sessions/active'));
  },

  getRunningSessions: async (): Promise<Session[]> => {
    return apiCall<Session[]>(api.get<ApiResult<Session[]>>('/admin/sessions/running'));
  },

  getSession: async (id: string): Promise<Session> => {
    return apiCall<Session>(api.get<ApiResult<Session>>(`/admin/sessions/${id}`));
  },

  createSession: async (data: CreateSessionRequest): Promise<Session> => {
    return apiCall<Session>(api.post<ApiResult<Session>>('/admin/sessions', data));
  },

  updateSession: async (id: string, data: UpdateSessionRequest): Promise<Session> => {
    return apiCall<Session>(api.put<ApiResult<Session>>(`/admin/sessions/${id}`, data));
  },

  updateSessionStatus: async (id: string, status: SessionStatus): Promise<Session> => {
    return apiCall<Session>(api.patch<ApiResult<Session>>(`/admin/sessions/${id}/status`, { status }));
  },

  deleteSession: async (id: string): Promise<void> => {
    await api.delete(`/admin/sessions/${id}`);
  },

  // Users
  getUsers: async (page = 0, size = 10, search?: string): Promise<PaginatedResponse<AdminUser>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) {
      params.append('search', search);
    }
    return apiCall<PaginatedResponse<AdminUser>>(
      api.get<ApiResult<PaginatedResponse<AdminUser>>>(`/admin/users?${params}`)
    );
  },

  getUser: async (id: string): Promise<AdminUser> => {
    return apiCall<AdminUser>(api.get<ApiResult<AdminUser>>(`/admin/users/${id}`));
  },

  updateUserRole: async (id: string, role: Role): Promise<AdminUser> => {
    return apiCall<AdminUser>(api.patch<ApiResult<AdminUser>>(`/admin/users/${id}/role`, { role }));
  },

  updateUserStatus: async (id: string, active: boolean): Promise<AdminUser> => {
    return apiCall<AdminUser>(api.patch<ApiResult<AdminUser>>(`/admin/users/${id}/status`, { active }));
  },

  // Email
  sendEmail: async (subject: string, body: string, userIds?: string[]): Promise<{ message: string; recipientCount: number }> => {
    return apiCall<{ message: string; recipientCount: number }>(
      api.post<ApiResult<{ message: string; recipientCount: number }>>('/admin/email/send', {
        subject,
        body,
        userIds: userIds || null,
      })
    );
  },

  scheduleEmail: async (subject: string, body: string, scheduledAt: string, userIds?: string[]): Promise<ScheduledEmailResponse> => {
    return apiCall<ScheduledEmailResponse>(
      api.post<ApiResult<ScheduledEmailResponse>>('/admin/email/schedule', {
        subject,
        body,
        scheduledAt,
        userIds: userIds || null,
      })
    );
  },

  getScheduledEmails: async (): Promise<ScheduledEmailResponse[]> => {
    return apiCall<ScheduledEmailResponse[]>(
      api.get<ApiResult<ScheduledEmailResponse[]>>('/admin/email/scheduled')
    );
  },

  cancelScheduledEmail: async (id: string): Promise<void> => {
    await apiCall<void>(api.delete<ApiResult<void>>(`/admin/email/scheduled/${id}`));
  },

  // Payments
  getPayments: async (page = 0, size = 20, statuses?: PaymentStatus[]): Promise<PaginatedResponse<AdminPurchase>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (statuses && statuses.length > 0) {
      statuses.forEach(status => params.append('status', status));
    }
    return apiCall<PaginatedResponse<AdminPurchase>>(
      api.get<ApiResult<PaginatedResponse<AdminPurchase>>>(`/admin/payments?${params}`)
    );
  },

  // Settings
  getFreeModeStatus: async (): Promise<FreeModeStatus> => {
    return apiCall<FreeModeStatus>(api.get<ApiResult<FreeModeStatus>>('/admin/settings/free-mode'));
  },

  updateFreeMode: async (enabled: boolean, message?: string): Promise<FreeModeStatus> => {
    return apiCall<FreeModeStatus>(
      api.put<ApiResult<FreeModeStatus>>('/admin/settings/free-mode', { enabled, message })
    );
  },

  getAllSettings: async (): Promise<ApplicationSetting[]> => {
    return apiCall<ApplicationSetting[]>(api.get<ApiResult<ApplicationSetting[]>>('/admin/settings'));
  },
};
