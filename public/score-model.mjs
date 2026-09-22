// Portable score format. All beat values are quarter-note beats; all playback
// times are seconds. This module deliberately knows nothing about the input UI.
export const SCORE_LIMITS = Object.freeze({ notes: 4096, bars: 256, jsonBytes: 2 * 1024 * 1024 });
const KEYS = new Set(['C','G','D','A','E','B','F#','C#','F','Bb','Eb','Ab','Db','Gb','Cb','Am','Em','Bm','F#m','C#m','G#m','D#m','A#m','Dm','Gm','Cm','Fm','Bbm','Ebm','Abm']);
const EPS = 1e-7;
let nextId = 0;
const fail = message => { throw new Error(message); };
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function text(value, label, max, fallback = '') {
  if (value === undefined) return fallback;
  if (typeof value !== 'string') fail(`${label}必须是文字。`);
  const result = value.trim();
  if (result.length > max) fail(`${label}不能超过 ${max} 个字符。`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(result)) fail(`${label}含有无效控制字符。`);
  return result;
}
function number(value, label, min, max, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    fail(`${label}必须是 ${min}–${max} 之间的${integer ? '整数' : '数字'}。`);
  }
  return value;
}
function identifier(value, label, fallback) {
  const result = text(value, label, 96, fallback);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/u.test(result)) fail(`${label}只能使用字母、数字、点、冒号、下划线或短横线。`);
  return result;
}
export function beatsPerBar(score) { return score.timeSignature[0] * 4 / score.timeSignature[1]; }
export function barCount(score) { return Math.max(1, Math.ceil((score.totalBeats - EPS) / beatsPerBar(score))); }

export function normalizeScore(raw) {
  if (!record(raw)) fail('谱子必须是一个 JSON 对象。');
  if (raw.schemaVersion !== undefined && raw.schemaVersion !== 2 && raw.schemaVersion !== 1) fail('不支持这个谱子版本；请使用 schemaVersion: 2。');
  let input = raw;
  if (raw.pitches !== undefined && raw.notes === undefined) {
    if (!Array.isArray(raw.pitches) || !Array.isArray(raw.lengths) || raw.pitches.length !== raw.lengths.length) fail('旧版谱子的 pitches 和 lengths 必须是长度相同的数组。');
    if (raw.pitches.length > SCORE_LIMITS.notes) fail(`每首最多支持 ${SCORE_LIMITS.notes} 个音符或休止符。`);
    let beat = 0;
    const notes = raw.pitches.map((pitch, index) => {
      const duration = number(raw.lengths[index], `第 ${index + 1} 个音的时值`, .000001, 8192);
      const note = { id: `n${index + 1}`, pitch, beat, duration, hand: 'right' };
      beat += duration;
      return note;
    });
    input = { ...raw, schemaVersion: 2, notes, totalBeats: raw.totalBeats ?? (beat || 4) };
  } else if (raw.schemaVersion === 1) fail('旧版谱子需要 pitches 和 lengths 两个数组。');
  if (!Array.isArray(input.notes)) fail('谱子缺少 notes 数组。');
  if (input.notes.length > SCORE_LIMITS.notes) fail(`每首最多支持 ${SCORE_LIMITS.notes} 个音符或休止符。`);
  const ts = input.timeSignature ?? [4, 4];
  if (!Array.isArray(ts) || ts.length !== 2) fail('拍号 timeSignature 应为 [分子, 分母]，例如 [4, 4]。');
  number(ts[0], '拍号分子', 1, 16, true);
  if (![1,2,4,8,16,32].includes(ts[1])) fail('拍号分母只能是 1、2、4、8、16 或 32。');
  const maxBeats = ts[0] * 4 / ts[1] * SCORE_LIMITS.bars;
  const title = text(input.title, '曲名', 120, '未命名练习');
  if (!title) fail('请填写曲名。');
  const ids = new Set();
  const notes = input.notes.map((note, index) => {
    if (!record(note)) fail(`第 ${index + 1} 个音符必须是对象。`);
    const label = `第 ${index + 1} 个音符`;
    const id = identifier(note.id, `${label}的 id`, `n${index + 1}`);
    if (ids.has(id)) fail(`音符 id「${id}」重复；每个音符需要独立的 id。`);
    ids.add(id);
    if (note.pitch !== null) number(note.pitch, `${label}的音高 pitch`, 21, 108, true);
    const beat = number(note.beat, `${label}的起始拍 beat`, 0, maxBeats);
    const duration = number(note.duration, `${label}的时值 duration`, .000001, maxBeats);
    if (beat + duration > maxBeats + EPS) fail(`第 ${index + 1} 个音符超出 ${SCORE_LIMITS.bars} 小节上限。`);
    const hand = note.hand ?? 'right';
    if (!['right','left'].includes(hand)) fail(`${label}的 hand 只能是 right 或 left。`);
    const result = { id, pitch: note.pitch, beat, duration, hand };
    if (note.finger !== undefined && note.finger !== null) result.finger = number(note.finger, `${label}的指法 finger`, 1, 5, true);
    return result;
  }).sort((a, b) => a.beat - b.beat || (a.hand === b.hand ? 0 : a.hand === 'right' ? -1 : 1) || (a.pitch ?? -1) - (b.pitch ?? -1));
  const noteEnd = notes.reduce((end, note) => Math.max(end, note.beat + note.duration), 0);
  const totalBeats = number(input.totalBeats ?? Math.max(ts[0] * 4 / ts[1], noteEnd), '总拍数 totalBeats', .000001, maxBeats);
  if (noteEnd > totalBeats + EPS) fail('总拍数 totalBeats 小于最后一个音符的结束位置。');
  const keySignature = text(input.keySignature, '调号', 4, 'C');
  if (!KEYS.has(keySignature)) fail('暂不支持这个调号；请使用 C、G、F、Bb 或 Am 等标准名称。');
  const result = {
    schemaVersion: 2,
    id: identifier(input.id, '谱子 id', `score-${Date.now().toString(36)}-${++nextId}`),
    title,
    composer: text(input.composer, '作曲者', 120),
    collection: text(input.collection, '曲集', 120, '我的曲谱'),
    level: text(input.level, '难度', 40, '自定义'),
    bpm: number(input.bpm ?? 80, '速度 bpm', 10, 1000),
    timeSignature: [...ts], keySignature, notes, totalBeats,
  };
  if (input.source !== undefined) {
    if (!record(input.source)) fail('来源 source 必须是对象。');
    result.source = {
      label: text(input.source.label, '来源名称', 200),
      url: text(input.source.url, '来源链接', 2048),
      note: text(input.source.note, '来源说明', 2000),
    };
    if (result.source.url && !/^https?:\/\/[^\s]+$/iu.test(result.source.url)) fail('来源链接只允许 http:// 或 https:// 网址。');
  }
  if (input.tempoMap !== undefined) {
    if (!Array.isArray(input.tempoMap) || input.tempoMap.length > 1024) fail('tempoMap 必须是数组，最多支持 1024 次速度变化。');
    const tempoBeats = new Set();
    result.tempoMap = input.tempoMap.map((tempo, index) => {
      if (!record(tempo)) fail(`第 ${index + 1} 个速度变化必须是对象。`);
      const beat = number(tempo.beat, '速度变化位置 beat', 0, totalBeats);
      if (tempoBeats.has(beat)) fail('同一拍不能有两个速度设置。');
      tempoBeats.add(beat);
      return { beat, bpm: number(tempo.bpm, '速度变化 bpm', 10, 1000) };
    }).sort((a, b) => a.beat - b.beat);
  }
  if (input.tags !== undefined) {
    if (!Array.isArray(input.tags) || input.tags.length > 24) fail('标签 tags 必须是数组，最多 24 个。');
    result.tags = [...new Set(input.tags.map(tag => text(tag, '标签', 40)))].filter(Boolean);
  }
  return result;
}

export function parseScoreJSON(value) {
  if (typeof value !== 'string') fail('请提供 JSON 文字。');
  if (new TextEncoder().encode(value).length > SCORE_LIMITS.jsonBytes) fail('JSON 文件不能超过 2 MB。');
  let raw;
  try { raw = JSON.parse(value.replace(/^\uFEFF/u, '')); }
  catch { fail('JSON 格式不正确，请检查引号、逗号与括号。'); }
  return normalizeScore(raw);
}
export function serializeScore(score) { return JSON.stringify(normalizeScore(score), null, 2); }

// Changing the practice BPM scales the entire tempo map by the same ratio.
export function beatToSeconds(beat, score, bpmOverride = score.bpm) {
  number(beat, '拍位置', 0, Infinity);
  number(bpmOverride, '练习速度', 10, 1000);
  const ratio = bpmOverride / score.bpm;
  let cursor = 0, seconds = 0, tempo = score.bpm;
  for (const change of score.tempoMap ?? []) {
    if (change.beat > beat) break;
    seconds += (change.beat - cursor) * 60 / (tempo * ratio);
    cursor = change.beat;
    tempo = change.bpm;
  }
  return seconds + (beat - cursor) * 60 / (tempo * ratio);
}
function range(score, options = {}) {
  const lastBar = barCount(score);
  const startBar = options.startBar ?? 1;
  const endBar = options.endBar ?? lastBar;
  number(startBar, '起始小节', 1, lastBar, true);
  number(endBar, '结束小节', startBar, lastBar, true);
  const bpm = options.bpm ?? score.bpm;
  number(bpm, '练习速度', 10, 1000);
  const hand = options.hand ?? 'both';
  if (!['both','left','right'].includes(hand)) fail('练习声部只能是 both、left 或 right。');
  return { start: (startBar - 1) * beatsPerBar(score), end: Math.min(endBar * beatsPerBar(score), score.totalBeats), bpm, hand };
}
export function scoreToTimedNotes(score, options = {}) {
  const { start, end, bpm, hand } = range(score, options);
  const startTime = beatToSeconds(start, score, bpm);
  return score.notes.map((note, index) => ({ ...note, index }))
    .filter(note => note.pitch !== null && (hand === 'both' || note.hand === hand) && note.beat >= start - EPS && note.beat < end - EPS)
    .map(note => {
      const endBeat = Math.min(note.beat + note.duration, end);
      const time = beatToSeconds(note.beat, score, bpm);
      return { ...note, time: time - startTime, duration: beatToSeconds(endBeat, score, bpm) - time, beats: endBeat - note.beat, bar: Math.floor((note.beat + EPS) / beatsPerBar(score)) + 1 };
    });
}
export function scoreDuration(score, options = {}) {
  const { start, end, bpm } = range(score, options);
  return beatToSeconds(end, score, bpm) - beatToSeconds(start, score, bpm);
}
export function toLegacyExercise(score) {
  const normalized = normalizeScore(score);
  let cursor = 0;
  for (const note of normalized.notes) {
    if (note.hand !== 'right' || note.pitch === null || Math.abs(note.beat - cursor) > EPS) fail('旧版格式只能保存连续的右手单音旋律；请导出 v2 JSON 以保留完整曲谱。');
    cursor += note.duration;
  }
  if (Math.abs(cursor - normalized.totalBeats) > EPS || (normalized.tempoMap?.length ?? 0) > 1) fail('旧版格式不能保留末尾休止或变速；请导出 v2 JSON。');
  return { id: normalized.id, title: normalized.title, composer: normalized.composer, bpm: normalized.bpm, pitches: normalized.notes.map(note => note.pitch), lengths: normalized.notes.map(note => note.duration) };
}
