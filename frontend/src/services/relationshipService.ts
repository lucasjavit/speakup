import api from '@/lib/axios';
import type { FavoriteUser, BlockUserRequest, RelationshipResponse } from '@/types';

export const relationshipService = {
  /**
   * Block a user.
   */
  blockUser: async (request: BlockUserRequest): Promise<RelationshipResponse> => {
    const response = await api.post<RelationshipResponse>('/relationships/block', request);
    return response.data;
  },

  /**
   * Unblock a user.
   */
  unblockUser: async (userId: string): Promise<void> => {
    await api.delete(`/relationships/block/${userId}`);
  },

  /**
   * Get all favorites for the current user.
   */
  getFavorites: async (): Promise<FavoriteUser[]> => {
    const response = await api.get<FavoriteUser[]>('/relationships/favorites');
    return response.data;
  },

  /**
   * Get mutual favorites (both users favorited each other).
   */
  getMutualFavorites: async (): Promise<FavoriteUser[]> => {
    const response = await api.get<FavoriteUser[]>('/relationships/favorites/mutual');
    return response.data;
  },

  /**
   * Remove a user from favorites.
   */
  removeFavorite: async (userId: string): Promise<void> => {
    await api.delete(`/relationships/favorites/${userId}`);
  },

  /**
   * Check if user is blocked (either direction).
   */
  isBlocked: async (userId: string): Promise<boolean> => {
    const response = await api.get<boolean>(`/relationships/blocked/${userId}`);
    return response.data;
  },
};
