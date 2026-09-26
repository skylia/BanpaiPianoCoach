import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {HumanDemoTransport, auditedBarAt, validateDemoFile, MAX_DEMO_BYTES} from '../public/human-demo-model.mjs';
import {DEMO_LIBRARY, demosForScore} from '../public/demo-library.mjs';

class FakeAudio extends EventTarget {
  constructor() {super(); this.paused = true; this.currentTime = 0; this.duration = 90; this.src = ''; this.playbackRate = 1; this.error = null; this.playCalls = 0;}
  getAttribute(name) {return this[name];}
  removeAttribute(name) {this[name] = '';}
  load() {}
  play() {this.playCalls++; this.paused = false; this.dispatchEvent(new Event('play')); return Promise.resolve();}
  pause() {this.paused = true; this.dispatchEvent(new Event('pause'));}
}
function fixture(overrides = {}) {
  const audio = new FakeAudio(), frames = new Map(), progress = [], states = []; let id = 0;
  const player = new HumanDemoTransport({audio, onProgress: p => progress.push(p), onState: s => states.push(s), requestFrame: fn => {frames.set(++id, fn); return id;}, cancelFrame: id => frames.delete(id), ...overrides});
  player.load('fixture.m4a');
  return {audio, player, frames, progress, states};
}

test('reference recording has auditable attribution and unchanged file hash', () => {
  const recording = DEMO_LIBRARY[0];
  assert.equal(recording.performer, 'Luis Kolodin');
  assert.equal(recording.license, 'CC BY-SA 4.0');
  assert.equal(recording.mapping, null);
  const data = readFileSync(new URL('../public/' + recording.src.slice(2), import.meta.url));
  assert.equal(createHash('sha256').update(data).digest('hex'), recording.sha256);
  assert.equal(data.subarray(4, 8).toString(), 'ftyp');
  assert.equal(demosForScore('mutopia-clementi-op36-no1-movement2').length, 1);
  assert.equal(demosForScore('unrelated-score').length, 0);
});
test('pause preserves time; seek and pitch-preserving rates use recorded time', async () => {
  const {player, audio, frames} = fixture();
  await player.play(); audio.currentTime = 12.5; player.pause();
  assert.equal(player.position, 12.5); assert.equal(player.state, 'paused'); assert.equal(frames.size, 0);
  player.setRate(.75); assert.equal(audio.playbackRate, .75); assert.equal(audio.preservesPitch, true);
  player.seek(18); await player.play(); assert.equal(player.position, 18);
  player.stop(); assert.equal(player.position, 0); assert.equal(audio.paused, true);
});
test('A-B loop wraps only during playback and rejects invalid marks', async () => {
  const {player, audio} = fixture();
  assert.throws(() => player.setLoop(null, 5)); assert.throws(() => player.setLoop(5, 5.2)); assert.throws(() => player.setLoop(2, 100));
  player.setLoop(10, 20); player.seek(25); assert.equal(player.position, 25);
  await player.play(); assert.equal(player.position, 10);
  audio.currentTime = 20.1; player.tick(); assert.equal(player.position, 10);
  player.clearLoop(); audio.currentTime = 20.1; player.tick(); assert.equal(player.position, 20.1);
  player.destroy();
});
test('movement excerpts seek, stop, loop and end inside the chosen movement', async()=>{
 const {player,audio}=fixture();
 player.load('three-movements.m4a',null,{startTime:20,endTime:50});
 assert.equal(player.duration,30);assert.equal(player.position,0);assert.equal(audio.currentTime,20);
 player.seek(10);assert.equal(audio.currentTime,30);
 player.setLoop(5,8);await player.play();assert.equal(audio.currentTime,25);
 audio.currentTime=28.1;player.tick();assert.equal(audio.currentTime,25);
 player.clearLoop();audio.currentTime=50.1;player.tick();assert.equal(audio.paused,true);assert.equal(player.position,30);
 await player.play();assert.equal(audio.currentTime,20);player.stop();assert.equal(audio.currentTime,20);
 player.load('full.m4a');assert.equal(player.duration,90);assert.equal(player.position,0);
 assert.throws(()=>player.load('bad.m4a',null,{startTime:30,endTime:20}));
});
test('busy practice blocks playback without interrupting existing application sound', async () => {
  let before = 0; const {player, audio} = fixture({isBusy: () => true, onBeforePlay: () => {before++;}});
  await assert.rejects(player.play(), /结束当前练习/); assert.equal(before, 0); assert.equal(audio.playCalls, 0);
});
test('switching score or stopping cancels a pending pre-play handoff', async () => {
  let resolve; const handoff = new Promise(done => {resolve = done;});
  const {player, audio} = fixture({onBeforePlay: () => handoff});
  const pending = player.play(); player.load('next.m4a'); resolve(); await pending;
  assert.equal(audio.playCalls, 0); assert.equal(player.pending, false); assert.equal(audio.src, 'next.m4a');
});
test('an older play promise cannot pause a newer recording', async () => {
  const {player, audio} = fixture(); let resolve;
  audio.play = () => {audio.paused = false; return new Promise(done => {resolve = done;});};
  const first = player.play(); await Promise.resolve();
  player.load('next.m4a'); audio.play = FakeAudio.prototype.play;
  await player.play(); resolve(); await first;
  assert.equal(audio.paused, false); assert.equal(audio.src, 'next.m4a'); player.destroy();
});
test('unmapped recordings never produce a fabricated score cursor', async () => {
  const {player, audio, progress} = fixture(); await player.play(); audio.currentTime = 30; player.tick();
  assert(progress.every(point => point === null)); player.destroy();
});
test('audited mapping supports repeats and rejects malformed or unaudited maps', () => {
  const map = {verified: true, reviewedBy: 'reviewer', endTime: 30, points: [{time: 2, bar: 1}, {time: 8, bar: 2}, {time: 15, bar: 1}]};
  assert.deepEqual(auditedBarAt(map, 10), {bar: 2, seconds: 10});
  assert.deepEqual(auditedBarAt(map, 16), {bar: 1, seconds: 16});
  assert.equal(auditedBarAt(map, 1), null); assert.equal(auditedBarAt(map, 30), null);
  assert.equal(auditedBarAt({...map, verified: false}, 10), null);
  assert.equal(auditedBarAt({...map, points: [{time: 2, bar: 1}, {time: 1, bar: 2}]}, 10), null);
});
test('local import rejects MIDI, empty and oversized files before storage', () => {
  validateDemoFile({name: 'teacher.mp3', size: 1234, type: 'audio/mpeg'});
  validateDemoFile({name: 'teacher.m4a', size: 1234, type: ''});
  for (const file of [{name: 'score.mid', type: 'audio/midi', size: 100}, {name: 'empty.wav', size: 0}, {name: 'large.wav', size: MAX_DEMO_BYTES + 1}, {name: 'fake.mp3', type: 'text/html', size: 100}]) assert.throws(() => validateDemoFile(file));
});
