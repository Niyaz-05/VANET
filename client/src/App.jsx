import React, { useEffect, useMemo, useRef, useState } from 'react'
import socket from './api/socket'
import VehicleMap from './components/VehicleMap'
import VehicleCards from './components/VehicleCards'
import AlertsFeed from './components/AlertsFeed'
import ControlPanel from './components/ControlPanel'
import RSUPanel from './components/RSUPanel'
import V2VFeed from './components/V2VFeed'

function beep(duration = 120, frequency = 880, volume = 0.2, type = 'sine') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.value = volume
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    setTimeout(() => { osc.stop(); ctx.close() }, duration)
  } catch {}
}

export default function App() {
  const [vehicles, setVehicles] = useState([])
  const [alerts, setAlerts] = useState([])
  const [simRunning, setSimRunning] = useState(false)
  const alertsRef = useRef([])
  const [rsuEvents, setRsuEvents] = useState([])
  const [v2vPackets, setV2vPackets] = useState([])

  useEffect(() => {
    function onBootstrap(data) {
      setVehicles(data.vehicles || [])
      setAlerts((data.logs || []).filter(l => l.type))
      setSimRunning(!!data.simRunning)
    }
    function onTelemetry(t) {
      setVehicles(prev => {
        const map = new Map(prev.map(v => [v.id, v]))
        const v = map.get(t.id) || { id: t.id }
        map.set(t.id, { ...v, ...t })
        return Array.from(map.values())
      })
    }
    function onVehiclesState(list) {
      setVehicles(list || [])
    }
    function onAlert(a) {
      setAlerts(prev => {
        const next = [{...a}, ...prev].slice(0, 100)
        alertsRef.current = next
        return next
      })
      beep(140, a.severity === 'Emergency' ? 1200 : 800)
    }
    function onV2I(e) {
      setRsuEvents(prev => ([{...e}, ...prev].slice(0, 100)))
    }
    function onV2V(p) {
      setV2vPackets(prev => ([{...p}, ...prev].slice(0, 100)))
    }

    socket.on('bootstrap', onBootstrap)
    socket.on('telemetry', onTelemetry)
    socket.on('vehicles_state', onVehiclesState)
    socket.on('alert', onAlert)
    socket.on('v2i', onV2I)
    socket.on('v2v', onV2V)

    return () => {
      socket.off('bootstrap', onBootstrap)
      socket.off('telemetry', onTelemetry)
      socket.off('vehicles_state', onVehiclesState)
      socket.off('alert', onAlert)
      socket.off('v2i', onV2I)
      socket.off('v2v', onV2V)
    }
  }, [])

  const stats = useMemo(() => {
    const total = vehicles.length
    const emergencies = vehicles.filter(v => v.status === 'Emergency').length
    const warnings = vehicles.filter(v => v.status === 'Warning').length
    return { total, emergencies, warnings }
  }, [vehicles])

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">VANET Monitoring</h1>
        <div className="text-sm text-slate-300">
          Vehicles: {stats.total} · Warnings: {stats.warnings} · Emergencies: {stats.emergencies}
        </div>
      </header>

      <ControlPanel simRunning={simRunning} onStart={() => setSimRunning(true)} onStop={() => setSimRunning(false)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <VehicleMap vehicles={vehicles} />
          <VehicleCards vehicles={vehicles} />
        </div>
        <div>
          <AlertsFeed alerts={alerts} />
          <RSUPanel events={rsuEvents} />
          <V2VFeed packets={v2vPackets} />
        </div>
      </div>
    </div>
  )
}
