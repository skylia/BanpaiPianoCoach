export const MAX_DEMO_BYTES = 100 * 1024 * 1024;
export const DEMO_RATES = [.5, .75, 1, 1.25];

export function validateDemoFile(file) {
  if (!file || !Number.isFinite(file.size) || file.size <= 0) throw Error('请选择有内容的音频文件。');
  if (file.size > MAX_DEMO_BYTES) throw Error('单份示范录音不能超过 100 MB。');
  if (!/\.(mp3|m4a|aac|wav|ogg|opus|flac|webm)$/i.test(file.name || '') || (file.type && !/^(audio\/|video\/(mp4|webm))/.test(file.type))) {
    throw Error('请选择 MP3、M4A、WAV、OGG、FLAC 等音频文件；MIDI 文件不是演奏录音。');
  }
}

// A mapping is opt-in and belongs to an exact recording, never inferred from BPM.
// Repeated bars may move backwards while recording time always increases.
export function auditedBarAt(mapping, seconds) {
  if (!mapping?.verified || !mapping.reviewedBy || !Array.isArray(mapping.points) || !Number.isFinite(seconds)) return null;
  let previous = -1, result = null;
  for (const point of mapping.points) {
    if (!Number.isFinite(point.time) || point.time < 0 || point.time <= previous || !Number.isInteger(point.bar) || point.bar < 1) return null;
    previous = point.time;
    if (point.time <= seconds) result = {bar: point.bar, seconds};
  }
  if (!Number.isFinite(mapping.endTime) || seconds >= mapping.endTime || mapping.endTime <= previous) return null;
  return result;
}

export class HumanDemoTransport {
  constructor({audio, onBeforePlay = () => {}, onState = () => {}, onProgress = () => {}, isBusy = () => false, requestFrame = fn => requestAnimationFrame(fn), cancelFrame = id => cancelAnimationFrame(id)}) {
    this.audio = audio; this.onBeforePlay = onBeforePlay; this.onState = onState; this.onProgress = onProgress; this.isBusy = isBusy;
    this.requestFrame = requestFrame; this.cancelFrame = cancelFrame; this.frame = 0; this.version = 0; this.pending = false; this.loop = null; this.mapping = null; this.startTime = 0; this.endTime = null;
    this.listeners = {loadedmetadata: () => {if (this.audio.currentTime < this.startTime) this.audio.currentTime = this.startTime; this.emit();}, durationchange: () => this.emit(), timeupdate: () => this.tick(), pause: () => {this.cancel(); this.emit();}, play: () => this.schedule(), ended: () => this.finish(), error: () => {this.pending = false; this.cancel(); this.emit();}};
    for (const [name, listener] of Object.entries(this.listeners)) audio.addEventListener(name, listener);
    audio.preload = 'metadata'; this.setRate(1);
  }
  get duration() { return Number.isFinite(this.audio.duration) ? Math.max(0, Math.min(this.endTime ?? this.audio.duration, this.audio.duration) - this.startTime) : 0; }
  get position() { return Number.isFinite(this.audio.currentTime) ? Math.max(0, this.audio.currentTime - this.startTime) : 0; }
  get state() { return this.pending ? 'loading' : this.audio.paused ? 'paused' : 'playing'; }
  load(url, mapping = null, segment = {}) {
    const start = segment.startTime ?? 0, end = segment.endTime ?? null;
    if (!Number.isFinite(start) || start < 0 || (end !== null && (!Number.isFinite(end) || end <= start))) throw Error('录音乐章范围无效。');
    this.stop(); this.loop = null; this.mapping = mapping; this.startTime = start; this.endTime = end; this.audio.src = url; this.audio.load();
    try {this.audio.currentTime = start;} catch {/* Metadata completion applies the start after decoding. */}
    this.emit();
  }
  unload() {this.stop(); this.loop = null; this.mapping = null; this.startTime = 0; this.endTime = null; this.audio.removeAttribute('src'); this.audio.load(); this.emit();}
  async play() {
    if (!this.audio.getAttribute('src')) throw Error('先选择一份示范录音。');
    if (this.isBusy()) throw Error('先结束当前练习，再听真人示范。');
    if (this.pending || !this.audio.paused) return;
    const version = ++this.version; this.pending = true; this.emit();
    try {
      await this.onBeforePlay();
      if (version !== this.version || this.isBusy()) {if (version === this.version) this.pending = false; return;}
      if (this.loop && (this.position < this.loop.start || this.position >= this.loop.end)) this.audio.currentTime = this.startTime + this.loop.start;
      else if (this.audio.currentTime < this.startTime || (this.duration && this.position >= this.duration)) this.audio.currentTime = this.startTime;
      await this.audio.play();
      if (version !== this.version) return;
      if (this.isBusy()) {this.pending = false; this.audio.pause(); this.emit(); return;}
      this.pending = false; this.schedule(); this.emit();
    } catch (error) {
      if (version !== this.version) return;
      this.pending = false; this.audio.pause(); this.emit();
      throw Error(error?.name === 'NotAllowedError' ? '浏览器尚未允许播放，请再点一次播放。' : '这份录音暂时无法播放，请检查音频格式或重新导入。');
    }
  }
  pause() {this.version++; this.pending = false; this.audio.pause(); this.cancel(); this.emit();}
  stop() {this.pause(); if (this.audio.getAttribute('src')) {try {this.audio.currentTime = this.startTime;} catch {}} this.onProgress(null); this.emit();}
  seek(seconds) {if (!this.duration) return; this.audio.currentTime = this.startTime + Math.max(0, Math.min(this.duration, Number(seconds) || 0)); this.tick();}
  setRate(rate) {if (!DEMO_RATES.includes(Number(rate))) throw Error('不支持的播放速度。'); this.audio.playbackRate = Number(rate); this.audio.preservesPitch = true; if ('webkitPreservesPitch' in this.audio) this.audio.webkitPreservesPitch = true; this.emit();}
  setLoop(start, end) {if (![start, end].every(Number.isFinite) || start < 0 || end > this.duration || end - start < .5) throw Error('B 点须在 A 点之后，至少相隔 0.5 秒，且不能超出录音。'); this.loop = {start, end}; this.emit();}
  clearLoop() {this.loop = null; this.emit();}
  tick() {
    if (!this.audio.paused && this.loop && this.position >= this.loop.end) this.audio.currentTime = this.startTime + this.loop.start;
    else if (!this.audio.paused && this.duration && this.position >= this.duration) {this.pause(); this.audio.currentTime = this.startTime + this.duration; this.onProgress(null); this.emit(); return;}
    this.onProgress(auditedBarAt(this.mapping, this.audio.currentTime)); this.emit();
  }
  finish() {
    if (this.loop && !this.isBusy()) {this.audio.currentTime = this.startTime + this.loop.start; this.play().catch(() => {});}
    else {this.cancel(); this.pending = false; this.onProgress(null); this.emit();}
  }
  emit() {this.onState({state: this.state, position: this.position, duration: this.duration, rate: this.audio.playbackRate, loop: this.loop, error: !!this.audio.error});}
  schedule() {if (this.frame || this.audio.paused) return; this.frame = this.requestFrame(() => {this.frame = 0; this.tick(); this.schedule();});}
  cancel() {if (this.frame) this.cancelFrame(this.frame); this.frame = 0;}
  destroy() {this.stop(); for (const [name, listener] of Object.entries(this.listeners)) this.audio.removeEventListener(name, listener); this.audio.removeAttribute('src'); this.audio.load();}
}
