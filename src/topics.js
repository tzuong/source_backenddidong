'use strict';

// Must match the already-created React Native app (src/config/topics.js).
const PREFIX = 'smartoffice/room1';
const TOPICS = Object.freeze({
  telemetry: `${PREFIX}/telemetry`,
  lightCommand: `${PREFIX}/cmd/light`,
  fanCommand: `${PREFIX}/cmd/fan`,
  lightState: `${PREFIX}/state/light`,
  fanState: `${PREFIX}/state/fan`,
  status: `${PREFIX}/status`,
});

module.exports = { PREFIX, TOPICS };
