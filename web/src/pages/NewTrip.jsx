import { useState } from 'react'
import client from '../api/client.js'

export default function NewTrip() {
  const [originLat, setOriginLat] = useState('')
  const [originLng, setOriginLng] = useState('')
  const [destLat, setDestLat] = useState('')
  const [destLng, setDestLng] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const origin = { lat: parseFloat(originLat), lng: parseFloat(originLng) }
      const destination = { lat: parseFloat(destLat), lng: parseFloat(destLng) }
      const res = await client.post('/trips', { origin, destination })
      setResult(res.data)
    } catch (err) {
      setError('No se pudo crear el viaje')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h1>Nuevo viaje</h1>
      <form onSubmit={onSubmit} className="grid2">
        <div>
          <label>Origen lat</label>
          <input type="number" step="any" value={originLat} onChange={(e) => setOriginLat(e.target.value)} required />
        </div>
        <div>
          <label>Origen lng</label>
          <input type="number" step="any" value={originLng} onChange={(e) => setOriginLng(e.target.value)} required />
        </div>
        <div>
          <label>Destino lat</label>
          <input type="number" step="any" value={destLat} onChange={(e) => setDestLat(e.target.value)} required />
        </div>
        <div>
          <label>Destino lng</label>
          <input type="number" step="any" value={destLng} onChange={(e) => setDestLng(e.target.value)} required />
        </div>
        {error && <div className="error full">{error}</div>}
        <button className="full" disabled={loading}>{loading ? 'Creando...' : 'Crear viaje'}</button>
      </form>
      {result && (
        <div className="result">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

