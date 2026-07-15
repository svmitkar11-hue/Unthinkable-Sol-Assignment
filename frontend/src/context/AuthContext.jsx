import { createContext, useContext, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  function persist(token, user) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    persist(data.token, data.user)
    return data.user
  }

  // Register no longer logs in — it triggers OTP verification.
  async function register(payload) {
    const { data } = await api.post('/auth/register', payload)
    return data // { email, requiresVerification, message }
  }

  async function verifyOtp(email, otp) {
    const { data } = await api.post('/auth/verify-otp', { email, otp })
    persist(data.token, data.user)
    return data.user
  }

  async function resendOtp(email) {
    const { data } = await api.post('/auth/resend-otp', { email })
    return data
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = { user, login, register, verifyOtp, resendOtp, logout, isAdmin: user?.role === 'ADMIN' }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
