// Standard MIDI File (SMF) reader/writer. No network or third-party runtime.
import { normalizeScore } from './score-model.mjs';

const MAX_BYTES = 16 * 1024 * 1024;
const fail = message => { throw new Error(message); };
const ascii = bytes => String.fromCharCode(...bytes);
const decodeName = bytes => new TextDecoder().decode(bytes).replace(/[\u0000-\u001f]/gu, '').trim().slice(0, 120);
class Reader {
  constructor(bytes) { this.bytes = bytes; this.pos = 0; }
  get remaining() { return this.bytes.length - this.pos; }
  take(length) {
    if (!Number.isSafeInteger(length) || length < 0 || length > this.remaining) fail('MIDI 文件不完整：数据被截断。');
    const value = this.bytes.subarray(this.pos, this.pos + length); this.pos += length; return value;
  }
  u8() { return this.take(1)[0]; }
  u16() { const b = this.take(2); return b[0] * 256 + b[1]; }
  u32() { const b = this.take(4); return b[0] * 16777216 + b[1] * 65536 + b[2] * 256 + b[3]; }
  vlq() {
    let value = 0;
    for (let i = 0; i < 4; i++) { const byte = this.u8(); value = value * 128 + (byte & 127); if (byte < 128) return value; }
    fail('MIDI 的变长数字无效（超过 4 字节）。');
  }
}
function inputBytes(value) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  fail('请提供 MIDI 文件的 ArrayBuffer 或 Uint8Array。');
}

export function parseMidi(arrayBuffer, { title } = {}) {
  const bytes = inputBytes(arrayBuffer);
  if (bytes.byteLength > MAX_BYTES) fail('MIDI 文件不能超过 16 MB。');
  const reader = new Reader(bytes);
  if (ascii(reader.take(4)) !== 'MThd') fail('这不是标准 MIDI 文件：缺少 MThd 文件头。');
  const headerLength = reader.u32();
  if (headerLength < 6) fail('MIDI 文件头长度无效。');
  const header = new Reader(reader.take(headerLength));
  const format = header.u16(), trackCount = header.u16(), division = header.u16();
  if (![0,1].includes(format)) fail('目前支持 MIDI 类型 0 和 1；类型 2 请先转为类型 1。');
  if (division & 0x8000) fail('暂不支持 SMPTE 时间码 MIDI；请在音乐软件中导出按拍计时（PPQ）的 MIDI。');
  if (!division) fail('MIDI 每拍 tick 数不能为 0。');
  if (!trackCount || trackCount > 128 || (format === 0 && trackCount !== 1)) fail('MIDI 轨道数量无效，最多支持 128 个原始轨道。');
  const warnings = new Set(), tracks = [], tempos = [], signatures = [], keys = [];
  let durationTicks = 0, totalEvents = 0, noteCount = 0, noteStarts = 0, unknownChunks = 0;
  for (let index = 0; index < trackCount;) {
    const chunk = ascii(reader.take(4));
    const length = reader.u32();
    const data = reader.take(length);
    if (chunk !== 'MTrk') { warnings.add('已跳过不支持的附加 MIDI 数据块。'); if (++unknownChunks > 128) fail('MIDI 附加数据块过多。'); continue; }
    const trackReader = new Reader(data);
    let tick = 0, running = null, name = '', ended = false;
    const active = new Map(), channels = new Map();
    const channelTrack = channel => {
      if (!channels.has(channel)) channels.set(channel, { id: `track-${index}-ch-${channel}`, index, name: '', channel, notes: [] });
      return channels.get(channel);
    };
    const finishNote = (key, endTick) => {
      const queue = active.get(key);
      if (!queue?.length) { warnings.add('部分抬键事件没有对应按键，已忽略。'); return; }
      const start = queue.shift();
      if (!queue.length) active.delete(key);
      if (start.channel === 9) { warnings.add('已忽略打击乐声部（第 10 通道），只导入琴键音符。'); return; }
      if (start.pitch < 21 || start.pitch > 108) { warnings.add('已忽略 88 键钢琴范围以外的音符。'); return; }
      if (++noteCount > 32768) fail('MIDI 音符过多，请先裁剪为短练习片段（最多读取 32768 个音）。');
      channelTrack(start.channel).notes.push({ id: `m${index}-${noteCount}`, pitch: start.pitch, beat: start.tick / division, duration: Math.max(1, endTick - start.tick) / division, hand: start.pitch < 60 ? 'left' : 'right', velocity: start.velocity });
    };
    while (trackReader.remaining) {
      if (++totalEvents > 500000) fail('MIDI 事件过多，请先裁剪文件。');
      tick += trackReader.vlq();
      if (!Number.isSafeInteger(tick) || tick / division > 1000000) fail('MIDI 时间跨度过大，请先裁剪文件。');
      let status = trackReader.u8(), firstData;
      if (status < 128) {
        if (running === null) fail('MIDI 的 running status 无效：缺少前一个音符状态。');
        firstData = status; status = running;
      }
      if (status === 0xff) {
        running = null;
        const kind = trackReader.u8(), size = trackReader.vlq(), meta = trackReader.take(size);
        if (kind === 0x03) name = decodeName(meta);
        else if (kind === 0x2f) {
          if (size !== 0) fail('MIDI 轨道结束事件无效。');
          ended = true;
          if (trackReader.remaining) warnings.add('轨道结束标记之后的附加字节已忽略。');
          break;
        } else if (kind === 0x51) {
          if (size !== 3) fail('MIDI 速度事件必须是 3 字节。');
          const microseconds = meta[0] * 65536 + meta[1] * 256 + meta[2];
          if (!microseconds) fail('MIDI 速度值不能为 0。');
          tempos.push({ tick, bpm: 60000000 / microseconds });
        } else if (kind === 0x58) {
          if (size !== 4 || meta[0] === 0 || meta[1] > 5) fail('MIDI 拍号无效或暂不支持。');
          signatures.push({ tick, value: [meta[0], 2 ** meta[1]] });
        } else if (kind === 0x59 && size === 2) {
          const sharpFlats = meta[0] > 127 ? meta[0] - 256 : meta[0];
          const major = ['Cb','Gb','Db','Ab','Eb','Bb','F','C','G','D','A','E','B','F#','C#'];
          const minor = ['Abm','Ebm','Bbm','Fm','Cm','Gm','Dm','Am','Em','Bm','F#m','C#m','G#m','D#m','A#m'];
          if (sharpFlats >= -7 && sharpFlats <= 7 && meta[1] <= 1) keys.push({ tick, value: (meta[1] ? minor : major)[sharpFlats + 7] });
        }
        continue;
      }
      if (status === 0xf0 || status === 0xf7) { running = null; trackReader.take(trackReader.vlq()); continue; }
      if (status < 0x80 || status >= 0xf0) fail(`MIDI 含有不支持的系统事件 0x${status.toString(16)}。`);
      running = status;
      const command = status >> 4, channel = status & 15;
      const first = firstData ?? trackReader.u8();
      const second = [0xc,0xd].includes(command) ? undefined : trackReader.u8();
      if (first > 127 || (second !== undefined && second > 127)) fail('MIDI 事件的数据字节无效。');
      const key = `${channel}:${first}`;
      if (command === 0x9 && second > 0) {
        if (++noteStarts > 32768) fail('MIDI 按键事件过多，请先裁剪为短练习片段（最多读取 32768 个音）。');
        if (!active.has(key)) active.set(key, []);
        active.get(key).push({ tick, channel, pitch: first, velocity: second });
      } else if (command === 0x8 || (command === 0x9 && second === 0)) finishNote(key, tick);
      else if (command === 0xb && first === 64 && second >= 64) warnings.add('延音踏板已忽略；谱面时值按按键与抬键计算。');
    }
    if (!ended) warnings.add('部分轨道没有结束标记，已按文件内的完整事件读取。');
    if (active.size) {
      warnings.add('部分音符缺少抬键，已在轨道末尾结束。');
      for (const [key, queue] of [...active]) while (queue.length) finishNote(key, Math.max(tick, queue[0].tick + 1));
    }
    durationTicks = Math.max(durationTicks, tick);
    for (const entry of channels.values()) {
      entry.name = (name || `轨道 ${index + 1}`) + (channels.size > 1 ? ` · 通道 ${entry.channel + 1}` : '');
      entry.notes.sort((a, b) => a.beat - b.beat || a.pitch - b.pitch);
      if (entry.notes.length) tracks.push(entry);
    }
    index++;
  }
  if (reader.remaining) warnings.add('声明轨道之外的附加文件内容已忽略。');
  tempos.sort((a, b) => a.tick - b.tick);
  const tempoAtTick = new Map([[0, 120]]);
  for (const entry of tempos) tempoAtTick.set(entry.tick, entry.bpm);
  const tempoMap = [...tempoAtTick].sort((a, b) => a[0] - b[0]).map(([tick, bpm]) => ({ beat: tick / division, bpm }));
  signatures.sort((a, b) => a.tick - b.tick);
  const timeSignature = signatures[0]?.value ?? [4,4];
  if (signatures.some(entry => entry.value[0] !== timeSignature[0] || entry.value[1] !== timeSignature[1])) warnings.add('文件包含换拍，目前统一使用第一个拍号；请核对小节划分。');
  keys.sort((a, b) => a.tick - b.tick);
  const keySignature = keys[0]?.value ?? 'C';
  if (keys.some(entry => entry.value !== keySignature)) warnings.add('文件包含转调，目前统一显示第一个调号。');
  const durationBeats = Math.max(durationTicks / division, ...tracks.map(track => track.notes.reduce((end, note) => Math.max(end, note.beat + note.duration), 0)));
  return { format, ticksPerBeat: division, title: title || '导入的 MIDI 练习', tracks, bpm: tempoMap[0].bpm, timeSignature, keySignature, tempoMap, warnings: [...warnings], durationBeats };
}

export function midiToScore(parsed, { trackIds, rightTrackIds, leftTrackIds, quantize = .25, title } = {}) {
  if (!parsed || !Array.isArray(parsed.tracks)) fail('请先读取有效的 MIDI 文件。');
  if (typeof quantize !== 'number' || !Number.isFinite(quantize) || quantize < 0 || quantize > 4 || (quantize > 0 && quantize < 1 / 64)) fail('量化精度应为 0（不量化）或 1/64–4 个四分音符拍。');
  const allIds = new Set(parsed.tracks.map(track => track.id));
  function idSet(value, label) {
    if (value === undefined) return undefined;
    if (!Array.isArray(value) || value.some(id => !allIds.has(id))) fail(`${label}含有不存在的轨道。`);
    return new Set(value);
  }
  const right = idSet(rightTrackIds, '右手选择') ?? new Set();
  const left = idSet(leftTrackIds, '左手选择') ?? new Set();
  if ([...right].some(id => left.has(id))) fail('同一个轨道不能同时指定为左手和右手；可使用自动按音区分手。');
  const requested = idSet(trackIds, '轨道选择') ?? ((right.size || left.size) ? new Set([...right, ...left]) : allIds);
  if (!requested.size) fail('请至少选择一个有音符的轨道。');
  const snap = value => quantize ? Math.round(value / quantize) * quantize : value;
  const notes = parsed.tracks.filter(track => requested.has(track.id)).flatMap(track => track.notes.map(note => ({
    id: note.id,
    pitch: note.pitch,
    beat: Math.max(0, snap(note.beat)),
    duration: Math.max(quantize || 1 / (parsed.ticksPerBeat || 480), snap(note.beat + note.duration) - snap(note.beat)),
    hand: right.has(track.id) ? 'right' : left.has(track.id) ? 'left' : note.pitch < 60 ? 'left' : 'right',
  })));
  if (!notes.length) fail('所选轨道没有可练习的钢琴音符。');
  // Files often layer the same piano notes. Do not count those as two key strikes.
  const unique = new Map();
  for (const note of notes) {
    const key = `${note.hand}:${note.pitch}:${note.beat.toFixed(7)}`;
    const previous = unique.get(key);
    if (previous) previous.duration = Math.max(previous.duration, note.duration);
    else unique.set(key, note);
  }
  const selectedNotes = [...unique.values()];
  const barBeats = parsed.timeSignature[0] * 4 / parsed.timeSignature[1];
  const end = selectedNotes.reduce((last, note) => Math.max(last, note.beat + note.duration), 0);
  const totalBeats = Math.ceil((end - 1e-7) / barBeats) * barBeats;
  const tempoMap = (parsed.tempoMap ?? []).filter(tempo => tempo.beat < totalBeats);
  return normalizeScore({ schemaVersion: 2, title: title || parsed.title || '导入的 MIDI 练习', composer: '', collection: '我的曲谱', level: '自定义', bpm: parsed.bpm, timeSignature: parsed.timeSignature, keySignature: parsed.keySignature || 'C', notes: selectedNotes, totalBeats, tempoMap, source: { label: 'MIDI 文件导入', note: quantize ? `音符已按 ${quantize} 个四分音符拍对齐；请核对手别与谱面。` : '保留原始起音和时值；请核对手别与谱面。' }, tags: ['MIDI 导入'] });
}

const u16 = value => [(value >>> 8) & 255, value & 255];
const u32 = value => [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
function vlq(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0x0fffffff) fail('MIDI 导出时间跨度超出支持范围。');
  const result = [value & 127];
  while ((value = Math.floor(value / 128))) result.unshift((value & 127) | 128);
  return result;
}
const encoded = value => [...new TextEncoder().encode(value)];
const meta = (kind, data) => [255, kind, ...vlq(data.length), ...data];
function writeTrack(events, endTick) {
  const data = [];
  let cursor = 0;
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  for (const event of events) { data.push(...vlq(event.tick - cursor), ...event.bytes); cursor = event.tick; }
  data.push(...vlq(Math.max(cursor, endTick) - cursor), 255, 47, 0);
  return [...encoded('MTrk'), ...u32(data.length), ...data];
}
export function exportMidi(value) {
  const score = normalizeScore(value);
  const ppq = 480, endTick = Math.round(score.totalBeats * ppq);
  const tempos = new Map([[0, score.bpm]]);
  for (const tempo of score.tempoMap ?? []) tempos.set(Math.round(tempo.beat * ppq), tempo.bpm);
  const conductor = [
    { tick: 0, order: 0, bytes: meta(3, encoded(score.title)) },
    { tick: 0, order: 1, bytes: meta(0x58, [score.timeSignature[0], Math.log2(score.timeSignature[1]), 24, 8]) },
  ];
  const major = ['Cb','Gb','Db','Ab','Eb','Bb','F','C','G','D','A','E','B','F#','C#'];
  const minor = ['Abm','Ebm','Bbm','Fm','Cm','Gm','Dm','Am','Em','Bm','F#m','C#m','G#m','D#m','A#m'];
  const isMinor = minor.includes(score.keySignature);
  conductor.push({ tick: 0, order: 2, bytes: meta(0x59, [((isMinor ? minor : major).indexOf(score.keySignature) - 7) & 255, isMinor ? 1 : 0]) });
  for (const [tick, bpm] of tempos) {
    const micros = Math.round(60000000 / bpm);
    conductor.push({ tick, order: 3, bytes: meta(0x51, [(micros >>> 16) & 255, (micros >>> 8) & 255, micros & 255]) });
  }
  const output = [...encoded('MThd'), ...u32(6), ...u16(1), ...u16(3), ...u16(ppq), ...writeTrack(conductor, endTick)];
  for (const [channel, hand] of ['right','left'].entries()) {
    const events = [{ tick: 0, order: 0, bytes: meta(3, encoded(hand === 'right' ? 'Right hand · 右手' : 'Left hand · 左手')) }, { tick: 0, order: 1, bytes: [0xc0 | channel, 0] }];
    for (const note of score.notes.filter(note => note.hand === hand && note.pitch !== null)) {
      const tick = Math.round(note.beat * ppq), end = Math.max(tick + 1, Math.round((note.beat + note.duration) * ppq));
      events.push({ tick, order: 3, bytes: [0x90 | channel, note.pitch, 80] }, { tick: end, order: 2, bytes: [0x80 | channel, note.pitch, 0] });
    }
    output.push(...writeTrack(events, endTick));
  }
  return new Uint8Array(output);
}
