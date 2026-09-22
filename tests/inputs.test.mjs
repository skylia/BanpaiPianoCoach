import test from 'node:test';
import assert from 'node:assert/strict';
import { MidiInput } from '../public/inputs.mjs';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function device(id, open = async () => {}) {
  return { id, name: `Piano ${id}`, state: 'connected', onmidimessage: null, open };
}

function adapter(devices, onEvent = () => {}, onState = () => {}) {
  const input = new MidiInput(onEvent, onState);
  input.access = { inputs: new Map(devices.map(port => [port.id, port])) };
  return input;
}

test('opening a replacement preserves the working input until success', async () => {
  const opening = deferred();
  const old = device('old'), next = device('next', () => opening.promise);
  const events = [];
  const input = adapter([old, next], event => events.push(event));
  await input.select('old');
  const oldListener = old.onmidimessage;
  const pending = input.select('next');
  assert.equal(input.selected, 'old');
  assert.equal(old.onmidimessage, oldListener);
  old.onmidimessage({ data: [0x90, 60, 90] });
  assert.equal(events.length, 1);
  opening.resolve();
  assert.equal(await pending, 'Piano next');
  assert.equal(input.selected, 'next');
  assert.equal(old.onmidimessage, null);
  assert.equal(typeof next.onmidimessage, 'function');
});

test('a failed replacement leaves the previously selected device usable', async () => {
  const failure = new Error('driver refused open');
  const old = device('old'), next = device('next', async () => { throw failure; });
  const input = adapter([old, next]);
  await input.select('old');
  const listener = old.onmidimessage;
  await assert.rejects(input.select('next'), error => error === failure);
  assert.equal(input.selected, 'old');
  assert.equal(old.onmidimessage, listener);
  assert.equal(next.onmidimessage, null);
});

test('detaching cancels a pending open and prevents it from reconnecting later', async () => {
  const opening = deferred();
  const old = device('old'), next = device('next', () => opening.promise);
  const input = adapter([old, next]);
  await input.select('old');
  const pending = input.select('next');
  input.detach();
  opening.resolve();
  assert.equal(await pending, null);
  assert.equal(input.selected, null);
  assert.equal(old.onmidimessage, null);
  assert.equal(next.onmidimessage, null);
});

test('an older selection resolving after the newer one cannot steal its input', async () => {
  const openingA = deferred(), openingB = deferred();
  const a = device('a', () => openingA.promise), b = device('b', () => openingB.promise);
  const input = adapter([a, b]);
  const pendingA = input.select('a'), pendingB = input.select('b');
  openingB.resolve();
  assert.equal(await pendingB, 'Piano b');
  const listenerB = b.onmidimessage;
  openingA.resolve();
  assert.equal(await pendingA, null);
  assert.equal(input.selected, 'b');
  assert.equal(a.onmidimessage, null);
  assert.equal(b.onmidimessage, listenerB);
});

test('an older selection resolving first still waits for the latest choice', async () => {
  const openingA = deferred(), openingB = deferred();
  const old = device('old'), a = device('a', () => openingA.promise), b = device('b', () => openingB.promise);
  const input = adapter([old, a, b]);
  await input.select('old');
  const oldListener = old.onmidimessage;
  const pendingA = input.select('a'), pendingB = input.select('b');
  openingA.resolve();
  assert.equal(await pendingA, null);
  assert.equal(input.selected, 'old');
  assert.equal(old.onmidimessage, oldListener);
  assert.equal(a.onmidimessage, null);
  openingB.resolve();
  assert.equal(await pendingB, 'Piano b');
  assert.equal(input.selected, 'b');
  assert.equal(old.onmidimessage, null);
});

test('a cancelled open rejection is ignored instead of surfacing a stale failure', async () => {
  const opening = deferred();
  const a = device('a', () => opening.promise), b = device('b');
  const input = adapter([a, b]);
  const pending = input.select('a');
  await input.select('b');
  opening.reject(new Error('old request failed'));
  assert.equal(await pending, null);
  assert.equal(input.selected, 'b');
  assert.equal(typeof b.onmidimessage, 'function');
});

test('a device disconnected during open is not attached or shown as selected', async () => {
  const opening = deferred();
  const old = device('old'), next = device('next', () => opening.promise);
  const input = adapter([old, next]);
  await input.select('old');
  const oldListener = old.onmidimessage;
  const pending = input.select('next');
  next.state = 'disconnected';
  opening.resolve();
  await assert.rejects(pending, /断开/);
  assert.equal(input.selected, 'old');
  assert.equal(old.onmidimessage, oldListener);
  assert.equal(next.onmidimessage, null);
});

test('an unavailable replacement does not disable the existing input', async () => {
  const old = device('old'), disconnected = device('disconnected');
  disconnected.state = 'disconnected';
  const input = adapter([old, disconnected]);
  await input.select('old');
  const listener = old.onmidimessage;
  await assert.rejects(input.select('missing'), /断开/);
  await assert.rejects(input.select('disconnected'), /断开/);
  assert.equal(input.selected, 'old');
  assert.equal(old.onmidimessage, listener);
});

test('replacing MIDI access cancels an open from the previous access object', async () => {
  const opening = deferred();
  const oldPort = device('old', () => opening.promise), newPort = device('new');
  const input = adapter([oldPort]);
  const pending = input.select('old');
  input.access = { inputs: new Map([['new', newPort]]) };
  opening.resolve();
  assert.equal(await pending, null);
  assert.equal(input.selected, null);
  assert.equal(oldPort.onmidimessage, null);
  assert.equal(newPort.onmidimessage, null);
});

test('MIDI note messages normalize channels, note-off, and zero-velocity note-on', async () => {
  const port = device('a'), events = [];
  const input = adapter([port], event => events.push(event));
  await input.select('a');
  for (const data of [[0x92, 60, 88], [0x82, 60, 10], [0x90, 62, 0], [0xb0, 64, 127], [0xf8], []]) {
    port.onmidimessage({ data });
  }
  assert.deepEqual(events.map(({ type, pitch, velocity }) => ({ type, pitch, velocity })), [
    { type: 'on', pitch: 60, velocity: 88 },
    { type: 'off', pitch: 60, velocity: 10 },
    { type: 'off', pitch: 62, velocity: 0 },
  ]);
  assert.ok(events.every(event => Number.isFinite(event.at)));
});

test('refresh reports selected-device disconnection once and removes it from candidates', async () => {
  const port = device('a'), updates = [];
  const input = adapter([port], () => {}, state => updates.push(state));
  await input.select('a');
  port.state = 'disconnected';
  input.refresh();
  assert.equal(input.selected, null);
  assert.equal(Boolean(updates[0].lost), true);
  assert.deepEqual(updates[0].devices, []);
  input.refresh();
  assert.equal(Boolean(updates[1].lost), false);
});
