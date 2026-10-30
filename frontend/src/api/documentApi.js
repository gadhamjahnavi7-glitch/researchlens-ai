import axiosClient from './axiosClient.js';

export const documentApi = {
  getDocuments: async (projectId) => {
    const params = projectId ? { projectId } : {};
    const res = await axiosClient.get('/documents', { params });
    return res.data;
  },
  getDocumentById: async (id) => {
    const res = await axiosClient.get(`/documents/${id}`);
    return res.data;
  },
  getDocumentContent: async (id) => {
    const res = await axiosClient.get(`/documents/${id}/content`);
    return res.data;
  },
  uploadDocument: async (formData) => {
    const res = await axiosClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },
  deleteDocument: async (id) => {
    const res = await axiosClient.delete(`/documents/${id}`);
    return res.data;
  }
};

