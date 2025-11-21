import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export default function MapView({ origin, destination }) {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!origin || !destination || !mapRef.current) return

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [(origin.lng + destination.lng) / 2, (origin.lat + destination.lat) / 2],
      zoom: 13
    })

    new mapboxgl.Marker({ color: '#10b981' }).setLngLat([origin.lng, origin.lat]).addTo(map)
    new mapboxgl.Marker({ color: '#ef4444' }).setLngLat([destination.lng, destination.lat]).addTo(map)

    const bounds = new mapboxgl.LngLatBounds()
    bounds.extend([origin.lng, origin.lat])
    bounds.extend([destination.lng, destination.lat])
    map.fitBounds(bounds, { padding: 40 })

    return () => map.remove()
  }, [origin, destination])

  return <div className="mapbox-container" ref={mapRef} />
}
