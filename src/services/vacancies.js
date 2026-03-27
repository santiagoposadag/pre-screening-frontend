import api from './api'

export const vacanciesService = {
  getAll: () => api.get('/vacancies/').then((r) => r.data),

  getPublic: () => api.get('/vacancies/public').then((r) => r.data),

  getById: (id) => api.get(`/vacancies/${id}`).then((r) => r.data),

  create: (data) => api.post('/vacancies/', data).then((r) => r.data),

  update: (id, data) => api.put(`/vacancies/${id}`, data).then((r) => r.data),

  delete: (id) => api.delete(`/vacancies/${id}`),

  generateVacancy: (data) => api.post('/vacancies/generate', data).then((r) => r.data),

  regenerateVacancyParts: (threadId, data) =>
    api.post(`/vacancies/generate/${threadId}/regenerate`, data).then((r) => r.data),

  approveVacancy: (threadId) =>
    api.post(`/vacancies/generate/${threadId}/approve`).then((r) => r.data),
}
