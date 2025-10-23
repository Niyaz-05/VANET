import React from 'react'

export default function V2VFeed({ packets }) {
  return (
    <div className="card h-[240px] overflow-auto mt-4">
      <div className="font-semibold mb-2">V2V Broadcasts</div>
      <div className="space-y-2">
        {packets.length === 0 && (
          <div className="text-sm text-slate-400">No V2V packets yet.</div>
        )}
        {packets.map((p, idx) => (
          <div key={(p.ts || idx) + '_' + (p.from || '')} className="text-sm text-slate-200">
            [{new Date(p.ts).toLocaleTimeString()}] from {String(p.from).slice(0,6)} · {p.packet?.type}
            {typeof p.packet?.speed === 'number' && (
              <span className="text-slate-400"> — {p.packet.speed.toFixed(1)} m/s</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
