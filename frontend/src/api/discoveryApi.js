import axiosClient from './axiosClient.js';

export const discoveryApi = {
  analyzeProject: async (data) => {
    const res = await axiosClient.post('/discovery/analyze', data);
    return res.data;
  },
  getProjectDiscovery: async (projectId) => {
    const res = await axiosClient.get(`/discovery/${projectId}`);
    return res.data;
  }
};

