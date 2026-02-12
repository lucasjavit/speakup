import api, { apiCall } from '@/lib/axios';
import type { ApiResult } from '@/types';

/**
 * Call to mark the current user as "online".
 * Used for "Usuários logados" count. TTL 5 min on backend.
 */
export async function touchPresence(): Promise<void> {
  await api.get('/users/me/presence');
}

/**
 * Get count of users currently online (for user dashboard).
 */
export async function getOnlineCount(): Promise<number> {
  const data = await apiCall<{ onlineUsers: number }>(
    api.get<ApiResult<{ onlineUsers: number }>>('/presence/count')
  );
  return data.onlineUsers ?? 0;
}

/**
 * Remove current user from online count. Call on logout.
 */
export async function leavePresence(): Promise<void> {
  try {
    await api.delete('/users/me/presence');
  } catch {
    // ignore (e.g. token already invalid)
  }
}

export const presenceService = {
  touch: touchPresence,
  getOnlineCount,
  leave: leavePresence,
};
