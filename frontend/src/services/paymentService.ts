import api, { apiCall } from '@/lib/axios';
import type { ProductList, Purchase, CheckoutResponse } from '@/types';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const paymentService = {
  /**
   * Get all available products.
   */
  getProducts: async (): Promise<ProductList> => {
    return apiCall(api.get('/products'));
  },

  /**
   * Create a checkout session for a product.
   */
  createCheckout: async (productType: string): Promise<CheckoutResponse> => {
    return apiCall(api.post('/purchases/checkout', { productType }));
  },

  /**
   * Get purchase history.
   */
  getPurchaseHistory: async (
    page = 0,
    size = 20
  ): Promise<PageResponse<Purchase>> => {
    return apiCall(api.get(`/purchases?page=${page}&size=${size}`));
  },

  /**
   * Get purchase by Stripe session ID.
   */
  getPurchaseBySessionId: async (sessionId: string): Promise<Purchase> => {
    return apiCall(api.get(`/purchases/session?sessionId=${sessionId}`));
  },
};
