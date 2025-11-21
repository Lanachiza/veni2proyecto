// web/src/components/MapView.jsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function normalizePoint(point) {
  if (!point) return null;
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

export default function MapView({ origin, destination, driverPosition }) {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const o = normalizePoint(origin);
    const d = normalizePoint(destination);
    const driver = normalizePoint(driverPosition);

    if (!mapContainerRef.current || !o || !d) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [(o.lng + d.lng) / 2, (o.lat + d.lat) / 2],
      zoom: 13,
    });

    map.on("load", async () => {
      try {
        const url =
          `https://api.mapbox.com/directions/v5/mapbox/driving/` +
          `${o.lng},${o.lat};${d.lng},${d.lat}` +
          `?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;

        const res = await fetch(url);
        const data = await res.json();
        const route = data.routes?.[0]?.geometry;
        if (!route) return;

        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: route,
          },
        });

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-width": 5,
            "line-color": "#0ea5e9",
          },
        });

        new mapboxgl.Marker({ color: "#10b981" })
          .setLngLat([o.lng, o.lat])
          .addTo(map);

        new mapboxgl.Marker({ color: "#ef4444" })
          .setLngLat([d.lng, d.lat])
          .addTo(map);

        if (driver) {
          new mapboxgl.Marker({ color: "#2563eb" })
            .setLngLat([driver.lng, driver.lat])
            .addTo(map);
        }

        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([o.lng, o.lat]);
        bounds.extend([d.lng, d.lat]);
        if (driver) bounds.extend([driver.lng, driver.lat]);
        map.fitBounds(bounds, { padding: 40 });
      } catch (err) {
        console.error("Error cargando ruta Mapbox", err);
      }
    });

    return () => map.remove();
  }, [origin, destination, driverPosition]);

  return <div className="mapbox-container" ref={mapContainerRef} />;
}