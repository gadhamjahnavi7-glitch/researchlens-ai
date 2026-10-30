import axiosClient from './axiosClient.js';

export const authApi = {
  register: async (data) => {
    const res = await axiosClient.post('/auth/register', data);
    return res.data;
  },
  login: async (data) => {
    const res = await axiosClient.post('/auth/login', data);
    return res.data;
  },
  getMe: async () => {
    const res = await axiosClient.get('/auth/me');
    return res.data;
  },
  logout: async () => {
    const res = await axiosClient.post('/auth/logout');
    return res.data;
  }
};

