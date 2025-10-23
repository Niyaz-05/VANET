import React, { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet'

function centerFromVehicles(vehicles) {
  if (!vehicles || vehicles.length === 0) return [37.7749, -122.4194]
  let lat = 0, lon = 0
  for (const v of vehicles) { lat += v.lat; lon += v.lon }
  return [lat / vehicles.length, lon / vehicles.length]
}

export default function VehicleMap({ vehicles }) {
  const center = useMemo(() => centerFromVehicles(vehicles), [vehicles])
  return (
    <div className="h-[480px] card">
      <MapContainer center={center} zoom={14} className="h-full w-full" preferCanvas={true}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        {vehicles.map(v => (
          <React.Fragment key={v.id}>
            <Marker position={[v.lat, v.lon]}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">Vehicle {v.id.slice(0, 6)}</div>
                  <div>Speed: {v.speed.toFixed(1)} m/s</div>
                  <div>Status: {v.status}</div>
                </div>
              </Popup>
            </Marker>
            <Circle center={[v.lat, v.lon]} radius={6} pathOptions={{
              color: v.status === 'Emergency' ? '#ef4444' : v.status === 'Warning' ? '#f59e0b' : '#10b981',
              fillOpacity: 0.5
            }} />
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  )
}
