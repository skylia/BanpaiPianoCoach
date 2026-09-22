import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScore, scoreDuration } from '../public/score-model.mjs';
import { parseMidi, midiToScore, exportMidi } from '../public/midi.mjs';

const u32 = n => [(n >>> 24) & 255,(n >>> 16) & 255,(n >>> 8) & 255,n & 255];
const makeFile = (events, { division = 96, format = 0 } = {}) => new Uint8Array([77,84,104,100,0,0,0,6,0,format,0,1,division >> 8,division & 255,77,84,114,107,...u32(events.length),...events]);
const eot = [0,255,47,0];
const base = () => normalizeScore({ id: 'roundtrip', title: '双手练习', composer: '', bpm: 80, timeSignature: [3,4], keySignature: 'F', totalBeats: 6, tempoMap: [{ beat: 0, bpm: 80 },{ beat: 3, bpm: 120 }], notes: [
  { id: 'r1', pitch: 60, beat: 0, duration: 1, hand: 'right' },
  { id: 'r2', pitch: 64, beat: 1, duration: .5, hand: 'right' },
  { id: 'r3', pitch: 67, beat: 1, duration: .5, hand: 'right' },
  { id: 'l1', pitch: 48, beat: 0, duration: 3, hand: 'left' },
  { id: 'l2', pitch: 53, beat: 3, duration: 3, hand: 'left' },
] });

test('MIDI type 1 round-trip preserves chords, note times, separate hands, tempo and meter', () => {
  const original = base();
  const file = exportMidi(original);
  const parsed = parseMidi(file);
  assert.equal(parsed.format, 1);
  assert.equal(parsed.tracks.length, 2);
  assert.deepEqual(parsed.timeSignature, [3,4]);
  assert.equal(parsed.keySignature, 'F');
  assert.ok(Math.abs(parsed.bpm - 80) < 1e-4);
  assert.equal(parsed.tempoMap.length, 2);
  assert.deepEqual(parsed.warnings, []);
  const score = midiToScore(parsed, { rightTrackIds: [parsed.tracks[0].id], leftTrackIds: [parsed.tracks[1].id], quantize: 0 });
  const music = score => score.notes.map(({ pitch, beat, duration, hand }) => ({ pitch, beat, duration, hand }));
  assert.deepEqual(music(score), music(original));
  assert.ok(Math.abs(scoreDuration(score) - scoreDuration(original)) < 1e-4);
});

test('type 0 running status, zero-velocity note-off and multibyte delta are read accurately', () => {
  const file = makeFile([0,0x90,60,90,0x81,0x40,60,0,0,62,70,96,62,0,...eot]);
  const parsed = parseMidi(file);
  assert.equal(parsed.tracks.length, 1);
  assert.deepEqual(parsed.tracks[0].notes.map(n => [n.pitch,n.beat,n.duration]), [[60,0,2],[62,2,1]]);
  assert.equal(parsed.bpm, 120);
});

test('program, pressure, pitch bend and SysEx are skipped without losing note synchronization', () => {
  const file = makeFile([0,0xc0,0,0,0xd0,50,0,0xe0,0,64,0,0xf0,3,1,2,0xf7,0,0x90,60,80,96,0x80,60,0,...eot]);
  const parsed = parseMidi(file);
  assert.equal(parsed.tracks[0].notes[0].duration, 1);
});

test('type 0 with several channels exposes separate selectable input tracks', () => {
  const parsed = parseMidi(makeFile([0,0x90,60,80,0,0x91,48,80,96,0x80,60,0,0,0x81,48,0,...eot]));
  assert.equal(parsed.tracks.length, 2);
  assert.equal(new Set(parsed.tracks.map(t => t.id)).size, 2);
  const chosen = midiToScore(parsed, { trackIds: [parsed.tracks[1].id], rightTrackIds: [parsed.tracks[1].id] });
  assert.equal(chosen.notes.length, 1);
  assert.equal(chosen.notes[0].hand, 'right');
});

test('percussion and notes outside 88-key range are omitted with visible warnings', () => {
  const parsed = parseMidi(makeFile([0,0x99,36,100,0,0x90,10,100,0,0x90,60,100,96,0x89,36,0,0,0x80,10,0,0,0x80,60,0,...eot]));
  assert.equal(parsed.tracks.length, 1);
  assert.deepEqual(parsed.tracks[0].notes.map(n => n.pitch), [60]);
  assert.ok(parsed.warnings.some(w => w.includes('打击乐')));
  assert.ok(parsed.warnings.some(w => w.includes('88 键')));
});

test('overlapping repeated note-ons pair FIFO instead of erasing an earlier strike', () => {
  const parsed = parseMidi(makeFile([0,0x90,60,100,48,60,80,48,0x80,60,0,48,60,0,...eot]));
  assert.deepEqual(parsed.tracks[0].notes.map(n => [n.beat,n.duration]), [[0,1],[.5,1]]);
});

test('dangling note-on closes at track end with a warning and orphan note-off is ignored', () => {
  const parsed = parseMidi(makeFile([0,0x80,62,0,0,0x90,60,80,96,255,47,0]));
  assert.equal(parsed.tracks[0].notes[0].duration, 1);
  assert.ok(parsed.warnings.some(w => w.includes('缺少抬键')));
  assert.ok(parsed.warnings.some(w => w.includes('没有对应')));
});

test('tempo, changing meter and sustain pedal are not silently misrepresented', () => {
  const parsed = parseMidi(makeFile([0,255,81,3,7,161,32,0,255,88,4,3,2,24,8,0,0xb0,64,127,0,0x90,60,80,96,0x80,60,0,0,255,88,4,4,2,24,8,...eot]));
  assert.equal(parsed.bpm, 120);
  assert.deepEqual(parsed.timeSignature, [3,4]);
  assert.ok(parsed.warnings.some(w => w.includes('换拍')));
  assert.ok(parsed.warnings.some(w => w.includes('延音踏板')));
});

test('MIDI import quantization aligns note onsets and retains positive short durations', () => {
  const parsed = parseMidi(makeFile([25,0x90,60,80,5,0x80,60,0,...eot]));
  const quantized = midiToScore(parsed, { quantize: .25 });
  assert.equal(quantized.notes[0].beat, .25);
  assert.equal(quantized.notes[0].duration, .25);
  assert.equal(quantized.totalBeats, 4);
  const exact = midiToScore(parsed, { quantize: 0 });
  assert.equal(exact.notes[0].beat, 25 / 96);
  assert.ok(Math.abs(exact.notes[0].duration - 5 / 96) < 1e-9);
});

test('invalid or ambiguous track assignments fail with useful feedback', () => {
  const parsed = parseMidi(exportMidi(base()));
  const id = parsed.tracks[0].id;
  assert.throws(() => midiToScore(parsed, { trackIds: [] }), /选择/u);
  assert.throws(() => midiToScore(parsed, { trackIds: ['missing'] }), /不存在/u);
  assert.throws(() => midiToScore(parsed, { rightTrackIds: [id], leftTrackIds: [id] }), /同时/u);
  assert.throws(() => midiToScore(parsed, { quantize: NaN }), /量化/u);
  assert.throws(() => midiToScore(parsed, { quantize: -.25 }), /量化/u);
});

test('malformed headers, truncation, invalid deltas and invalid running status are rejected', () => {
  assert.throws(() => parseMidi(new Uint8Array([1,2,3,4])), /MThd/u);
  const valid = makeFile([0,0x90,60,80,96,0x80,60,0,...eot]);
  for (const length of [0,4,10,20,valid.length - 1]) assert.throws(() => parseMidi(valid.slice(0,length)), /不完整/u);
  assert.throws(() => parseMidi(makeFile([0,60,80,...eot])), /running status/u);
  assert.throws(() => parseMidi(makeFile([0x80,0x80,0x80,0x80,0,...eot])), /变长数字/u);
  assert.throws(() => parseMidi(makeFile([0,0x90,200,80,...eot])), /数据字节/u);
  assert.throws(() => parseMidi(makeFile([0,255,81,2,0,0,...eot])), /3 字节/u);
  assert.throws(() => parseMidi(makeFile([0,255,81,3,0,0,0,...eot])), /不能为 0/u);
});

test('SMPTE and asynchronous format 2 explain supported alternatives', () => {
  assert.throws(() => parseMidi(makeFile(eot, { division: 0xe728 })), /SMPTE/u);
  assert.throws(() => parseMidi(makeFile(eot, { format: 2 })), /类型 2/u);
  assert.throws(() => parseMidi(makeFile(eot, { division: 0 })), /不能为 0/u);
});

test('typed array slices respect byte offsets, and no-note files cannot become a practice', () => {
  const content = makeFile(eot);
  const padded = new Uint8Array(content.length + 8);
  padded.set(content, 4);
  const parsed = parseMidi(padded.subarray(4,4 + content.length));
  assert.deepEqual(parsed.tracks, []);
  assert.throws(() => midiToScore(parsed), /选择/u);
});

test('MIDI export retains empty final bars and sounding events have valid note-offs', () => {
  const score = base(); score.totalBeats = 9;
  const parsed = parseMidi(exportMidi(score));
  assert.equal(parsed.durationBeats, 9);
  assert.equal(parsed.tracks.reduce((sum,t) => sum + t.notes.length,0), score.notes.length);
  assert.deepEqual(parsed.warnings, []);
});
