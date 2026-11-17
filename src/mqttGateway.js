'use strict';
const mqtt = require('mqtt');
const { TOPICS } = require('./topics');

function createMqttGateway({ url, username, password, state }) {
  const client = mqtt.connect(url, {
    username,
    password,
    clientId: `smartoffice_backend_${process.pid}_${Math.random().toString(16).slice(2, 8)}`,
    protocolVersion: 4,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
    keepalive: 30,
    clean: true,
  });
  const subscriptions = [TOPICS.telemetry, TOPICS.lightState, TOPICS.fanState, TOPICS.status];
  client.on('connect', () => {
    console.log('[MQTT] Connected:', url);
    state.log('connection', 'Backend connected to MQTT Broker');
    client.subscribe(subscriptions, { qos: 1 }, (err) => {
      if (err) console.error('[MQTT] Subscription error:', err.message);
      else console.log('[MQTT] Subscribed:', subscriptions.join(', '));
    });
  });
  client.on('reconnect', () => console.log('[MQTT] Reconnecting...'));
  client.on('offline', () => console.log('[MQTT] Offline'));
  client.on('error', (err) => console.error('[MQTT] Error:', err.message));
  client.on('message', (topic, data) => state.onMqttMessage(topic, data));

  async function publishCommand(device, on) {
    if (!client.connected) throw new Error('MQTT_DISCONNECTED');
    const topic = device === 'light' ? TOPICS.lightCommand : TOPICS.fanCommand;
    return new Promise((resolve, reject) => client.publish(topic, JSON.stringify({ on }), { qos: 1, retain: false }, (err) => {
      if (err) reject(err);
      else { state.log('command', `${device} command ${on ? 'ON' : 'OFF'} published`); resolve(); }
    }));
  }
  return { connected: () => client.connected, publishCommand, close: () => client.end(true) };
}
module.exports = { createMqttGateway };
