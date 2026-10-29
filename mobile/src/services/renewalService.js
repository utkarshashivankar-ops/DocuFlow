import api from './api';

export const renewalService = {
  overview: () => api.get('/renewals').then((r) => r.data),
  forDocument: (documentId) => api.get(`/renewals/document/${documentId}`).then((r) => r.data.renewal),
  update: (id, body) => api.put(`/renewals/${id}`, body).then((r) => r.data.renewal),
};
