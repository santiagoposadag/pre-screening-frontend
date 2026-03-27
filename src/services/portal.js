import api from './api'

const CANDIDATE_TOKEN_KEY = 'candidate_token'

export const portalService = {
  // ── OTP ──────────────────────────────────────────────────────────────────────
  requestOtp: (email) =>
    api.post('/otp/request', { email }).then((r) => r.data),

  verifyOtp: (email, code) =>
    api.post('/otp/verify', { email, code }).then((r) => {
      sessionStorage.setItem(CANDIDATE_TOKEN_KEY, r.data.access_token)
      return r.data
    }),

  // ── Token management ─────────────────────────────────────────────────────────
  getToken: () => sessionStorage.getItem(CANDIDATE_TOKEN_KEY),

  isAuthenticated: () => !!sessionStorage.getItem(CANDIDATE_TOKEN_KEY),

  logout: () => sessionStorage.removeItem(CANDIDATE_TOKEN_KEY),

  // ── Portal endpoints (need candidate token) ─────────────────────────────────
  _headers() {
    const token = sessionStorage.getItem(CANDIDATE_TOKEN_KEY)
    return token ? { Authorization: `Bearer ${token}` } : {}
  },

  getInvitations: () =>
    api.get('/portal/invitations', { headers: portalService._headers() }).then((r) => r.data),

  startInterview: (invitationId) =>
    api.post(`/portal/invitations/${invitationId}/start`, {}, { headers: portalService._headers() }).then((r) => r.data),

  submitAnswer: (invitationId, questionId, videoBlob) => {
    const formData = new FormData()
    formData.append('question_id', questionId)
    if (videoBlob) {
      formData.append('video', videoBlob, `q${questionId}.webm`)
    }
    return api.post(`/portal/invitations/${invitationId}/answer`, formData, {
      headers: { ...portalService._headers(), 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  completeInterview: (invitationId) =>
    api.post(`/portal/invitations/${invitationId}/complete`, {}, { headers: portalService._headers() }).then((r) => r.data),
}
