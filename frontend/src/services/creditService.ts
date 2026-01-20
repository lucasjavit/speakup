import api, { apiCall } from '@/lib/axios';
import type { CreditWallet, CreditTransaction } from '@/types';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const creditService = {
  /**
   * Get current user's credit wallet.
   */
  getWallet: async (): Promise<CreditWallet> => {
    return apiCall(api.get('/credits'));
  },

  /**
   * Get transaction history.
   */
  getTransactionHistory: async (
    page = 0,
    size = 20,
    creditType?: 'SESSION' | 'CONVERSATION'
  ): Promise<PageResponse<CreditTransaction>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (creditType) {
      params.append('creditType', creditType);
    }
    return apiCall(api.get(`/credits/history?${params.toString()}`));
  },

  /**
   * Check if user can join a session.
   */
  canJoinSession: async (): Promise<boolean> => {
    return apiCall(api.get('/credits/can-join'));
  },

  /**
   * Check if free mode is enabled.
   */
  isFreeModeEnabled: async (): Promise<boolean> => {
    return apiCall(api.get('/credits/free-mode'));
  },
};
