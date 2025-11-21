import { createContext, useContext, useEffect, useState } from 'react'
import client from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Hidrata sesión desde localStorage
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)

  // Sincroniza header Authorization
  useEffect(() => {
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete client.defaults.headers.common['Authorization']
    }
  }, [token])

  const login = async (email, password) => {
    const res = await client.post('/login', { email, password })
    setUser(res.data.user)
    setToken(res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    localStorage.setItem('token', res.data.token)
  }

  const register = async (name, email, password) => {
    const res = await client.post('/register', { name, email, password })
    setUser(res.data.user)
    setToken(res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    localStorage.setItem('token', res.data.token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
