import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import UserCard from '../components/UserCard.jsx'
import MapView from '../components/MapView.jsx'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [metrics, setMetrics] = useState({ users: 0, trips: 0 })
  const [trips, setTrips] = useState([])
  const [availableTrips, setAvailableTrips] = useState([])
  const [activeTrip, setActiveTrip] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const lastTrip = trips?.[0]
  const statusMap = { pending: 'PENDIENTE', accepted: 'ACEPTADO', active: 'EN CURSO', completed: 'COMPLETADO' }
  const isDriver = user?.role === 'driver'

  const fetchTrips = async () => {
    const [mRes, tRes] = await Promise.all([
      api.get('/metrics/summary'),
      api.get('/trips')
    ])
    setMetrics(mRes.data || { users: 0, trips: 0 })
    setTrips(Array.isArray(tRes.data) ? tRes.data : [])
  }

  const reloadDriverData = async () => {
    if (!isDriver) return
    const [availableRes, myTripsRes] = await Promise.all([
      api.get('/driver/trips/available'),
      api.get('/trips/driver/me')
    ])
    setAvailableTrips(Array.isArray(availableRes.data) ? availableRes.data : [])
    const mine = Array.isArray(myTripsRes.data) ? myTripsRes.data : []
    const current = mine.find((t) => t.status !== 'completed' && t.status !== 'cancelled')
    setActiveTrip(current || null)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        await fetchTrips()
      } catch (err) {
        console.error('Error loading dashboard', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!isDriver) return
    reloadDriverData().catch((err) => console.error('Error cargando viajes disponibles', err))
  }, [isDriver])

  useEffect(() => {
    if (!activeTrip || !activeTrip.started_at || activeTrip.status !== 'in_progress') {
      setElapsed(0)
      return
    }
    const startMs = new Date(activeTrip.started_at).getTime()
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [activeTrip?.started_at, activeTrip?.status])

  const handleAccept = async (tripId) => {
    try {
      await api.patch(`/driver/trips/${tripId}/accept`)
      await reloadDriverData()
      await fetchTrips()
    } catch (err) {
      console.error('Error al aceptar viaje', err)
    }
  }

  const handleStart = async () => {
    if (!activeTrip) return
    try {
      await api.patch(`/driver/trips/${activeTrip.id}/start`)
      await reloadDriverData()
    } catch (err) {
      console.error('Error al iniciar viaje', err)
    }
  }

  const handleComplete = async () => {
    if (!activeTrip) return
    try {
      await api.patch(`/driver/trips/${activeTrip.id}/complete`)
      await reloadDriverData()
    } catch (err) {
      console.error('Error al completar viaje', err)
    }
  }

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const seconds = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="page-bg">
      <main className="dash-layout">
        <section className="dash-left">
          {!isDriver && (
            <div className="dash-card dash-map-card">
              <h2 className="dash-title">Próximo viaje</h2>
              <div className="dash-map">
                {lastTrip ? (
                  <MapView
                    origin={{ lat: lastTrip?.origin?.[0], lng: lastTrip?.origin?.[1] }}
                    destination={{ lat: lastTrip?.destination?.[0], lng: lastTrip?.destination?.[1] }}
                  />
                ) : (
                  <p className="map-text">Aún no tienes viajes. Solicita el primero.</p>
                )}
              </div>
              <Link to="/new-trip" className="primary-cta">
                Solicitar viaje
              </Link>
            </div>
          )}

          {isDriver && (
            <div className="dash-card dash-map-card">
              <h2 className="dash-title">Panel de conductor</h2>
              {activeTrip ? (
                <div className="driver-active-box">
                  <p className="notif-title">
                    Viaje {activeTrip.status === 'in_progress' ? 'EN CURSO' : 'ACEPTADO'}
                  </p>
                  <p className="notif-sub">
                    Desde sector ITESO ·{' '}
                    {activeTrip.created_at ? new Date(activeTrip.created_at).toLocaleString() : 'justo ahora'}
                  </p>
                  {activeTrip.status === 'accepted' && (
                    <button className="pill-btn" onClick={handleStart}>
                      Iniciar viaje
                    </button>
                  )}
                  {activeTrip.status === 'in_progress' && (
                    <div className="driver-timer-row">
                      <span className="timer-badge">
                        {minutes}:{seconds}
                      </span>
                      <button className="pill-btn danger" onClick={handleComplete}>
                        Terminar viaje
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="notif-sub">No tienes viajes activos.</p>
              )}

              <h3 className="driver-subtitle">Viajes pendientes</h3>
              {availableTrips.length === 0 && <p className="notif-sub">No hay viajes pendientes.</p>}
              {availableTrips.length > 0 && (
                <ul className="notif-list">
                  {availableTrips.map((trip) => (
                    <li key={trip.id} className="notif-item driver-trip-item">
                      <div className="notif-body">
                        <p className="notif-title">Viaje PENDIENTE</p>
                        <p className="notif-sub">
                          Desde sector ITESO ·{' '}
                          {trip.created_at ? new Date(trip.created_at).toLocaleString() : 'justo ahora'}
                        </p>
                      </div>
                      <button className="pill-btn" type="button" onClick={() => handleAccept(trip.id)}>
                        Aceptar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="dash-metrics">
            <div className="metric-card">
              <span className="metric-label">Usuarios</span>
              <span className="metric-value">{metrics.users}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Viajes</span>
              <span className="metric-value">{metrics.trips}</span>
            </div>
          </div>
        </section>

        <section className="dash-right">
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-title">Notificaciones</h2>
              <span className="badge">Nuevo</span>
            </div>

            {loading && <p className="dash-muted">Cargando...</p>}

            {!loading && trips.length === 0 && (
              <p className="dash-muted">Aún no tienes viajes. Solicita el primero.</p>
            )}

            <ul className="notif-list">
              {trips.map((trip) => (
                <li key={trip.id} className="notif-item">
                  <div className="notif-icon">🔔</div>
                  <div className="notif-body">
                    <p className="notif-title">Viaje {statusMap[trip.status] || trip.status?.toUpperCase() || 'PENDIENTE'}</p>
                    <p className="notif-sub">
                      Desde sector ITESO ·{' '}
                      {trip.created_at ? new Date(trip.created_at).toLocaleString() : 'justo ahora'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {trips.length > 0 && (
              <button className="clear-btn" type="button" onClick={() => setTrips([])}>
                Limpiar
              </button>
            )}
          </div>

          <div className="dash-card">
            <h2 className="dash-title">Tu perfil</h2>
            {user && <UserCard user={user} />}
          </div>
        </section>
      </main>
    </div>
  )
}
