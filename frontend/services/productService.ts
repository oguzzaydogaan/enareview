import api from './api';

export const productService = {
  getProducts: (page: number = 1, pageSize: number = 10) => {
    return api.get(`/api/products`, { params: { page, pageSize } });
  },
  getProductById: (id: number) => {
    return api.get(`/api/products/${id}`);
  },
  toggleLike: (id: number) => {
    return api.post(`/api/products/${id}/like`);
  },
  toggleDislike: (id: number) => {
    return api.post(`/api/products/${id}/dislike`);
  }
};
