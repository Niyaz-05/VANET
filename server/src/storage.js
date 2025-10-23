const mongoose = require('mongoose')

class Storage {
  constructor({ mongoUri }) {
    this.mongoUri = mongoUri || ''
    this.connected = false
    this.memEvents = []
    this.memTelemetry = []
    this.EventModel = null
    this.TelemetryModel = null
  }

  async init() {
    if (!this.mongoUri) return false
    try {
      await mongoose.connect(this.mongoUri, {
        dbName: this.mongoUri.split('/').pop() || 'vanet'
      })
      const eventSchema = new mongoose.Schema({
        ts: { type: Date, index: true },
        type: String,
        vehicleId: String,
        severity: String,
        message: String,
        packet: mongoose.Schema.Types.Mixed
      }, { collection: 'events' })
      const telemetrySchema = new mongoose.Schema({
        ts: { type: Date, index: true },
        id: { type: String, index: true },
        lat: Number,
        lon: Number,
        heading: Number,
        speed: Number,
        status: String
      }, { collection: 'telemetry' })
      telemetrySchema.index({ id: 1, ts: -1 })
      this.EventModel = mongoose.model('Event', eventSchema)
      this.TelemetryModel = mongoose.model('Telemetry', telemetrySchema)
      this.connected = true
      return true
    } catch (err) {
      console.warn('MongoDB connection failed, using in-memory storage:', err.message)
      this.connected = false
      return false
    }
  }

  isConnected() { return this.connected }

  async saveEvent(evt) {
    if (this.connected && this.EventModel) {
      try { await this.EventModel.create({ ...evt, ts: new Date(evt.ts || Date.now()) }) } catch {}
    } else {
      this.memEvents.push(evt)
      if (this.memEvents.length > 2000) this.memEvents.shift()
    }
  }

  async getEvents(limit = 100) {
    const l = Math.max(1, parseInt(limit, 10))
    if (this.connected && this.EventModel) {
      const docs = await this.EventModel.find({}).sort({ ts: -1 }).limit(l).lean()
      return docs
    }
    return this.memEvents.slice(-l).reverse()
  }

  async saveTelemetry(t) {
    if (this.connected && this.TelemetryModel) {
      try { await this.TelemetryModel.create({ ...t, ts: new Date(t.ts || Date.now()) }) } catch {}
    } else {
      this.memTelemetry.push(t)
      if (this.memTelemetry.length > 5000) this.memTelemetry.shift()
    }
  }
}

module.exports = { Storage }
