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
};
