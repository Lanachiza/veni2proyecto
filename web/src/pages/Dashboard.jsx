import { useEffect, useState } from 'react'
import client from '../api/client.js'
import { io } from 'socket.io-client'

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null)
  const [events, setEvents] = useState([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let active = true
    client.get('/metrics/summary').then((res) => {
      if (active) setMetrics(res.data)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || ''
    const socket = io(base || undefined)
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('trip:created', (data) => {
      setEvents((prev) => [{ type: 'trip:created', data, ts: Date.now() }, ...prev].slice(0, 20))
    })
    return () => {
      socket.close()
    }
  }, [])

  return (
    <div className="grid">
      <div className="card">
        <h2>Resumen</h2>
        {!metrics && <div>Cargando...</div>}
        {metrics && (
          <div className="stats">
            <div>
              <div className="stat-label">Usuarios</div>
              <div className="stat-value">{metrics.users}</div>
            </div>
            <div>
              <div className="stat-label">Viajes</div>
              <div className="stat-value">{metrics.trips}</div>
            </div>
          </div>
        )}
      </div>
      <div className="card">
        <h2>Tiempo real</h2>
        <div className={connected ? 'badge ok' : 'badge'}>{connected ? 'Conectado' : 'Desconectado'}</div>
        <ul className="events">
          {events.map((e, i) => (
            <li key={i}>
              <span>{new Date(e.ts).toLocaleTimeString()}</span>
              <span>{e.type}</span>
              <span>{e.data.tripId}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

