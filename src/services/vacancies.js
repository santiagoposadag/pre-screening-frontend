import api from './api'

export const vacanciesService = {
  getAll: () => api.get('/vacancies/').then((r) => r.data),

  create: (data) => api.post('/vacancies/', data).then((r) => r.data),

  update: (id, data) => api.put(`/vacancies/${id}`, data).then((r) => r.data),

  delete: (id) => api.delete(`/vacancies/${id}`),
}
