import api, { apiCall } from '@/lib/axios';
import type { ApiResult, Session } from '@/types';

/**
 * Public session service for regular users.
 * These endpoints don't require admin privileges.
 */
export const sessionService = {
  /**
   * Get all active sessions that users can join.
   */
  getActiveSessions: async (): Promise<Session[]> => {
    return apiCall<Session[]>(api.get<ApiResult<Session[]>>('/sessions/active'));
  },

  /**
   * Get sessions that are currently running (within their scheduled time).
   */
  getRunningSessions: async (): Promise<Session[]> => {
    return apiCall<Session[]>(api.get<ApiResult<Session[]>>('/sessions/running'));
  },

  /**
   * Get public running sessions (no authentication required).
   * Used for displaying sessions on the homepage before login.
   */
  getPublicRunningSessions: async (): Promise<Session[]> => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const response = await fetch(`${baseURL}/sessions/running`);
    if (!response.ok) {
      throw new Error('Failed to fetch public sessions');
    }
    const result = await response.json();
    return result.data || [];
  },
};
