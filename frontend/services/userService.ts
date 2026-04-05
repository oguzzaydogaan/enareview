import api from './api';

export interface LoginParams {
  usernameOrEmail: string;
  password?: string;
}

export interface SignupParams {
  Username: string;
  Email: string;
  Password?: string;
  PhoneNumber: string;
  FirebaseToken: string;
}

export const userService = {
  login: async (data: LoginParams) => {
    return api.post('/api/users/login', data);
  },
  signup: async (data: SignupParams) => {
    return api.post('/api/users/signup', data);
  },
  refresh: async () => {
    return api.get('/api/users/refresh');
  }
};
