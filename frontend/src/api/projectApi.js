import axiosClient from './axiosClient.js';

export const projectApi = {
  getProjects: async () => {
    const res = await axiosClient.get('/projects');
    return res.data;
  },
  getProjectById: async (id) => {
    const res = await axiosClient.get(`/projects/${id}`);
    return res.data;
  },
  createProject: async (data) => {
    const res = await axiosClient.post('/projects', data);
    return res.data;
  },
  updateProject: async (id, data) => {
    const res = await axiosClient.patch(`/projects/${id}`, data);
    return res.data;
  },
  deleteProject: async (id) => {
    const res = await axiosClient.delete(`/projects/${id}`);
    return res.data;
  },
  seedSample: async () => {
    const res = await axiosClient.post('/projects/seed-sample');
    return res.data;
  },
  getActivities: async (projectId) => {
    const params = projectId ? { projectId } : {};
    const res = await axiosClient.get('/projects/activities', { params });
    return res.data;
  }
};

