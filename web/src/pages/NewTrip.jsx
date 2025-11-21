import { useState } from 'react'
import client from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const PRESET_ROUTES = {
  'Sector 1 - Sur ITESO': {
    origin: { lat: 20.609, lng: -103.415 },
    destination: { lat: 20.6105, lng: -103.408 }
  },
  'Sector 2 - Norte ITESO': {
    origin: { lat: 20.614, lng: -103.410 },
    destination: { lat: 20.618, lng: -103.404 }
  },
  'Sector 3 - Periférico': {
    origin: { lat: 20.605, lng: -103.420 },
    destination: { lat: 20.615, lng: -103.420 }
  }
}

export default function NewTrip() {
  const { user } = useAuth()
  const [sector, setSector] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    if (!sector) return
    const route = PRESET_ROUTES[sector]
    if (!route) return
    try {
      setLoading(true)
      const body = {
        origin: route.origin,
        destination: route.destination,
        user_id: user?.id || 'web-user'
      }
      await client.post('/trips', body)
      setMessage('Viaje solicitado correctamente ✅')
    } catch (err) {
      setMessage('No se pudo solicitar el viaje 😢')
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
        <div className="request-card">
          <h2 className="request-title">Solicitar viaje</h2>

          <form onSubmit={onSubmit} className="request-form">
            <label className="auth-label">
              Sector
              <select
                className="auth-input"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                required
              >
                <option value="">Selecciona un sector</option>
                {Object.keys(PRESET_ROUTES).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <div className="map-placeholder">
              <p className="map-text">
                Mapa de ruta para: {sector || 'selecciona un sector para ver la ruta'}
              </p>
            </div>

            {message && <p className="request-message">{message}</p>}

            <button type="submit" className="request-button" disabled={loading}>
              {loading ? 'Solicitando...' : 'Solicitar'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
