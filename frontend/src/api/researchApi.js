import axiosClient from './axiosClient.js';

export const researchApi = {
  chat: async (data) => {
    const res = await axiosClient.post('/research/chat', data);
    return res.data;
  },
  getConversations: async (projectId) => {
    const params = projectId ? { projectId } : {};
    const res = await axiosClient.get('/research/conversations', { params });
    return res.data;
  },
  getConversationMessages: async (id) => {
    const res = await axiosClient.get(`/research/conversations/${id}`);
    return res.data;
  },
  deleteConversation: async (id) => {
    const res = await axiosClient.delete(`/research/conversations/${id}`);
    return res.data;
  },
  compareClaims: async (data) => {
    const res = await axiosClient.post('/research/compare-claims', data);
    return res.data;
  },
  getEvidence: async (projectId, conversationId) => {
    const params = { projectId };
    if (conversationId) params.conversationId = conversationId;
    const res = await axiosClient.get('/research/evidence', { params });
    return res.data;
  }
};

