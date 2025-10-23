import React from 'react'

function sevColor(sev) {
  if (sev === 'Emergency') return 'text-red-400'
  if (sev === 'Warning') return 'text-yellow-300'
  return 'text-slate-200'
}

export default function RSUPanel({ events }) {
  return (
    <div className="card h-[240px] overflow-auto mt-4">
      <div className="font-semibold mb-2">RSU Events (V2I)</div>
      <div className="space-y-2">
        {events.length === 0 && (
          <div className="text-sm text-slate-400">No RSU events yet.</div>
        )}
        {events.map((e, idx) => (
          <div key={(e.ts || idx) + '_' + (e.vehicleId || '')} className="text-sm">
            <span className={sevColor(e.severity || 'Normal')}>
              [{new Date(e.ts).toLocaleTimeString()}] {e.type}
            </span>
            {e.vehicleId && (
              <span className="text-slate-300"> — Vehicle {String(e.vehicleId).slice(0,6)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
