import api from './api'

const authService = {
  async login(email, password) {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)

    const response = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    sessionStorage.setItem('access_token', response.data.access_token)
    return response.data
  },

  logout() {
    sessionStorage.removeItem('access_token')
  },

  isAuthenticated() {
    return !!sessionStorage.getItem('access_token')
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },
}

export default authService
