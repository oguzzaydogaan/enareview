import api from './api';

export const productService = {
  getProducts: (page: number = 1, pageSize: number = 10, search?: string, sortBy?: string, categoryId?: number) => {
    return api.get(`/api/products`, { params: { page, pageSize, search: search || undefined, sortBy: sortBy || undefined, categoryId: categoryId || undefined } });
  },
  getProductById: (id: number) => {
    return api.get(`/api/products/${id}`);
  },
  createProduct: (data: { name: string; description: string; categoryId: number; image?: any }) => {
    const formData = new FormData();
    formData.append('Name', data.name);
    formData.append('Description', data.description);
    formData.append('CategoryId', data.categoryId.toString());
    if (data.image) {
      formData.append('Image', data.image);
    }
    return api.post('/api/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  toggleLike: (id: number) => {
    return api.post(`/api/products/${id}/like`);
  },
  toggleDislike: (id: number) => {
    return api.post(`/api/products/${id}/dislike`);
  }
};
