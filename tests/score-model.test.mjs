import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScore, parseScoreJSON, serializeScore, beatsPerBar, barCount, beatToSeconds, scoreToTimedNotes, scoreDuration, toLegacyExercise } from '../public/score-model.mjs';

const make = (overrides = {}) => ({ schemaVersion: 2, id: 'test', title: '小练习', composer: '', collection: '我的曲谱', level: '入门', bpm: 60, timeSignature: [4,4], keySignature: 'C', notes: [{ id: 'a', pitch: 60, beat: 0, duration: 1, hand: 'right', finger: 1 }], totalBeats: 4, ...overrides });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} ≈ ${expected}`);

test('v2 normalization produces independent data and JSON round-trip preserves polyphony, rests and metadata', () => {
  const raw = make({ notes: [
    { id: 'b', pitch: 48, beat: 0, duration: 4, hand: 'left' },
    { id: 'a', pitch: 60, beat: 0, duration: 1, hand: 'right', finger: 1 },
    { id: 'r', pitch: null, beat: 1, duration: 3, hand: 'right' },
  ], tags: ['测试'], source: { label: '原创', url: 'https://example.com/score', note: '练习' }, tempoMap: [{ beat: 0, bpm: 60 }] });
  const before = structuredClone(raw);
  const result = normalizeScore(raw);
  assert.deepEqual(raw, before);
  assert.equal(result.notes[0].id, 'a');
  assert.deepEqual(parseScoreJSON(serializeScore(result)), result);
  result.notes[0].pitch = 61;
  assert.equal(raw.notes[1].pitch, 60);
});

test('legacy melody migrates into sequential right-hand notes and exports without musical loss', () => {
  const legacy = { id: 'old', title: '旧练习', bpm: 72, pitches: [60,62,64], lengths: [.5,.5,2] };
  const score = normalizeScore(legacy);
  assert.equal(score.schemaVersion, 2);
  assert.equal(score.totalBeats, 3);
  assert.deepEqual(score.notes.map(n => n.beat), [0,.5,1]);
  const restored = toLegacyExercise(score);
  assert.deepEqual(restored.pitches, legacy.pitches);
  assert.deepEqual(restored.lengths, legacy.lengths);
});

test('malformed JSON and illegal root values produce readable errors', () => {
  for (const json of ['{', '[]', 'null', '42', '"text"']) assert.throws(() => parseScoreJSON(json), /JSON|谱子/u);
  assert.throws(() => parseScoreJSON(' '.repeat(2 * 1024 * 1024 + 1)), /2 MB/u);
  assert.equal(parseScoreJSON('\uFEFF' + JSON.stringify(make())).title, '小练习');
  assert.throws(() => normalizeScore(make({ schemaVersion: 99 })), /版本/u);
});

test('invalid notes cannot become target events', () => {
  for (const edit of [{ pitch: 20 }, { pitch: 109 }, { pitch: 60.5 }, { pitch: undefined }, { beat: -1 }, { beat: NaN }, { beat: '0' }, { duration: 0 }, { duration: Infinity }, { hand: 'feet' }, { finger: 6 }]) {
    assert.throws(() => normalizeScore(make({ notes: [{ ...make().notes[0], ...edit }] })), /音符/u);
  }
  assert.throws(() => normalizeScore(make({ notes: [make().notes[0], make().notes[0]] })), /重复/u);
  assert.throws(() => normalizeScore(make({ totalBeats: .5 })), /结束位置/u);
});

test('bounded schema rejects unsafe metadata, excessive notes and overlong music', () => {
  assert.throws(() => normalizeScore(make({ title: 'x'.repeat(121) })), /曲名/u);
  assert.throws(() => normalizeScore(make({ title: ' ' })), /曲名/u);
  assert.throws(() => normalizeScore(make({ source: { url: 'javascript:alert(1)' } })), /网址/u);
  assert.throws(() => normalizeScore(make({ timeSignature: [4,3] })), /分母/u);
  assert.throws(() => normalizeScore(make({ keySignature: 'unknown' })), /调号/u);
  assert.throws(() => normalizeScore(make({ notes: Array.from({ length: 4097 }, (_, i) => ({ id: `n${i}`, pitch: 60, beat: 0, duration: 1, hand: 'right' })) })), /4096/u);
  assert.throws(() => normalizeScore(make({ totalBeats: 1025 })), /总拍数/u);
  assert.throws(() => normalizeScore({ pitches: [60,62], lengths: [1] }), /长度相同/u);
});

test('measure geometry respects 3/4 and 6/8 and partial final measures', () => {
  for (const ts of [[3,4],[6,8]]) {
    const score = normalizeScore(make({ timeSignature: ts, totalBeats: 7 }));
    assert.equal(beatsPerBar(score), 3);
    assert.equal(barCount(score), 3);
    assert.equal(scoreDuration(score, { startBar: 3 }), 1);
  }
});

test('tempo map integration and practice BPM scaling preserve tempo changes', () => {
  const score = normalizeScore(make({ totalBeats: 12, tempoMap: [{ beat: 0, bpm: 60 }, { beat: 4, bpm: 120 }, { beat: 8, bpm: 30 }] }));
  close(beatToSeconds(0, score), 0);
  close(beatToSeconds(4, score), 4);
  close(beatToSeconds(8, score), 6);
  close(beatToSeconds(12, score), 14);
  close(beatToSeconds(12, score, 120), 7);
  close(scoreDuration(score, { startBar: 2, endBar: 2 }), 2);
  close(scoreDuration(score, { startBar: 3, bpm: 120 }), 4);
  assert.throws(() => normalizeScore(make({ tempoMap: [{ beat: 0, bpm: 60 }, { beat: 0, bpm: 80 }] })), /同一拍/u);
});

test('hand and bar selection preserve ids, global indexes, gaps and bar-relative time', () => {
  const score = normalizeScore(make({ totalBeats: 12, notes: [
    { id: 'a', pitch: 60, beat: 0, duration: 5, hand: 'right' },
    { id: 'rest', pitch: null, beat: 4, duration: 1, hand: 'right' },
    { id: 'left', pitch: 48, beat: 4, duration: 4, hand: 'left' },
    { id: 'right', pitch: 64, beat: 5, duration: 4, hand: 'right', finger: 3 },
    { id: 'last', pitch: 67, beat: 8, duration: 1, hand: 'right' },
  ] }));
  const notes = scoreToTimedNotes(score, { startBar: 2, endBar: 2, hand: 'right' });
  assert.equal(notes.length, 1);
  assert.deepEqual({ id: notes[0].id, beat: notes[0].beat, time: notes[0].time, duration: notes[0].duration, bar: notes[0].bar, finger: notes[0].finger }, { id: 'right', beat: 5, time: 1, duration: 3, bar: 2, finger: 3 });
  assert.equal(score.notes[notes[0].index].id, 'right');
  assert.equal(scoreToTimedNotes(score, { startBar: 2, endBar: 2, hand: 'left' }).length, 1);
  assert.equal(scoreDuration(score, { startBar: 2, endBar: 2 }), 4);
});

test('note length crossing a tempo change is integrated, not multiplied by starting tempo', () => {
  const score = normalizeScore(make({ notes: [{ id: 'a', pitch: 60, beat: 0, duration: 4, hand: 'right' }], tempoMap: [{ beat: 2, bpm: 120 }] }));
  const note = scoreToTimedNotes(score)[0];
  close(note.duration, 3);
  close(scoreDuration(score), 3);
});

test('rest-only drafts retain duration but generate no scoring targets', () => {
  const score = normalizeScore(make({ notes: [{ id: 'r', pitch: null, beat: 0, duration: 4, hand: 'right' }] }));
  assert.deepEqual(scoreToTimedNotes(score), []);
  assert.equal(scoreDuration(score), 4);
  assert.throws(() => toLegacyExercise(score), /旧版/u);
});

test('invalid playback ranges cannot silently produce misleading empty exercises', () => {
  const score = normalizeScore(make());
  for (const options of [{ startBar: 0 }, { startBar: 2 }, { endBar: 2 }, { bpm: 0 }, { hand: 'middle' }]) assert.throws(() => scoreToTimedNotes(score, options));
});
