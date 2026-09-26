import {median} from './evaluation.mjs';
// A lightweight visual cursor only. Final evaluation uses the offline analyzer.
// Wrong/missing notes never block recording or manufacture a correct result.
export class PerformancePosition {
  constructor(notes) {
    this.ornaments = (notes.ornaments || []).map(o => ({...o, events:[], closed:false}));
    const grace = new Set(this.ornaments.flatMap(o => o.graceNoteIds));
    this.groups = [];
    for (const note of notes) {
      if (grace.has(note.id)) continue;
      let group = this.groups.at(-1);
      if (!group || Math.abs(group.time - note.time) > 1e-6) {
        group = {time:note.time, beat:note.beat, pitches:[], noteIds:[], playedTime:null};
        this.groups.push(group);
      }
      if (!group.pitches.includes(note.pitch)) group.pitches.push(note.pitch);
      group.noteIds.push(note.id);
    }
    this.next = 0; this.index = -1; this.seen = new Set(); this.lastTime = -Infinity;
  }
  accept(event) {
    if (!this.groups.length) return;
    const active = this.ornaments.find(o => o.events.length && !o.closed);
    if (active) {
      const allowed = [active.mainPitch, active.auxiliaryPitch, ...active.gracePitches];
      if (allowed.includes(event.pitch)) {
        const next = this.groups[this.next];
        const played = this.groups.filter(g => g.playedTime !== null);
        const pace = median(played.slice(1).map((g, i) => (g.playedTime-played[i].playedTime)/(g.time-played[i].time)).filter(v=>v>0).slice(-5)) ?? 1;
        const tail = active.gracePitches.length && active.gracePitches.every((p,i)=>active.events.at(i-active.gracePitches.length)?.pitch===p);
        const ending = next?.beat >= active.endBeat && next.pitches.includes(event.pitch);
        if (!ending || !tail && event.time < active.events[0].time + (active.endTime-active.time)*pace*.95) {
          active.events.push(event);
          return;
        }
        active.closed = true;
      }
    }
    // Complete a chord before looking forward; an unexpected key may be missed,
    // but a later matching onset can still move the visual cursor ahead.
    const start = this.groups[this.next];
    const maxBeat = (start?.beat ?? Infinity) + 4;
    for (let i = this.next; i < Math.min(this.groups.length, this.next + 12); i++) {
      const group = this.groups[i];
      if (group.beat > maxBeat) break;
      const ornament = this.ornaments.find(o => !o.closed && group.noteIds.includes(o.noteId));
      const auxiliary = ornament && event.pitch === ornament.auxiliaryPitch;
      if (!group.pitches.includes(event.pitch) && !auxiliary) continue;
      if (active && group.beat >= active.endBeat) active.closed = true;
      if (i !== this.index) this.seen.clear();
      if (ornament && [ornament.mainPitch, ornament.auxiliaryPitch].includes(event.pitch)) ornament.events.push(event);
      this.index = i; this.seen.add(auxiliary ? ornament.mainPitch : event.pitch); this.lastTime = event.time;
      group.playedTime ??= event.time;
      this.next = group.pitches.every(p => this.seen.has(p)) ? i + 1 : i;
      return;
    }
  }
  get beat() { return this.groups[Math.max(0, this.index)]?.beat ?? 0; }
  get progress() { return this.groups.length ? Math.max(0, this.index + 1) / this.groups.length : 0; }
}
