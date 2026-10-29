import Cookies from 'js-cookie'

// Mocked auth service — replace with real axios calls to /api/auth/*
export const authService = {
  async login({ email, password }) {
    await new Promise((r) => setTimeout(r, 700))
    if (!email || !password) throw new Error('Invalid credentials')
    const token = 'mock-jwt-token'
    Cookies.set('docuflow_token', token, { expires: 7 })
    return { token, user: { id: 'u1', name: email.split('@')[0] || 'User', email } }
  },
  async register({ fullName, email, password }) {
    await new Promise((r) => setTimeout(r, 900))
    const token = 'mock-jwt-token'
    Cookies.set('docuflow_token', token, { expires: 7 })
    return { token, user: { id: 'u1', name: fullName, email } }
  },
  async forgotPassword({ email }) {
    await new Promise((r) => setTimeout(r, 700))
    return { message: `Reset link sent to ${email}` }
  },
  logout() {
    Cookies.remove('docuflow_token')
  },
}
