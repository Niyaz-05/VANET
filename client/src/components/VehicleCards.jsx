import React from 'react'

function statusColor(status) {
  if (status === 'Emergency') return 'bg-red-500'
  if (status === 'Warning') return 'bg-yellow-500'
  return 'bg-emerald-500'
}

export default function VehicleCards({ vehicles }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {vehicles.map(v => (
        <div key={v.id} className="card">
          <div className="flex items-center justify-between">
            <div className="font-semibold">#{v.id.slice(0,6)}</div>
            <div className="badge">
              <span className={`badge-dot ${statusColor(v.status)}`}></span>
              <span>{v.status}</span>
            </div>
          </div>
          <div className="mt-2 text-sm text-slate-300">Speed: {v.speed.toFixed(1)} m/s</div>
          <div className="text-xs text-slate-400">Heading: {Math.round(v.heading)}°</div>
        </div>
      ))}
    </div>
  )
}
