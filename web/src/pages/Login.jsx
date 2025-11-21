import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError('Email o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h1 className="auth-title">
          VENI <span>2</span>
        </h1>

        <div className="auth-illustration" aria-hidden="true">
          <div className="auth-illustration-circle" />
          <div className="auth-illustration-car" />
        </div>

        <h2 className="auth-subtitle">Log in</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="auth-input"
              required
            />
          </label>

          <label className="auth-label">
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="auth-input"
              required
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Entrando...' : 'Log in'}
          </button>
        </form>

        <button className="auth-link-button" type="button">
          Forgot password?
        </button>

        <p className="auth-footer-text">
          Don't have an account?{' '}
          <Link to="/register" className="auth-footer-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
