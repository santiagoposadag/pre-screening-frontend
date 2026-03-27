import api from './api'

export const questionsService = {
  getAll: (vacancyId) => {
    const params = vacancyId ? { vacancy_id: vacancyId } : {}
    return api.get('/questions/', { params }).then((r) => r.data)
  },

  getInterview: (vacancyId) =>
    api.get('/questions/interview', { params: { vacancy_id: vacancyId } }).then((r) => r.data),

  create: (data) => api.post('/questions/', data).then((r) => r.data),

  update: (id, data) => api.put(`/questions/${id}`, data).then((r) => r.data),

  delete: (id) => api.delete(`/questions/${id}`),
}
