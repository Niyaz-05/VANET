import React from 'react'
import socket from '../api/socket'

export default function ControlPanel({ simRunning, onStart, onStop }) {
  const handleStart = () => { socket.emit('sim:start'); onStart && onStart() }
  const handleStop = () => { socket.emit('sim:stop'); onStop && onStop() }
  return (
    <div className="card flex items-center gap-2">
      <button onClick={handleStart} className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500">Start</button>
      <button onClick={handleStop} className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500">Stop</button>
      <div className="text-sm text-slate-300">Status: {simRunning ? 'Running' : 'Stopped'}</div>
    </div>
  )
}
