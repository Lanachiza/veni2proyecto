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
  const [loading, setLoading] = useState(true)
  const lastTrip = trips?.[0]

  useEffect(() => {
    async function fetchData() {
      try {
        const [mRes, tRes] = await Promise.all([
          api.get('/metrics/summary'),
          api.get('/trips')
        ])
        setMetrics(mRes.data || { users: 0, trips: 0 })
        setTrips(Array.isArray(tRes.data) ? tRes.data : [])
      } catch (err) {
        console.error('Error loading dashboard', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="page-bg">
      <main className="dash-layout">
        <section className="dash-left">
          <div className="dash-card dash-map-card">
            <h2 className="dash-title">Next ride</h2>
            <div className="dash-map">
              {lastTrip ? (
                <MapView
                  origin={{ lat: lastTrip?.origin?.[0], lng: lastTrip?.origin?.[1] }}
                  destination={{ lat: lastTrip?.destination?.[0], lng: lastTrip?.destination?.[1] }}
                />
              ) : (
                <p className="map-text">No trips yet. Request your first ride.</p>
              )}
            </div>
            <Link to="/new-trip" className="primary-cta">
              Request ride
            </Link>
          </div>

          <div className="dash-metrics">
            <div className="metric-card">
              <span className="metric-label">Users</span>
              <span className="metric-value">{metrics.users}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Trips</span>
              <span className="metric-value">{metrics.trips}</span>
            </div>
          </div>
        </section>

        <section className="dash-right">
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-title">Notifications</h2>
              <span className="badge">New</span>
            </div>

            {loading && <p className="dash-muted">Loading...</p>}

            {!loading && trips.length === 0 && (
              <p className="dash-muted">No trips yet. Request your first ride.</p>
            )}

            <ul className="notif-list">
              {trips.map((trip) => (
                <li key={trip.id} className="notif-item">
                  <div className="notif-icon">🔔</div>
                  <div className="notif-body">
                    <p className="notif-title">Trip {trip.status?.toUpperCase() || 'CREATED'}</p>
                    <p className="notif-sub">
                      From ITESO sector ·{' '}
                      {trip.created_at ? new Date(trip.created_at).toLocaleString() : 'just now'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {trips.length > 0 && (
              <button className="clear-btn" type="button" onClick={() => setTrips([])}>
                Clear all
              </button>
            )}
          </div>

          <div className="dash-card">
            <h2 className="dash-title">Your profile</h2>
            {user && <UserCard user={user} />}
          </div>
        </section>
      </main>
    </div>
  )
}
