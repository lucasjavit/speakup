import api from '@/lib/axios';

interface TopicResponse {
  topic: string;
}

export const topicService = {
  /**
   * Get a random conversation topic from the backend.
   * This endpoint is public and doesn't require authentication.
   */
  async getRandomTopic(): Promise<string> {
    const response = await api.get<{ data: TopicResponse }>('/public/topics/random');
    return response.data.data.topic;
  },
};
