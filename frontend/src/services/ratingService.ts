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
   */
  getRatingForConversation: async (conversationId: string): Promise<Rating | null> => {
    try {
      const response = await api.get<Rating>(`/ratings/conversation/${conversationId}`);
      return response.data;
    } catch (error) {
      // 404 means no rating exists
      return null;
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
