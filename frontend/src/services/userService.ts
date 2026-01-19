import api, { apiCall } from '@/lib/axios';
import type {
  User,
  CompleteProfileRequest,
  ApiResult,
  ConsentType,
  UserConsent,
  ConsentRequest,
  UserDataExport
} from '@/types';

export const userService = {
  getUser: async (id: string): Promise<User> => {
    return apiCall<User>(api.get<ApiResult<User>>(`/users/${id}`));
  },

  getCurrentUser: async (): Promise<User> => {
    return apiCall<User>(api.get<ApiResult<User>>('/users/me'));
  },

  completeProfile: async (id: string, data: CompleteProfileRequest): Promise<User> => {
    return apiCall<User>(api.put<ApiResult<User>>(`/users/${id}/profile`, data));
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    return apiCall<User>(api.patch<ApiResult<User>>(`/users/${id}`, data));
  },

  // ==================== GDPR/LGPD Methods ====================

  /**
   * Export all user data (GDPR Right to Data Portability)
   */
  exportMyData: async (): Promise<UserDataExport> => {
    return apiCall<UserDataExport>(api.get<ApiResult<UserDataExport>>('/users/me/export'));
  },

  /**
   * Delete user account and all data (GDPR Right to Erasure)
   */
  deleteMyAccount: async (): Promise<void> => {
    await api.delete('/users/me');
  },

  /**
   * Get all user consents
   */
  getMyConsents: async (): Promise<UserConsent[]> => {
    return apiCall<UserConsent[]>(api.get<ApiResult<UserConsent[]>>('/users/me/consents'));
  },

  /**
   * Grant consent for a specific type of data processing
   */
  grantConsent: async (consentType: ConsentType): Promise<UserConsent> => {
    const request: ConsentRequest = { consentType };
    return apiCall<UserConsent>(api.post<ApiResult<UserConsent>>('/users/me/consents', request));
  },

  /**
   * Withdraw previously given consent
   */
  withdrawConsent: async (consentType: ConsentType): Promise<void> => {
    await api.delete(`/users/me/consents/${consentType}`);
  },
};
