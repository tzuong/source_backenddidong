'use strict';
const express = require('express');

function createHttpApp({ apiKey, state, gateway }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '8kb' }));

  // All API routes require a secret; phone app still connects directly to MQTT.
  app.use('/api', (req, res, next) => {
    if (req.get('x-api-key') !== apiKey) return res.status(401).json({ error: 'Invalid or missing x-api-key' });
    next();
  });
  app.get('/api/health', (req, res) => res.json({ ok: true, mqttConnected: gateway.connected(), time: new Date().toISOString() }));
  app.get('/api/office', (req, res) => res.json({ mqttConnected: gateway.connected(), ...state.snapshot() }));
  app.get('/api/events', (req, res) => res.json({ items: state.recent(30) }));
  app.post('/api/devices/:device', async (req, res) => {
    const device = req.params.device;
    if (device !== 'light' && device !== 'fan') return res.status(404).json({ error: 'Unknown device' });
    if (!req.body || typeof req.body.on !== 'boolean') return res.status(400).json({ error: 'Send JSON {"on":true} or {"on":false}' });
    if (!gateway.connected()) return res.status(503).json({ error: 'MQTT Broker not connected' });
    if (state.snapshot().deviceOnline === false) return res.status(409).json({ error: 'ESP32/simulator is offline' });
    try {
      await gateway.publishCommand(device, req.body.on);
      return res.status(202).json({ accepted: true, device, on: req.body.on, note: 'Command published; wait for device state confirmation' });
    } catch (err) {
      console.error('[API] Publish failed:', err.message);
      return res.status(503).json({ error: 'Publish failed' });
    }
  });
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ error: 'Invalid JSON body' });
    if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'JSON body too large' });
    console.error('[API] Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  });
  return app;
}
module.exports = { createHttpApp };
