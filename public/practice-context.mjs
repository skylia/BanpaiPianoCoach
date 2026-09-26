// Only the practice workspace is persisted here; captures remain in IndexedDB.
export const PRACTICE_CONTEXT_KEY = 'banpai-practice-context-v1';
export const MIDI_PREFERENCE_KEY = 'banpai-midi-preference-v1';
const clamp = (value, min, max, fallback) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
export function defaultProfile(score) {
  return score.category === 'technique' || score.collection === '哈农' || score.collection === '基础训练' ? 'technique' : 'musical';
}
export function restorePracticeContext(raw, scores) {
  if (!raw || raw.version !== 1 || typeof raw.scoreId !== 'string') return null;
  const score = scores.find(s => s.id === raw.scoreId);
  if (!score) return null;
  const bars = Math.max(1, Math.ceil(score.totalBeats / (score.timeSignature[0] * 4 / score.timeSignature[1])));
  const startBar = Math.round(clamp(raw.startBar, 1, bars, 1));
  const endBar = Math.round(clamp(raw.endBar, startBar, bars, bars));
  return {
    score,
    options: {
      bpm: Math.round(clamp(raw.bpm, 20, 240, Math.max(20, Math.min(240, score.bpm)))),
      hand: ['both', 'right', 'left'].includes(raw.hand) ? raw.hand : score.notes.some(n => n.hand === 'left' && n.pitch !== null) ? 'both' : 'right',
      startBar, endBar,
      practiceMode: raw.practiceMode === 'follow' ? 'follow' : 'fixed',
      evaluationProfile: ['musical', 'technique'].includes(raw.evaluationProfile) ? raw.evaluationProfile : defaultProfile(score),
    },
    scrollTop: clamp(raw.scrollTop, 0, 1e7, 0),
    lastBar: Math.round(clamp(raw.lastBar, startBar, endBar, startBar)),
    metronome: typeof raw.metronome === 'boolean' ? raw.metronome : defaultProfile(score) === 'technique',
    loopCount: [1, 2, 3, 5].includes(raw.loopCount) ? raw.loopCount : 1,
    followScore: typeof raw.followScore === 'boolean' ? raw.followScore : true,
    showFingers: typeof raw.showFingers === 'boolean' ? raw.showFingers : true,
    showNames: typeof raw.showNames === 'boolean' ? raw.showNames : false,
  };
}
export function readLocalJSON(key, storage = globalThis.localStorage) {
  try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
}
export function writeLocalJSON(key, value, storage = globalThis.localStorage) {
  try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export function preferredMidiDevice(devices, saved) {
  return devices.find(d => d.id === saved?.id) ||
    (saved?.name && devices.filter(d => d.name === saved.name && (!saved.manufacturer || d.manufacturer === saved.manufacturer)).length === 1
      ? devices.find(d => d.name === saved.name && (!saved.manufacturer || d.manufacturer === saved.manufacturer)) : null) ||
    (devices.length === 1 ? devices[0] : null);
}
