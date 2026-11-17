'use strict';
require('dotenv').config();
const mqtt = require('mqtt');
const { PREFIX, TOPICS } = require('./topics');
const { parseDeviceState } = require('./validate');

const password = process.env.SIMULATOR_PASSWORD;
if (!password || password.startsWith('SET_')) {
  console.error('Please set SIMULATOR_PASSWORD in .env (see README.md).');
  process.exit(1);
}
let devices = { light: false, fan: false };
const client = mqtt.connect(process.env.MQTT_URL || 'mqtt://127.0.0.1:1883', {
  username: process.env.SIMULATOR_USERNAME || 'simulator',
  password,
  clientId: `smartoffice_simulator_${process.pid}`,
  reconnectPeriod: 3000,
  keepalive: 30,
  will: { topic: TOPICS.status, payload: 'offline', qos: 1, retain: true },
});
function publishState(device) {
  client.publish(device === 'light' ? TOPICS.lightState : TOPICS.fanState,
    JSON.stringify({ on: devices[device] }), { qos: 1, retain: true });
}
function publishTelemetry() {
  if (!client.connected) return;
  const telemetry = {
    temperature: +(25 + Math.random() * 6).toFixed(1),
    humidity: +(52 + Math.random() * 16).toFixed(1),
    motion: Math.random() > 0.3,
  };
  client.publish(TOPICS.telemetry, JSON.stringify(telemetry), { qos: 0, retain: false });
  console.log('[SIM] Telemetry:', JSON.stringify(telemetry));
}
client.on('connect', () => {
  console.log('[SIM] Virtual ESP32 connected to MQTT Broker');
  client.subscribe(`${PREFIX}/cmd/#`, { qos: 1 });
  client.publish(TOPICS.status, 'online', { qos: 1, retain: true });
  publishState('light'); publishState('fan');
  publishTelemetry();
});
client.on('message', (topic, data) => {
  const device = topic === TOPICS.lightCommand ? 'light' : topic === TOPICS.fanCommand ? 'fan' : null;
  if (!device) return;
  const next = parseDeviceState(data.toString());
  if (next === null) { console.warn('[SIM] Invalid command ignored:', topic); return; }
  devices[device] = next;
  publishState(device);  // App shows actual state only after this acknowledgement.
  console.log(`[SIM] ${device}: ${next ? 'ON' : 'OFF'}`);
});
client.on('error', (err) => console.error('[SIM] MQTT error:', err.message));
const timer = setInterval(publishTelemetry, 5000);
function shutdown() {
  clearInterval(timer);
  if (!client.connected) { client.end(true); process.exit(0); return; }
  client.publish(TOPICS.status, 'offline', { qos: 1, retain: true }, () => client.end(false, () => process.exit(0)));
  setTimeout(() => process.exit(1), 3000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
