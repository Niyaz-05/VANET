const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  tickMs: parseInt(process.env.TICK_MS || '500', 10),
  speedLimit: parseFloat(process.env.SPEED_LIMIT || '25'),
  numVehicles: parseInt(process.env.NUM_VEHICLES || '20', 10),
  centerLat: parseFloat(process.env.CENTER_LAT || '37.7749'),
  centerLon: parseFloat(process.env.CENTER_LON || '-122.4194'),
  mongoUri: process.env.MONGODB_URI || ''
};

module.exports = config;
