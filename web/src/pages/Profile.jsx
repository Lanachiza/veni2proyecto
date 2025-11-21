import { useEffect, useState } from 'react'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import UserCard from '../components/UserCard.jsx'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [remoteUser, setRemoteUser] = useState(user)
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', password: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchMe() {
      try {
        const { data } = await api.get('/users/me')
        setRemoteUser(data.user)
        setForm((prev) => ({ ...prev, name: data.user.name, email: data.user.email }))
      } catch (err) {
        // silent
      }
    }
    fetchMe()
  }, [])

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      setLoading(true)
      const payload = { name: form.name, email: form.email }
      if (form.password) payload.password = form.password
      const { data } = await api.patch('/users/me', payload)
      setRemoteUser(data.user)
      setUser?.(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      setMessage('Perfil actualizado ✅')
      setForm((prev) => ({ ...prev, password: '' }))
    } catch (err) {
      setError('No se pudo actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-bg">
      <header className="page-header">
        <h1 className="brand-title">
          VENI <span>2</span>
        </h1>
      </header>

      <main className="request-container">
        <div className="request-card" style={{ maxWidth: 520 }}>
          <h2 className="request-title">Perfil</h2>
          {remoteUser && (
            <div style={{ marginBottom: 16 }}>
              <UserCard user={remoteUser} />
            </div>
          )}

          <form className="auth-form" onSubmit={onSubmit}>
            <label className="auth-label">
              Nombre
              <input
                className="auth-input"
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                required
              />
            </label>
            <label className="auth-label">
              Correo
              <input
                className="auth-input"
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
              />
            </label>
            <label className="auth-label">
              Nueva contraseña (opcional)
              <input
                className="auth-input"
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="••••••••"
              />
            </label>

            {error && <p className="auth-error">{error}</p>}
            {message && <p className="request-message">{message}</p>}

            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
