'use strict';
const { TOPICS } = require('./topics');
const { parseTelemetry, parseDeviceState } = require('./validate');

function createOfficeState() {
  const current = {
    telemetry: null,
    devices: { light: null, fan: null },
    deviceOnline: null,
    updatedAt: null,
  };
  const events = [];

  function log(type, message) {
    const event = { id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`, at: new Date().toISOString(), type, message };
    events.unshift(event);
    if (events.length > 100) events.length = 100;
  }
  function onMqttMessage(topic, raw) {
    const str = raw.toString();
    if (topic === TOPICS.telemetry) {
      const next = parseTelemetry(str);
      if (!next) { log('warning', 'Ignored invalid telemetry'); return; }
      current.telemetry = next;
      current.updatedAt = new Date().toISOString();
      return;
    }
    if (topic === TOPICS.status) {
      const status = str.trim().toLowerCase();
      if (status !== 'online' && status !== 'offline') return;
      current.deviceOnline = status === 'online';
      log('status', `Virtual/physical ESP32 is ${status}`);
      return;
    }
    const device = topic === TOPICS.lightState ? 'light' : topic === TOPICS.fanState ? 'fan' : null;
    if (device) {
      const on = parseDeviceState(str);
      if (on === null) { log('warning', `Ignored invalid state for ${device}`); return; }
      current.devices[device] = on;
      log('state', `${device} confirmed ${on ? 'ON' : 'OFF'}`);
    }
  }
  function snapshot() { return { telemetry: current.telemetry && { ...current.telemetry }, devices: { ...current.devices }, deviceOnline: current.deviceOnline, updatedAt: current.updatedAt }; }
  function recent(limit = 30) { return events.slice(0, limit); }
  return { onMqttMessage, log, snapshot, recent };
}
module.exports = { createOfficeState };
