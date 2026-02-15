import api from '@/lib/axios';
import type { Rating, SubmitRatingRequest } from '@/types';

export const ratingService = {
  /**
   * Submit a rating for a conversation.
   */
  submitRating: async (request: SubmitRatingRequest): Promise<Rating> => {
    const response = await api.post<Rating>('/ratings', request);
    return response.data;
  },

  /**
   * Get rating for a specific conversation.
   * Backend returns 200 with no body when no rating exists.
   */
  getRatingForConversation: async (conversationId: string): Promise<Rating | null> => {
    try {
      const response = await api.get<Rating | null>(`/ratings/conversation/${conversationId}`);
      return response.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Check if user has already rated a conversation.
   */
  hasUserRated: async (conversationId: string): Promise<boolean> => {
    const response = await api.get<boolean>(`/ratings/conversation/${conversationId}/exists`);
    return response.data;
  },
};
