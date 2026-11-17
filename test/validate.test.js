'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseTelemetry, parseDeviceState } = require('../src/validate');
const { createOfficeState } = require('../src/state');
const { TOPICS } = require('../src/topics');

test('valid telemetry matches React Native format', () => {
  assert.deepEqual(parseTelemetry('{"temperature":27.14,"humidity":63,"motion":true}'),
    { temperature: 27.1, humidity: 63, motion: true });
});
test('invalid sensor payload is rejected', () => {
  assert.equal(parseTelemetry('bad-json'), null);
  assert.equal(parseTelemetry('{"temperature":50,"humidity":101}'), null);
  assert.equal(parseTelemetry('{"temperature":null,"humidity":60,"motion":true}'), null);
  assert.equal(parseTelemetry('{"temperature":25,"humidity":60,"motion":"yes"}'), null);
});
test('only valid boolean device command is accepted', () => {
  assert.equal(parseDeviceState('{"on":true}'), true);
  assert.equal(parseDeviceState('{"on":false}'), false);
  assert.equal(parseDeviceState('{"on":"yes"}'), null);
});
test('state reflects MQTT acknowledgements', () => {
  const office = createOfficeState();
  office.onMqttMessage(TOPICS.lightState, Buffer.from('{"on":true}'));
  office.onMqttMessage(TOPICS.status, Buffer.from('online'));
  assert.equal(office.snapshot().devices.light, true);
  assert.equal(office.snapshot().deviceOnline, true);
  assert.ok(office.recent().length >= 2);
});
