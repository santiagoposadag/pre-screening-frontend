const STORAGE_KEY = 'admin_auth'

const CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
}

export const authService = {
  login(username, password) {
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      sessionStorage.setItem(STORAGE_KEY, 'true')
      return { success: true }
    }
    return { success: false, error: 'Credenciales incorrectas' }
  },

  logout() {
    sessionStorage.removeItem(STORAGE_KEY)
  },

  isAuthenticated() {
    return sessionStorage.getItem(STORAGE_KEY) === 'true'
  },
}
