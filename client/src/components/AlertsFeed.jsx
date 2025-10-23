import React from 'react'

function sevColor(sev) {
  if (sev === 'Emergency') return 'text-red-400'
  if (sev === 'Warning') return 'text-yellow-300'
  return 'text-slate-200'
}

export default function AlertsFeed({ alerts }) {
  return (
    <div className="card h-[480px] overflow-auto">
      <div className="font-semibold mb-2">Alerts</div>
      <div className="space-y-2">
        {alerts.length === 0 && (
          <div className="text-sm text-slate-400">No alerts yet.</div>
        )}
        {alerts.map(a => (
          <div key={a.ts + '_' + a.vehicleId} className="text-sm">
            <span className={sevColor(a.severity)}>
              [{new Date(a.ts).toLocaleTimeString()}] {a.type}
            </span>
            <span className="text-slate-300"> — Vehicle {String(a.vehicleId).slice(0,6)}</span>
            {a.message && <span className="text-slate-400"> — {a.message}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
