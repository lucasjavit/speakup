import api, { apiCall } from '@/lib/axios';
import type { User, CompleteProfileRequest, ApiResult } from '@/types';

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
};
