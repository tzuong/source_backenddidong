'use strict';

function parseTelemetry(raw) {
  let obj;
  try { obj = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return null; }
  if (!obj || Array.isArray(obj) || typeof obj !== 'object') return null;
  if (obj.temperature === null || obj.temperature === undefined || obj.humidity === null || obj.humidity === undefined) return null;
  if (typeof obj.temperature === 'boolean' || typeof obj.humidity === 'boolean') return null;
  const temperature = Number(obj.temperature);
  const humidity = Number(obj.humidity);
  if (!Number.isFinite(temperature) || !Number.isFinite(humidity)) return null;
  if (temperature < -20 || temperature > 85 || humidity < 0 || humidity > 100) return null;
  const motion = obj.motion ?? obj.occupied;
  if (typeof motion !== 'boolean' && motion !== undefined && motion !== 0 && motion !== 1) return null;
  return {
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.round(humidity * 10) / 10,
    motion: motion === undefined ? null : Boolean(motion),
  };
}

function parseDeviceState(raw) {
  let obj;
  try { obj = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return null; }
  if (typeof obj === 'boolean') return obj;
  if (obj && typeof obj === 'object' && !Array.isArray(obj) && typeof obj.on === 'boolean') return obj.on;
  return null;
}

module.exports = { parseTelemetry, parseDeviceState };
