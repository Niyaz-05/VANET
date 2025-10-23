const { v4: uuidv4 } = require('uuid');

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function metersToLat(m) {
  return m / 111111;
}

function metersToLon(m, lat) {
  const r = Math.cos((lat * Math.PI) / 180);
  return m / (111111 * (r === 0 ? 1e-6 : r));
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class Simulator {
  constructor(io, options) {
    this.io = io;
    this.tickMs = options.tickMs || 500;
    this.speedLimit = options.speedLimit || 25;
    this.numVehicles = options.numVehicles || 20;
    this.centerLat = options.centerLat || 37.7749;
    this.centerLon = options.centerLon || -122.4194;
    this.vehicles = new Map();
    this.logs = [];
    this.timer = null;
    this.running = false;
    this.bootstrap();
  }

  bootstrap() {
    for (let i = 0; i < this.numVehicles; i++) {
      const id = uuidv4();
      const heading = rand(0, 360);
      const speed = rand(5, 20);
      const lat = this.centerLat + rand(-0.01, 0.01);
      const lon = this.centerLon + rand(-0.01, 0.01);
      this.vehicles.set(id, {
        id,
        lat,
        lon,
        heading,
        speed,
        lastSpeed: speed,
        status: 'Normal',
        accel: { x: 0, y: 0, z: 9.81 },
        gyro: { x: 0, y: 0, z: 0 }
      });
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  stop() {
    if (!this.running) return;
    clearInterval(this.timer);
    this.timer = null;
    this.running = false;
  }

  addLog(entry) {
    this.logs.push(entry);
    if (this.logs.length > 1000) this.logs.shift();
  }

  getLogs(limit) {
    const l = Math.max(1, parseInt(limit || 100, 10));
    return this.logs.slice(-l).reverse();
  }

  getVehicles() {
    return Array.from(this.vehicles.values());
  }

  broadcastTelemetry(v) {
    const t = {
      id: v.id,
      lat: v.lat,
      lon: v.lon,
      heading: v.heading,
      speed: v.speed,
      status: v.status,
      accel: v.accel,
      gyro: v.gyro,
      ts: Date.now()
    };
    this.io.emit('telemetry', t);
  }

  emitAlert(type, v, severity, info) {
    const alert = {
      ts: Date.now(),
      type,
      vehicleId: v.id,
      severity,
      message: info && info.message ? info.message : type
    };
    this.addLog(alert);
    this.io.emit('alert', alert);
    this.io.emit('v2v', {
      ts: alert.ts,
      from: v.id,
      packet: { type, speed: v.speed, lat: v.lat, lon: v.lon }
    });
    this.io.emit('v2i', { ts: alert.ts, type, vehicleId: v.id, severity });
  }

  evaluateEvents(v, accel, minDist) {
    let severity = 'Normal';
    if (v.speed > this.speedLimit) {
      severity = 'Warning';
      this.emitAlert('speeding', v, 'Warning');
    }
    if (accel < -6) {
      severity = 'Warning';
      this.emitAlert('sudden_brake', v, 'Warning');
    }
    if (minDist < 8) {
      severity = 'Warning';
      this.emitAlert('proximity', v, 'Warning');
    }
    if (accel < -12 || minDist < 2.5) {
      severity = 'Emergency';
      this.emitAlert('collision_detected', v, 'Emergency');
    }
    if (severity === 'Emergency') v.status = 'Emergency';
    else if (severity === 'Warning') v.status = 'Warning';
    else v.status = 'Normal';
  }

  nearestDistance(v, arr) {
    let d = Infinity;
    for (let i = 0; i < arr.length; i++) {
      const o = arr[i];
      if (o.id === v.id) continue;
      const m = haversine(v.lat, v.lon, o.lat, o.lon);
      if (m < d) d = m;
    }
    return d;
  }

  tick() {
    const dt = this.tickMs / 1000;
    const arr = Array.from(this.vehicles.values());
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      let ax = rand(-2, 2);
      if (Math.random() < 0.01) ax = -12 + rand(0, 2);
      const newSpeed = clamp(v.speed + ax * dt, 0, 40);
      const accel = (newSpeed - v.speed) / dt;
      v.speed = newSpeed;
      const dh = rand(-2, 2);
      v.heading = (v.heading + dh + 360) % 360;
      const dist = v.speed * dt;
      const rad = (v.heading * Math.PI) / 180;
      const dx = Math.cos(rad) * dist;
      const dy = Math.sin(rad) * dist;
      v.lat += metersToLat(dy);
      v.lon += metersToLon(dx, v.lat);
      v.accel = { x: accel, y: rand(-0.5, 0.5), z: 9.81 + rand(-0.2, 0.2) };
      v.gyro = { x: rand(-1, 1), y: rand(-1, 1), z: dh / dt };
      const minDist = this.nearestDistance(v, arr);
      this.evaluateEvents(v, accel, minDist);
      this.broadcastTelemetry(v);
      v.lastSpeed = v.speed;
    }
    this.io.emit('vehicles_state', this.getVehicles());
  }

  ingestTelemetry(data) {
    let id = data.id || data.vehicleId || uuidv4();
    let v = this.vehicles.get(id);
    if (!v) {
      v = {
        id,
        lat: typeof data.lat === 'number' ? data.lat : this.centerLat + rand(-0.005, 0.005),
        lon: typeof data.lon === 'number' ? data.lon : this.centerLon + rand(-0.005, 0.005),
        heading: typeof data.heading === 'number' ? data.heading : rand(0, 360),
        speed: typeof data.speed === 'number' ? data.speed : rand(0, 15),
        lastSpeed: 0,
        status: 'Normal',
        accel: { x: 0, y: 0, z: 9.81 },
        gyro: { x: 0, y: 0, z: 0 }
      };
      this.vehicles.set(id, v);
    }
    if (typeof data.lat === 'number') v.lat = data.lat;
    if (typeof data.lon === 'number') v.lon = data.lon;
    if (typeof data.heading === 'number') v.heading = data.heading;
    if (typeof data.speed === 'number') v.speed = data.speed;
    if (data.accel && typeof data.accel.x === 'number') v.accel = data.accel;
    if (data.gyro && typeof data.gyro.x === 'number') v.gyro = data.gyro;
    const dt = this.tickMs / 1000;
    const accel = (v.speed - v.lastSpeed) / dt;
    const minDist = this.nearestDistance(v, Array.from(this.vehicles.values()));
    this.evaluateEvents(v, accel, minDist);
    this.broadcastTelemetry(v);
    v.lastSpeed = v.speed;
  }
}

module.exports = { Simulator };
