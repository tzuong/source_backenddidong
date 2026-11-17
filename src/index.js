'use strict';
require('dotenv').config();
const { createOfficeState } = require('./state');
const { createMqttGateway } = require('./mqttGateway');
const { createHttpApp } = require('./httpApp');

const apiKey = process.env.API_KEY;
const mqttPassword = process.env.MQTT_PASSWORD;
if (!apiKey || apiKey.startsWith('CHANGE_ME') || !mqttPassword || mqttPassword.startsWith('SET_')) {
  console.error('Please set API_KEY and MQTT_PASSWORD in .env (see README.md).');
  process.exit(1);
}
const state = createOfficeState();
const gateway = createMqttGateway({
  url: process.env.MQTT_URL || 'mqtt://127.0.0.1:1883',
  username: process.env.MQTT_USERNAME || 'backend',
  password: mqttPassword,
  state,
});
const app = createHttpApp({ apiKey, state, gateway });
const port = Number(process.env.PORT) || 3000;
const host = process.env.HTTP_HOST || '127.0.0.1';
const server = app.listen(port, host, () => console.log(`[API] http://${host}:${port} (x-api-key required)`));
function shutdown() {
  gateway.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 4000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
