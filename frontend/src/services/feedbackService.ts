import api, { apiCall } from '@/lib/axios';
import type { 
  Feedback, 
  FeedbackSummary, 
  CreateFeedbackRequest,
  UpdateFeedbackStatusRequest,
  UpdateAdminNotesRequest,
  FeedbackStats,
  FeedbackStatus,
  FeedbackType
} from '@/types';
import type { ApiResult } from '@/types/api';

interface PaginatedFeedbacks {
  content: FeedbackSummary[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const feedbackService = {
  /**
   * Create a new feedback.
   */
  createFeedback: async (request: CreateFeedbackRequest): Promise<Feedback> => {
    const response = await api.post<Feedback>('/feedbacks', request);
    return response.data;
  },

  /**
   * Get all feedbacks created by the authenticated user.
   */
  getUserFeedbacks: async (page = 0, size = 20): Promise<PaginatedFeedbacks> => {
    const response = await api.get<PaginatedFeedbacks>('/feedbacks/me', {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Get feedback by ID (user can only see their own).
   */
  getFeedback: async (id: string): Promise<Feedback> => {
    const response = await api.get<Feedback>(`/feedbacks/${id}`);
    return response.data;
  },

  // Admin methods
  
  /**
   * Get all feedbacks with optional filters (admin only).
   */
  getAllFeedbacks: async (
    page = 0,
    size = 20,
    status?: FeedbackStatus,
    type?: FeedbackType
  ): Promise<PaginatedFeedbacks> => {
    const params: any = { page, size };
    if (status) params.status = status;
    if (type) params.type = type;

    const response = await api.get<ApiResult<PaginatedFeedbacks>>('/admin/feedbacks', { params });
    return apiCall(Promise.resolve(response));
  },

  /**
   * Get feedback statistics (admin only).
   */
  getFeedbackStats: async (): Promise<FeedbackStats> => {
    const response = await api.get<ApiResult<FeedbackStats>>('/admin/feedbacks/stats');
    return apiCall(Promise.resolve(response));
  },

  /**
   * Get feedback details by ID (admin only).
   */
  getAdminFeedback: async (id: string): Promise<Feedback> => {
    const response = await api.get<ApiResult<Feedback>>(`/admin/feedbacks/${id}`);
    return apiCall(Promise.resolve(response));
  },

  /**
   * Update feedback status (admin only).
   */
  updateFeedbackStatus: async (
    id: string,
    request: UpdateFeedbackStatusRequest
  ): Promise<Feedback> => {
    const response = await api.patch<ApiResult<Feedback>>(
      `/admin/feedbacks/${id}/status`,
      request
    );
    return apiCall(Promise.resolve(response));
  },

  /**
   * Update admin notes (admin only).
   */
  updateAdminNotes: async (
    id: string,
    request: UpdateAdminNotesRequest
  ): Promise<Feedback> => {
    const response = await api.patch<ApiResult<Feedback>>(
      `/admin/feedbacks/${id}/notes`,
      request
    );
    return apiCall(Promise.resolve(response));
  },

  /**
   * Delete feedback (admin only).
   */
  deleteFeedback: async (id: string): Promise<void> => {
    await api.delete(`/admin/feedbacks/${id}`);
  },
};
