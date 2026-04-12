import api from "./api";

export const reviewService = {
  getReviews: (productId: number) => {
    return api.get(`/api/products/${productId}/reviews`);
  },
  createReview: (
    productId: number,
    data: { rating: number; content: string },
  ) => {
    return api.post(`/api/products/${productId}/reviews`, data);
  },
  deleteReview: (productId: number, id: number) => {
    return api.delete(`/api/products/${productId}/reviews/${id}`);
  },
};
