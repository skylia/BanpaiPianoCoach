import test from 'node:test';
import assert from 'node:assert/strict';
import { performance as clock } from 'node:perf_hooks';
import { EXERCISES, analyze, durationOf, makeDemo, makeScore } from '../public/analysis.mjs';

const example = EXERCISES.find(exercise => exercise.id === 'joy');
const bpm = 80;
const score = makeScore(example, bpm);
const performance = notes => notes.map(note => ({
  pitch: note.pitch, time: note.time, duration: note.duration, velocity: 80,
}));

test('every built-in exercise has aligned notes, sensible durations, and a perfect reference performance', () => {
  for (const exercise of EXERCISES) {
    for (const tempo of [40, exercise.bpm, 160]) {
      const notes = makeScore(exercise, tempo);
      assert.equal(notes.length, exercise.pitches.length);
      assert.equal(notes.length, exercise.lengths.length);
      assert.ok(notes.every(note => Number.isFinite(note.duration) && note.duration > 0));
      assert.ok(Math.abs(durationOf(notes) - exercise.lengths.reduce((sum, length) => sum + length, 0) * 60 / tempo) < 1e-9);
      const result = analyze(notes, performance(notes), tempo);
      assert.equal(result.correct, notes.length, `${exercise.id} at ${tempo} BPM`);
      assert.equal(result.pitch, 100);
      assert.equal(result.rhythm, 100);
      assert.equal(result.coverage, 100);
      assert.equal(result.averageDeviation, 0);
      assert.equal(result.missing + result.wrong + result.extras.length, 0);
    }
  }
});

test('one wrong key is localized to its intended note', () => {
  const events = performance(score);
  events[5].pitch += 2;
  const result = analyze(score, events, bpm);
  assert.equal(result.wrong, 1);
  assert.equal(result.rows[5].status, 'wrong');
  assert.equal(result.correct, score.length - 1);
  assert.equal(result.missing, 0);
  assert.equal(result.extras.length, 0);
  assert.equal(result.rhythm, 100);
});

test('an omitted note does not shift the subsequent melody', () => {
  const events = performance(score).filter((_, index) => index !== 6);
  const result = analyze(score, events, bpm);
  assert.equal(result.missing, 1);
  assert.equal(result.rows[6].status, 'missing');
  assert.equal(result.wrong, 0);
  assert.equal(result.correct, score.length - 1);
  assert.ok(result.rows.slice(7).every(row => row.status === 'correct' && row.delta === 0));
});

test('either omitted member of every repeated-note pair is identified by timing', () => {
  for (const exercise of EXERCISES) {
    const notes = makeScore(exercise, exercise.bpm);
    const repeated = new Set();
    for (let index = 1; index < notes.length; index++) {
      if (notes[index].pitch === notes[index - 1].pitch) {
        repeated.add(index - 1);
        repeated.add(index);
      }
    }
    for (const omitted of repeated) {
      const result = analyze(notes, performance(notes).filter((_, index) => index !== omitted), exercise.bpm);
      assert.equal(result.rows[omitted].status, 'missing', `${exercise.id}, missing note ${omitted + 1}`);
      assert.equal(result.missing, 1);
      assert.equal(result.wrong, 0);
      assert.equal(result.correct, notes.length - 1);
      assert.ok(result.rows.filter(row => row.played).every(row => row.delta === 0));
    }
  }
});

test('an extra key between notes preserves melody alignment and reduces pitch score', () => {
  const events = performance(score);
  const extra = { pitch: 61, time: score[4].time + .3, duration: .1, velocity: 60 };
  events.push(extra);
  const result = analyze(score, events, bpm);
  assert.equal(result.correct, score.length);
  assert.equal(result.extras.length, 1);
  assert.deepEqual(result.extras[0], extra);
  assert.equal(result.wrong + result.missing, 0);
  assert.ok(result.pitch < 100);
  assert.equal(result.coverage, 100);
});

test('an accidental double strike does not consume a later repeated note', () => {
  const events = performance(score);
  events.push({ ...events[0], time: .15 });
  const result = analyze(score, events, bpm);
  assert.equal(result.correct, score.length);
  assert.equal(result.extras.length, 1);
  assert.equal(result.extras[0].time, .15);
  assert.ok(result.rows.every(row => row.delta === 0));
});

test('a consistently late performance is pitch-correct but receives timing feedback', () => {
  const events = performance(score).map(event => ({ ...event, time: event.time + .3 }));
  const result = analyze(score, events, bpm);
  assert.equal(result.correct, score.length);
  assert.equal(result.pitch, 100);
  assert.equal(result.rhythm, 0);
  assert.equal(result.averageDeviation, 300);
  assert.ok(result.rows.every(row => row.timing === 'late'));
});

test('an isolated early note is distinguished from a wrong key', () => {
  const events = performance(score);
  events[7].time -= .3;
  const result = analyze(score, events, bpm);
  assert.equal(result.pitch, 100);
  assert.equal(result.rows[7].timing, 'early');
  assert.equal(result.rows[7].status, 'correct');
  assert.ok(result.rhythm < 100 && result.rhythm > 80);
});

test('small human timing variation remains within the stated tolerance', () => {
  const events = performance(score).map((event, index) => ({ ...event, time: event.time + (index % 2 ? -.05 : .05) }));
  const result = analyze(score, events, bpm);
  assert.equal(result.pitch, 100);
  assert.equal(result.rhythm, 100);
  assert.equal(result.averageDeviation, 50);
});

test('empty recording produces an empty result instead of a misleading score', () => {
  const result = analyze(score, [], bpm);
  assert.equal(result.empty, true);
  assert.equal(result.count, 0);
  assert.deepEqual(result.rows, []);
  assert.deepEqual(result.extras, []);
  assert.equal(result.pitch, undefined);
  assert.equal(result.rhythm, undefined);
});

test('invalid and preroll events do not become played notes', () => {
  const result = analyze(score, [
    { pitch: 60, time: -1 }, { pitch: NaN, time: 0 },
    { pitch: 60, time: Infinity }, { pitch: 60 },
  ], bpm);
  assert.equal(result.empty, true);
  assert.equal(result.count, 0);
});

test('premature stopping keeps played notes aligned and explicitly marks the unfinished take', () => {
  const playedCount = 5;
  const result = analyze(score, performance(score.slice(0, playedCount)), bpm, { interrupted: true });
  assert.equal(result.interrupted, true);
  assert.equal(result.correct, playedCount);
  assert.equal(result.wrong, 0);
  assert.equal(result.missing, score.length - playedCount);
  assert.equal(result.coverage, Math.round(playedCount / score.length * 100));
  assert.ok(result.rows.slice(0, playedCount).every(row => row.status === 'correct'));
  assert.ok(result.rows.slice(playedCount).every(row => row.status === 'missing'));
});

test('stopping before any note preserves interrupted status without inventing feedback', () => {
  const result = analyze(score, [], bpm, { interrupted: true });
  assert.equal(result.empty, true);
  assert.equal(result.interrupted, true);
  assert.equal(result.count, 0);
});

test('fewer than three played notes do not imply a reliable rhythm assessment', () => {
  const result = analyze(score, performance(score.slice(0, 2)), bpm, { interrupted: true });
  assert.equal(result.correct, 2);
  assert.equal(result.rhythm, null);
});

test('shuffled input is ordered without mutating the caller recording or score', () => {
  const events = performance(score).reverse();
  const beforeEvents = structuredClone(events);
  const beforeScore = structuredClone(score);
  const result = analyze(score, events, bpm);
  assert.equal(result.pitch, 100);
  assert.deepEqual(events, beforeEvents);
  assert.deepEqual(score, beforeScore);
});

test('the guided demo has an explainable wrong key, missed key, and delayed key', () => {
  const result = analyze(score, makeDemo(score), bpm);
  assert.equal(result.wrong, 1);
  assert.equal(result.rows[5].status, 'wrong');
  assert.equal(result.missing, 1);
  assert.equal(result.rows[9].status, 'missing');
  assert.equal(result.rows[11].timing, 'late');
  assert.equal(result.extras.length, 0);
  assert.equal(result.correct, score.length - 2);
});

function polyScore(groups, spacing = .5) {
  const notes = [];
  groups.forEach((pitches, groupIndex) => pitches.forEach((pitch, voiceIndex) => {
    notes.push({ pitch, time: groupIndex * spacing, duration: spacing,
      index: notes.length, beat: groupIndex, bar: Math.floor(groupIndex / 4) + 1,
      hand: pitch < 60 ? 'left' : 'right', id: `g${groupIndex}-v${voiceIndex}` });
  }));
  return notes;
}

test('two-hand octaves and chords match despite reversed key arrival order and slight spread', () => {
  const notes = polyScore([[48, 60, 64, 67], [50, 62, 65, 69], [48, 60, 64, 67]]);
  const events = [];
  for (let start = 0; start < notes.length; start += 4) {
    events.push(...performance(notes.slice(start, start + 4)).reverse().map((note, index) => ({ ...note, time: note.time + index * .03 })));
  }
  const result = analyze(notes, events, 120);
  assert.equal(result.correct, notes.length);
  assert.equal(result.pitch, 100);
  assert.equal(result.rhythm, 100);
  assert.equal(result.wrong + result.missing + result.extras.length, 0);
  assert.ok(result.rows.every((row, index) => row.expected === notes[index]));
});

test('a missing chord tone does not turn the other hand into wrong notes', () => {
  const notes = polyScore([[48, 60, 64, 67], [50, 62, 65, 69]]);
  const events = performance(notes).filter((_, index) => index !== 2).reverse();
  const result = analyze(notes, events, 120);
  assert.equal(result.rows[2].status, 'missing');
  assert.equal(result.correct, notes.length - 1);
  assert.equal(result.missing, 1);
  assert.equal(result.wrong + result.extras.length, 0);
});

test('an extra simultaneous chord tone is identified without displacing correct pitches', () => {
  const notes = polyScore([[48, 60, 64, 67], [50, 62, 65, 69]]);
  const extra = { pitch: 61, time: .035, duration: .2, velocity: 80 };
  const result = analyze(notes, [...performance(notes).reverse(), extra], 120);
  assert.equal(result.correct, notes.length);
  assert.equal(result.extras.length, 1);
  assert.equal(result.extras[0], extra);
  assert.equal(result.wrong + result.missing, 0);
});

test('an accidental key just before a spread chord does not split its correct tones', () => {
  const notes = polyScore([[48, 60, 64], [50, 62, 65], [48, 60, 64]]);
  const events = performance(notes).map((note, index) => ({ ...note, time: note.time + index % 3 * .02 }));
  const extra = { pitch: 61, time: .4, duration: .1, velocity: 80 };
  const result = analyze(notes, [...events, extra], 120);
  assert.equal(result.correct, notes.length);
  assert.equal(result.wrong + result.missing, 0);
  assert.deepEqual(result.extras, [extra]);
});

test('one wrong chord tone leaves matching tones in both hands correct', () => {
  const notes = polyScore([[48, 60, 64, 67], [50, 62, 65, 69]]);
  const events = performance(notes).map((event, index) => index === 2 ? { ...event, pitch: 66 } : event).reverse();
  const result = analyze(notes, events, 120);
  assert.equal(result.rows[2].status, 'wrong');
  assert.equal(result.rows[2].played.pitch, 66);
  assert.equal(result.correct, notes.length - 1);
  assert.equal(result.wrong, 1);
  assert.equal(result.missing + result.extras.length, 0);
});

test('an omitted repeated chord group preserves every subsequent group position', () => {
  const notes = polyScore(Array.from({ length: 8 }, () => [48, 60, 64]));
  const events = performance(notes).filter((_, index) => index < 3 || index >= 6).reverse();
  const result = analyze(notes, events, 120);
  assert.equal(result.missing, 3);
  assert.equal(result.correct, notes.length - 3);
  assert.equal(result.wrong + result.extras.length, 0);
  assert.ok(result.rows.slice(3, 6).every(row => row.status === 'missing'));
  assert.ok(result.rows.slice(6).every(row => row.status === 'correct' && row.delta === 0));
});

test('an overlapping long bass note neither consumes later melody onsets nor shortens the score', () => {
  const notes = polyScore([[48, 64], [65], [67], [69], [67], [65], [64], [62]]);
  notes[0].duration = 8;
  const result = analyze(notes, performance(notes).reverse(), 120);
  assert.equal(result.pitch, 100);
  assert.equal(result.correct, notes.length);
  assert.equal(durationOf(notes), 8);
  assert.equal(durationOf([...notes].reverse()), 8);
});

test('rows preserve caller order and full hand/id metadata when source notes are not time-sorted', () => {
  const timed = polyScore([[48, 60, 64], [50, 62, 65], [48, 60, 64]]);
  const notes = [...timed.filter(note => note.hand === 'left'), ...timed.filter(note => note.hand === 'right')];
  const before = structuredClone(notes);
  const result = analyze(notes, performance(timed), 120);
  assert.equal(result.correct, notes.length);
  result.rows.forEach((row, index) => {
    assert.equal(row.expected, notes[index]);
    assert.equal(row.expected.hand, before[index].hand);
    assert.equal(row.expected.id, before[index].id);
  });
  assert.deepEqual(notes, before);
});

test('fast distinct onsets remain separate instead of being merged into false chords', () => {
  const notes = polyScore(Array.from({ length: 32 }, (_, index) => [60 + index % 5]), .06);
  const result = analyze(notes, performance(notes), 120);
  assert.equal(result.correct, notes.length);
  assert.equal(result.pitch, 100);
  assert.equal(result.missing + result.extras.length, 0);
});

test('repeated same-pitch notes within a chord use distinct actual events', () => {
  const notes = polyScore([[60, 60, 67], [62, 62, 69]]);
  const result = analyze(notes, performance(notes).reverse(), 120);
  assert.equal(result.correct, notes.length);
  assert.equal(new Set(result.rows.map(row => row.played)).size, notes.length);
});

test('4096-note monophonic practice runs without a full quadratic alignment matrix', t => {
  const notes = polyScore(Array.from({ length: 4096 }, (_, index) => [48 + index % 25]), .125);
  const events = performance(notes);
  const started = clock.now();
  const result = analyze(notes, events, 120);
  const elapsed = clock.now() - started;
  assert.equal(result.correct, 4096);
  assert.equal(result.pitch, 100);
  assert.equal(result.rhythm, 100);
  assert.ok(elapsed < 5000, `4096-note analysis took ${elapsed.toFixed(1)} ms`);
  t.diagnostic(`4096 monophonic notes: ${elapsed.toFixed(1)} ms`);
});

test('4096-note two-hand chord practice remains accurate with reversed onset order', t => {
  const notes = polyScore(Array.from({ length: 1024 }, (_, index) => [48, 60, 64, 67].map(pitch => pitch + index % 5)));
  const events = [];
  for (let start = 0; start < notes.length; start += 4) {
    events.push(...performance(notes.slice(start, start + 4)).reverse().map((note, index) => ({ ...note, time: note.time + index * .02 })));
  }
  const started = clock.now();
  const result = analyze(notes, events, 120);
  const elapsed = clock.now() - started;
  assert.equal(result.correct, 4096);
  assert.equal(result.pitch, 100);
  assert.equal(result.coverage, 100);
  assert.ok(elapsed < 5000, `4096-note chord analysis took ${elapsed.toFixed(1)} ms`);
  t.diagnostic(`4096 chord notes: ${elapsed.toFixed(1)} ms`);
});

test('a dense simultaneous burst does not require a note-by-note square matrix', () => {
  const notes = polyScore([Array.from({ length: 4096 }, (_, index) => index % 128)]);
  const result = analyze(notes, performance(notes).reverse(), 120);
  assert.equal(result.correct, 4096);
  assert.equal(result.pitch, 100);
  assert.equal(result.extras.length, 0);
});

test('actual input with an empty target is entirely extra and does not produce NaN metrics', () => {
  const result = analyze([], [{ pitch: 60, time: 0, duration: .5 }], 120);
  assert.deepEqual(result.rows, []);
  assert.equal(result.extras.length, 1);
  assert.equal(result.pitch, 0);
  assert.equal(result.coverage, 0);
  assert.equal(result.rhythm, null);
});
