import api from './api';

export const categoryService = {
  getCategories: () => {
    return api.get('/api/categories');
  },
  createCategory: (name: string) => {
    return api.post('/api/categories', { name });
  }
};
