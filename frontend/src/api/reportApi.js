import axiosClient from './axiosClient.js';

export const reportApi = {
  generateReport: async (data) => {
    const res = await axiosClient.post('/reports/generate', data);
    return res.data;
  },
  getReports: async (projectId) => {
    const params = projectId ? { projectId } : {};
    const res = await axiosClient.get('/reports', { params });
    return res.data;
  },
  getReportById: async (id) => {
    const res = await axiosClient.get(`/reports/${id}`);
    return res.data;
  },
  updateReport: async (id, data) => {
    const res = await axiosClient.patch(`/reports/${id}`, data);
    return res.data;
  },
  deleteReport: async (id) => {
    const res = await axiosClient.delete(`/reports/${id}`);
    return res.data;
  },
  exportReportMarkdown: async (id) => {
    const res = await axiosClient.get(`/reports/${id}/export?format=markdown`, {
      responseType: 'text'
    });
    return res.data;
  }
};

