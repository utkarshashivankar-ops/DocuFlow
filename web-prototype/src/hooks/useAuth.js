import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { setCredentials, logout as logoutAction } from '@/store/authSlice'
import toast from 'react-hot-toast'

export function useAuth() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((s) => s.auth)

  async function login(credentials) {
    try {
      const { user } = await authService.login(credentials)
      dispatch(setCredentials({ user }))
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/')
    } catch (e) {
      toast.error(e.message || 'Login failed')
      throw e
    }
  }

  async function register(payload) {
    try {
      const { user } = await authService.register(payload)
      dispatch(setCredentials({ user }))
      toast.success('Account created successfully!')
      navigate('/')
    } catch (e) {
      toast.error('Registration failed')
      throw e
    }
  }

  function logout() {
    authService.logout()
    dispatch(logoutAction())
    toast.success('Signed out')
    navigate('/login')
  }

  return { user, isAuthenticated, login, register, logout }
}
