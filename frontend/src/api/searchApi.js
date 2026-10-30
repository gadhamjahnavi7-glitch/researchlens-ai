import axiosClient from './axiosClient.js';

export const searchApi = {
  search: async (query, projectId, documentId) => {
    const params = { q: query };
    if (projectId) params.projectId = projectId;
    if (documentId) params.documentId = documentId;
    const res = await axiosClient.get('/search', { params });
    return res.data;
  }
};

