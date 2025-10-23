const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const config = require('./config');
const { Simulator } = require('./simulator');
const registerRoutes = require('./routes');
const { Storage } = require('./storage');

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: config.corsOrigin }
});

const storage = new Storage({ mongoUri: config.mongoUri });
// Initialize storage asynchronously (non-blocking)
storage.init();

const simulator = new Simulator(io, {
  tickMs: config.tickMs,
  speedLimit: config.speedLimit,
  numVehicles: config.numVehicles,
  centerLat: config.centerLat,
  centerLon: config.centerLon,
  storage
});

registerRoutes(app, simulator, storage);

io.on('connection', (socket) => {
  if (storage && storage.isConnected && storage.isConnected()) {
    storage.getEvents(50).then((logs) => {
      socket.emit('bootstrap', { vehicles: simulator.getVehicles(), logs, simRunning: simulator.running });
    }).catch(() => {
      socket.emit('bootstrap', { vehicles: simulator.getVehicles(), logs: simulator.getLogs(50), simRunning: simulator.running });
    });
  } else {
    socket.emit('bootstrap', { vehicles: simulator.getVehicles(), logs: simulator.getLogs(50), simRunning: simulator.running });
  }
  socket.on('sim:start', () => simulator.start());
  socket.on('sim:stop', () => simulator.stop());
  socket.on('vehicles:ingest', (data) => simulator.ingestTelemetry(data));
});

server.listen(config.port, () => {
  console.log('VANET server listening on ' + config.port);
});
