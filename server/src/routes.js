module.exports = function registerRoutes(app, simulator) {
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', simRunning: simulator.running, vehicles: simulator.getVehicles().length, uptime: process.uptime() });
  });

  app.get('/api/vehicles', (req, res) => {
    res.json(simulator.getVehicles());
  });

  app.get('/api/logs', (req, res) => {
    const limit = parseInt(req.query.limit || '100', 10);
    res.json(simulator.getLogs(limit));
  });

  app.post('/api/sim/start', (req, res) => {
    simulator.start();
    res.json({ started: true });
  });

  app.post('/api/sim/stop', (req, res) => {
    simulator.stop();
    res.json({ stopped: true });
  });

  app.post('/api/vehicles/ingest', (req, res) => {
    simulator.ingestTelemetry(req.body || {});
    res.json({ ok: true });
  });
};
