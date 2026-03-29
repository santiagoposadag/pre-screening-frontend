import api from './api'

const CANDIDATE_TOKEN_KEY = 'candidate_token'

function _headers() {
  const token = sessionStorage.getItem(CANDIDATE_TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const trainingService = {
  // ── Admin: Programs ─────────────────────────────────────────────────────
  getPrograms: () => api.get('/training/programs').then(r => r.data),
  getProgram: (id) => api.get(`/training/programs/${id}`).then(r => r.data),
  createProgram: (data) => api.post('/training/programs', data).then(r => r.data),
  updateProgram: (id, data) => api.put(`/training/programs/${id}`, data).then(r => r.data),
  deleteProgram: (id) => api.delete(`/training/programs/${id}`),

  // ── Admin: Topics ───────────────────────────────────────────────────────
  getTopics: (programId) => api.get(`/training/programs/${programId}/topics`).then(r => r.data),
  createTopic: (programId, data) => api.post(`/training/programs/${programId}/topics`, data).then(r => r.data),
  updateTopic: (topicId, data) => api.put(`/training/topics/${topicId}`, data).then(r => r.data),
  deleteTopic: (topicId) => api.delete(`/training/topics/${topicId}`),
  addQuestion: (topicId, data) => api.post(`/training/topics/${topicId}/questions`, data).then(r => r.data),
  updateQuestion: (questionId, data) => api.put(`/training/questions/${questionId}`, data).then(r => r.data),
  deleteQuestion: (questionId) => api.delete(`/training/questions/${questionId}`),

  // ── Admin: AI Generation ────────────────────────────────────────────────
  generateProgram: (data) => api.post('/training/generate', data).then(r => r.data),
  regenerateParts: (threadId, data) => api.post(`/training/generate/${threadId}/regenerate`, data).then(r => r.data),
  approveGeneration: (threadId) => api.post(`/training/generate/${threadId}/approve`).then(r => r.data),

  // ── Admin: Invitations ──────────────────────────────────────────────────
  getInvitations: (params) => api.get('/training/invitations', { params }).then(r => r.data),
  createInvitation: (data) => api.post('/training/invitations', data).then(r => r.data),
  createInvitationsBulk: (data) => api.post('/training/invitations/bulk', data).then(r => r.data),
  cancelInvitation: (id) => api.delete(`/training/invitations/${id}`),

  // ── Admin: Sessions ─────────────────────────────────────────────────────
  getSessions: (params) => api.get('/training/sessions', { params }).then(r => r.data),
  getSession: (id) => api.get(`/training/sessions/${id}`).then(r => r.data),
  evaluateSession: (id) => api.post(`/training/sessions/${id}/evaluate`).then(r => r.data),
  getEvaluation: (id) => api.get(`/training/sessions/${id}/evaluation`).then(r => r.data),

  // ── Student Portal (uses candidate token) ───────────────────────────────
  getStudentInvitations: () =>
    api.get('/training/portal/invitations', { headers: _headers() }).then(r => r.data),

  startSession: (invitationId) =>
    api.post(`/training/portal/invitations/${invitationId}/start`, {}, { headers: _headers() }).then(r => r.data),

  getProgress: (sessionId) =>
    api.get(`/training/portal/sessions/${sessionId}/progress`, { headers: _headers() }).then(r => r.data),

  submitAnswer: (sessionId, topicId, questionId, videoBlob) => {
    const formData = new FormData()
    formData.append('topic_id', topicId)
    formData.append('question_id', questionId)
    if (videoBlob) {
      formData.append('video', videoBlob, `q${questionId}.webm`)
    }
    return api.post(`/training/portal/sessions/${sessionId}/answer`, formData, {
      headers: { ..._headers(), 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  completeSession: (sessionId) =>
    api.post(`/training/portal/sessions/${sessionId}/complete`, {}, { headers: _headers() }).then(r => r.data),
}

export default trainingService
