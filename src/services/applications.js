import api from './api'

export const applicationsService = {
  getAll: () => api.get('/applications/').then((r) => r.data),

  submit: (formData) =>
    api.post('/applications/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
}
