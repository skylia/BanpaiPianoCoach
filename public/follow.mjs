import {validateEvaluationProfile,evaluationVersion,musicalTiming,musicalDynamics,ornamentEvidence,median} from './evaluation.mjs';
// A deterministic, input-independent score follower. Times are seconds from the
// end of the count-in. A short onset window prevents an extra chord key from
// being assigned to the next target before the current attempt is evaluated.
export const FOLLOW_VERSION = 'banpai-follow-1';
export const isFollow = take => take?.options?.practiceMode === 'follow';

export function normalizeFollowSummary(raw) {
  if (!raw || typeof raw!=='object') throw Error('跟弹摘要无效。');
  const out={};
  for (const key of ['totalGroups','attemptedGroups','completedGroups','firstPassGroups','errorAttempts','wrongAttempts','incompleteAttempts','rhythmCount','rhythmSteady']) {
    const n=raw[key];if (!Number.isInteger(n)||n<0||n>(key.endsWith('Attempts')?8192:4096)) throw Error('跟弹计数无效。');out[key]=n;
  }
  if (!out.totalGroups||out.attemptedGroups>out.totalGroups||out.completedGroups>out.attemptedGroups||out.firstPassGroups>out.completedGroups||out.rhythmCount>out.attemptedGroups||out.rhythmSteady>out.rhythmCount||out.wrongAttempts>out.errorAttempts||out.incompleteAttempts>out.errorAttempts) throw Error('跟弹计数关系无效。');
  if (!Number.isFinite(raw.correctionSeconds)||raw.correctionSeconds<0||raw.correctionSeconds>86400) throw Error('纠错时长无效。');
  return {...out,correctionSeconds:raw.correctionSeconds};
}

export function aggregateFollow(records) {
  const following=records.filter(a=>a.kind==='capture'&&a.practiceMode==='follow'&&a.follow);
  const complete=following.filter(a=>a.complete),timed=complete.filter(a=>a.follow.rhythmCount>=3);
  const sum=(list,key)=>list.reduce((s,a)=>s+a.follow[key],0),rhythmCount=sum(timed,'rhythmCount'),total=sum(complete,'totalGroups');
  return {sessions:following.length,errorAttempts:sum(following,'errorAttempts'),correctionSeconds:sum(following,'correctionSeconds'),firstPass:total?Math.round(sum(complete,'firstPassGroups')/total*100):null,rhythm:rhythmCount?Math.round(sum(timed,'rhythmSteady')/rhythmCount*100):null};
}

export class FollowSession {
  constructor(notes, bpm, {evaluationProfile,ornaments=notes.ornaments??[]}={}) {
    validateEvaluationProfile(evaluationProfile);this.evaluationProfile=evaluationProfile;this.ornaments=evaluationProfile==='musical'?ornaments.map(o=>({...o,events:[],closed:false})):[];this.ornamentResults=[];
    const grace=new Set(this.ornaments.flatMap(o=>o.graceNoteIds));notes=notes.filter(n=>!grace.has(n.id));
    this.bpm = bpm; this.index = 0; this.errorAttempts = 0; this.pending = null; this.completedAt = null;
    this.groups = [];
    for (const note of notes.toSorted((a,b)=>a.time-b.time)) {
      let group = this.groups.at(-1);
      if (!group || Math.abs(note.time-group.time)>1e-6) {
        group = {time:note.time, beat:note.beat, bar:note.bar, notes:[], pitches:[], attempts:[], firstTime:null, passedTime:null, delta:null};
        this.groups.push(group);
      }
      group.notes.push(note);
      if (!group.pitches.includes(note.pitch)) group.pitches.push(note.pitch);
    }
    for (let i=0;i<this.groups.length;i++) {
      const group=this.groups[i], gap=this.groups[i+1]?.time-group.time;
      const previousGap=group.time-this.groups[i-1]?.time;
      group.window=Math.max(1e-7,Math.min(.12,Number.isFinite(gap)?gap*.4:.12,Number.isFinite(previousGap)?previousGap*.4:.12));
      group.tolerance=Math.max(.08,Math.min(.18,(previousGap||60/bpm)*.22));
    }
  }
  get done() { return this.index>=this.groups.length; }
  get current() { return this.groups[this.index]??null; }
  accept(note, eventIndex) {
    if (!Number.isInteger(note.pitch)||!Number.isFinite(note.time)||note.time<0) return;
    this.flush(note.time);
    if (this.done) {for(const o of this.ornaments)if(o.events.length&&!o.closed)o.events.push(note);return;}
    const group=this.current;
    for(const o of this.ornaments){
      const currentMain=group.notes.some(n=>n.id===o.noteId),active=o.events.length&&!o.closed;
      if(active&&group.time>=o.endTime-1e-6&&group.pitches.includes(note.pitch)){
        const ratios=this.groups.slice(1,this.index).map((g,i)=>{const p=this.groups[i];return g.passedTime!==null&&p.passedTime!==null?(g.passedTime-p.passedTime)/(g.time-p.time):null;}).filter(v=>Number.isFinite(v)&&v>0),pace=median(ratios.slice(-5))??1;
        const tail=o.gracePitches.length&&o.gracePitches.every((p,i)=>o.events.at(i-o.gracePitches.length)?.pitch===p),due=o.events[0].time+(o.endTime-o.time)*pace*.95;
        if(tail||note.time>=due){this.closeOrnament(o);continue;}
        o.events.push(note);return;
      }
      if(currentMain&&(note.pitch===o.mainPitch||note.pitch===o.auxiliaryPitch)){
        o.events.push(note);
        // A quick alternation can arrive while the first two-hand chord is
        // still collecting its keys. It belongs to the trill, not a duplicate
        // chord key. The accompaniment must still complete the pending chord.
        if(this.pending?.events.some(e=>e.pitch===o.mainPitch))return;
        if(note.pitch===o.auxiliaryPitch)note={...note,pitch:o.mainPitch};break;
      }
      if(active&&!group.pitches.includes(note.pitch)){o.events.push(note);return;}
    }
    if (group.firstTime===null) {
      group.firstTime=note.time;
      const previous=this.groups[this.index-1];
      // Restart the next interval from the successful attempt. A correction
      // penalizes its own step once, instead of making every later note late.
      const due=previous?previous.passedTime+group.time-previous.time:group.time;
      group.delta=note.time-due;
    }
    this.pending??={time:note.time,events:[]};
    this.pending.events.push({pitch:note.pitch,index:eventIndex});
  }
  flush(now, force=false) {
    if(force)for(const o of this.ornaments)if(o.events.length&&!o.closed)this.closeOrnament(o);
    if (!this.pending || (!force&&now+1e-9<this.pending.time+this.current.window)) return false;
    const group=this.current, attempt=this.pending, actual=attempt.events.map(e=>e.pitch), wanted=new Set(group.pitches), seen=new Set();
    attempt.wrong=[];
    for (const pitch of actual) {if (!wanted.has(pitch)||seen.has(pitch)) attempt.wrong.push(pitch);seen.add(pitch);}
    attempt.missing=group.pitches.filter(p=>!seen.has(p));
    attempt.passed=!attempt.wrong.length&&!attempt.missing.length;
    group.attempts.push(attempt);this.pending=null;if(!attempt.passed)this.errorAttempts++;
    if (attempt.passed) {
      group.passedTime=attempt.time;this.index++;
      if (this.done) this.completedAt=attempt.time+group.window;
    }
    return true;
  }
  closeOrnament(o){
    if(o.closed)return;o.closed=true;
    const r=ornamentEvidence(o,o.events),allowed=new Set([o.mainPitch,o.auxiliaryPitch,...o.gracePitches]);r.wrongPitches=[...new Set(o.events.filter(n=>!allowed.has(n.pitch)).map(n=>n.pitch))];r.valid&&=!r.wrongPitches.length;
    if(r.wrongPitches.length)r.message='装饰音时段出现标注音组以外的音，请回听核对。';
    this.ornamentResults.push(r);
    if(!r.valid){const g=this.groups.find(g=>g.notes.some(n=>n.id===o.noteId));if(g){g.attempts.push({time:o.events[0]?.time??g.firstTime,events:[],wrong:r.wrongPitches,missing:r.alternations<2?[o.auxiliaryPitch]:[],passed:false,ornament:true});this.errorAttempts++;}}
  }
  musicalTiming(){let time=0;return musicalTiming(this.groups.map((g,i)=>{if(i&&g.firstTime!==null&&this.groups[i-1].passedTime!==null)time+=g.firstTime-this.groups[i-1].passedTime;return {time:g.time,bar:g.bar,playedTime:g.firstTime===null?null:time};}));}
  summary(elapsed=0) {
    const attempted=this.groups.filter(g=>g.firstTime!==null), completed=attempted.filter(g=>g.passedTime!==null);
    const errorAttempts=attempted.reduce((s,g)=>s+g.attempts.filter(a=>!a.passed).length,0);
    const wrongAttempts=attempted.reduce((s,g)=>s+g.attempts.filter(a=>a.wrong.length).length,0);
    const incompleteAttempts=attempted.reduce((s,g)=>s+g.attempts.filter(a=>a.missing.length).length,0);
    const firstPassGroups=completed.filter(g=>g.attempts.length===1).length;
    if(this.evaluationProfile==='musical'){const timing=this.musicalTiming();this.groups.forEach((g,i)=>Object.assign(g,timing.entries[i]));}
    const rhythmSteady=attempted.filter(g=>g.delta!==null&&Math.abs(g.delta)<=g.tolerance).length;
    const correctionSeconds=attempted.reduce((s,g)=>s+(g.attempts.some(a=>!a.passed)?Math.max(0,(g.passedTime??elapsed)-g.firstTime):0),0);
    return {totalGroups:this.groups.length,attemptedGroups:attempted.length,completedGroups:completed.length,firstPassGroups,errorAttempts,wrongAttempts,incompleteAttempts,correctionSeconds,rhythmCount:this.evaluationProfile==='musical'?attempted.filter(g=>g.delta!==null).length:attempted.length,rhythmSteady};
  }
}

export function analyzeFollow(notes, events, bpm, {elapsed=0, interrupted=false,evaluationProfile,ornaments=notes.ornaments??[]}={}) {
  const session=new FollowSession(notes,bpm,{evaluationProfile,ornaments});
  events.map((note,index)=>({note,index})).sort((a,b)=>a.note.time-b.note.time||a.index-b.index).forEach(({note,index})=>session.accept(note,index));
  session.flush(elapsed,true);
  const follow=session.summary(elapsed), steps=session.groups.map(g=>({
    beat:g.beat,bar:g.bar,pitches:g.pitches,firstTime:g.firstTime,passedTime:g.passedTime,
    attempts:g.attempts.length,errors:g.attempts.filter(a=>!a.passed).length,
    delta:g.delta,tolerance:g.tolerance,timing:g.delta===null?null:Math.abs(g.delta)<=g.tolerance?'steady':g.delta<0?'early':'late',
    wrongPitches:g.attempts.flatMap(a=>a.wrong),missingPitches:[...new Set(g.attempts.flatMap(a=>a.missing))],
  }));
  const dynamics=musicalDynamics(events);
  return {...(evaluationProfile?{evaluationProfile,analysisVersion:evaluationVersion(evaluationProfile,true)}:{}),targetCount:session.groups.reduce((n,g)=>n+g.notes.length,0),performedToEnd:session.done,observations:evaluationProfile==='musical'?[...session.musicalTiming().observations,...session.ornamentResults.filter(o=>!o.valid).map(o=>({type:'ornament',bar:o.bar,message:o.message})),...(dynamics?[dynamics]:[])]:[],ornamentResults:session.ornamentResults,empty:!follow.attemptedGroups,interrupted,count:events.length,follow,steps,
    pitch:follow.totalGroups?Math.round(follow.firstPassGroups/follow.totalGroups*100):0,
    rhythm:follow.rhythmCount>=3?Math.round(follow.rhythmSteady/follow.rhythmCount*100):null,
    correct:session.groups.filter(g=>g.passedTime!==null&&g.attempts.length===1).reduce((s,g)=>s+g.notes.length,0),
    paired:session.groups.filter(g=>g.passedTime!==null).reduce((s,g)=>s+g.notes.length,0),
    steady:session.groups.filter(g=>g.passedTime!==null&&g.delta!==null&&Math.abs(g.delta)<=g.tolerance).reduce((s,g)=>s+g.notes.length,0),
  };
}
