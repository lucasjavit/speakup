import api from '@/lib/axios';
import type {
  Conversation,
  UserStats,
  EndConversationRequest,
} from '@/types';

interface PaginatedConversations {
  content: Conversation[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const conversationService = {
  // Get paginated conversations for current user
  getConversations: async (page = 0, size = 20): Promise<PaginatedConversations> => {
    const response = await api.get<PaginatedConversations>('/conversations', {
      params: { page, size },
    });
    return response.data;
  },

  // Get a specific conversation
  getConversation: async (id: string): Promise<Conversation> => {
    const response = await api.get<Conversation>(`/conversations/${id}`);
    return response.data;
  },

  // Get active conversation for current user
  getActiveConversation: async (): Promise<Conversation | null> => {
    try {
      const response = await api.get<Conversation>('/conversations/active');
      return response.data;
    } catch (error) {
      // 204 No Content means no active conversation
      return null;
    }
  },

  // Mark conversation as started (WebRTC connected)
  startConversation: async (id: string): Promise<void> => {
    await api.post(`/conversations/${id}/start`);
  },

  // End a conversation
  endConversation: async (id: string, completed: boolean): Promise<void> => {
    const request: EndConversationRequest = { completed };
    await api.post(`/conversations/${id}/end`, request);
  },

  // Get user statistics
  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get<UserStats>('/conversations/stats');
    return response.data;
  },
};
