import test from 'node:test';
import assert from 'node:assert/strict';
import {FollowSession,analyzeFollow,FOLLOW_VERSION,normalizeFollowSummary} from '../public/follow.mjs';
import {normalizeScore,scoreToTimedNotes} from '../public/score-model.mjs';
import {takeActivity,normalizeActivity,aggregateActivities,planEvidence,defaultLearning,parseProgressBackup,musicFingerprint} from '../public/progress-model.mjs';
import {buildCoachSummary,validateCoachSummary} from '../public/coach-model.mjs';
const score=normalizeScore({id:'follow-fixture',title:'跟弹测试',bpm:60,timeSignature:[4,4],totalBeats:4,notes:[60,62,64,65].map((pitch,i)=>({id:'n'+i,pitch,beat:i,duration:1,hand:'right'}))});
const options={bpm:60,hand:'right',startBar:1,endBar:1,practiceMode:'follow'}, notes=scoreToTimedNotes(score,options);
const event=(pitch,time)=>({pitch,time,duration:.2,velocity:88});
const perfect=notes.map(n=>event(n.pitch,n.time));
const report=(events,elapsed=20)=>analyzeFollow(notes,events,60,{elapsed});
const take=(events,patch={})=>({id:'follow-test',score,options,bpm:60,source:'midi',startedAt:'2026-09-22T01:00:00Z',date:'2026-09-22T01:00:20Z',elapsed:20,events,interrupted:false,...patch});

test('silence waits indefinitely; wrong notes remain on target until a correct new onset',()=>{
 const f=new FollowSession(notes,60);f.flush(1000);assert.equal(f.index,0);assert.equal(f.summary(1000).errorAttempts,0);
 f.accept(event(61,1000),0);f.flush(1000.2);assert.equal(f.index,0);assert.equal(f.summary(1000.2).errorAttempts,1);
 f.flush(1009);assert.equal(f.summary(1009).errorAttempts,1);f.accept(event(60,1010),1);f.flush(1010.2);assert.equal(f.index,1);assert.equal(f.current.beat,1);
});
test('natural chord order, both hands and duplicate unison notation require one physical press per pitch',()=>{
 const chord=[{...notes[0],pitch:48},{...notes[0],pitch:60},{...notes[0],pitch:60},notes[1]];
 const f=new FollowSession(chord,60);f.accept(event(60,0),0);f.accept(event(48,.06),1);f.flush(.2);assert.equal(f.index,1);assert.equal(f.summary().errorAttempts,0);assert.equal(f.groups[0].pitches.length,2);
 f.flush(100);assert.equal(f.index,1,'holding the previous chord does not advance another target');
});
test('missing or extra chord keys count once per attempt and require the whole chord again',()=>{
 const chord=[{...notes[0],pitch:48},notes[0],notes[1]],f=new FollowSession(chord,60);
 f.accept(event(60,0),0);f.flush(.2);assert.equal(f.index,0);
 f.accept(event(48,1),1);f.flush(1.2);assert.equal(f.index,0,'separate partial tries cannot accumulate chord keys');
 f.accept(event(48,2),2);f.accept(event(60,2.02),3);f.accept(event(61,2.04),4);f.flush(2.2);assert.equal(f.index,0,'extra key must not pass then be assigned to next target');
 f.accept(event(60,3),5);f.accept(event(48,3.05),6);f.flush(3.2);
 const s=f.summary(3.2);assert.equal(s.errorAttempts,3);assert.equal(s.wrongAttempts,1);assert.equal(s.incompleteAttempts,2);assert.equal(s.completedGroups,1);assert.equal(s.firstPassGroups,0);
});
test('fast separate notes and repeated pitches do not merge or reuse a prior press',()=>{
 const fast=Array.from({length:16},(_,i)=>({...notes[0],time:i*.08,beat:i*.125}));
 const r=analyzeFollow(fast,fast.map(n=>event(n.pitch,n.time)),120,{elapsed:2});assert.equal(r.follow.completedGroups,16);assert.equal(r.follow.errorAttempts,0);assert.equal(r.rhythm,100);
 const grace=fast.map((n,i)=>({...n,time:i*.01}));assert.equal(analyzeFollow(grace,grace.map(n=>event(n.pitch,n.time)),120,{elapsed:1}).follow.completedGroups,16);
});
test('first attempt rhythm is scored; retries do not make following groups permanently late',()=>{
 const r=report([event(60,0),event(61,1),event(62,10),event(64,11),event(65,12)]);
 assert.equal(r.follow.errorAttempts,1);assert.equal(r.follow.firstPassGroups,3);assert.equal(r.pitch,75);assert.equal(r.rhythm,100);assert.equal(r.follow.correctionSeconds,9);assert.deepEqual(r.steps.map(s=>s.delta),[0,0,0,0]);
 const late=report([event(60,0),event(61,2),event(62,10),event(64,11),event(65,12)]);assert.equal(late.rhythm,75);assert.equal(late.steps[1].delta,1);assert.equal(late.steps[2].delta,0);
});
test('arbitrary tempo, early notes and long pauses reduce rhythm despite correct pitches',()=>{
 const r=report([event(60,0),event(62,.4),event(64,4),event(65,4.4)]);assert.equal(r.pitch,100);assert.equal(r.rhythm,25);assert.equal(r.follow.errorAttempts,0);assert.equal(r.steps[1].timing,'early');assert.equal(r.steps[2].timing,'late');
 assert.equal(report(perfect.slice(0,2)).rhythm,null);assert.equal(report([]).empty,true);
});
test('selected range, hand, rests and tempo changes keep their own expected gaps',()=>{
 const s=normalizeScore({title:'变速及休止',bpm:60,timeSignature:[4,4],totalBeats:12,tempoMap:[{beat:0,bpm:60},{beat:8,bpm:120}],notes:[{pitch:48,beat:4,duration:1,hand:'left'},{pitch:60,beat:5,duration:1},{pitch:62,beat:7,duration:1},{pitch:64,beat:9,duration:1}]});
 const selected=scoreToTimedNotes(s,{bpm:60,hand:'right',startBar:2,endBar:3});assert.deepEqual(selected.map(n=>n.time),[1,3,4.5]);
 const r=analyzeFollow(selected,selected.map(n=>event(n.pitch,n.time)),60,{elapsed:7});assert.equal(r.rhythm,100);assert.deepEqual(r.steps.map(s=>s.bar),[2,2,3]);
});
test('live and saved analysis agree, including the pending last attempt and unfinished groups',()=>{
 const events=[event(61,0),event(60,1),event(62,2),event(63,3)],f=new FollowSession(notes,60);
 events.forEach((n,i)=>{f.accept(n,i);f.flush(n.time+.13);});f.flush(4,true);
 const r=report(events,4);assert.deepEqual(r.follow,f.summary(4));assert.equal(r.steps[3].firstTime,null);assert.equal(r.follow.errorAttempts,2);assert.equal(r.follow.completedGroups,2);
 const cut=analyzeFollow([notes[0],{...notes[0],pitch:48}], [event(60,0)],60,{elapsed:.03,interrupted:true});assert.equal(cut.follow.errorAttempts,1);assert.equal(cut.follow.completedGroups,0);
});
test('4096 target groups are processed without a pairwise alignment matrix',()=>{
 const many=Array.from({length:4096},(_,i)=>({...notes[0],time:i*.25,beat:i*.5}));const r=analyzeFollow(many,many.map(n=>event(n.pitch,n.time)),120,{elapsed:1025});assert.equal(r.follow.completedGroups,4096);assert.equal(r.follow.firstPassGroups,4096);
});
test('follow activity preserves actual duration, errors and scoring through progress backup',()=>{
 const events=[event(61,0),event(60,10),event(62,11),event(64,12),event(65,13)],a=takeActivity(take(events));assert(a);assert.equal(a.seconds,20);assert.equal(a.practiceMode,'follow');assert.equal(a.analysisVersion,FOLLOW_VERSION);assert.equal(a.follow.errorAttempts,1);
 const restored=parseProgressBackup(JSON.stringify({type:'banpai-progress',schemaVersion:1,learning:defaultLearning(),activities:[a]}));assert.deepEqual(restored.activities,[a]);assert.equal(takeActivity(take(events,{source:'demo'})),null);assert.equal(takeActivity(take([])),null);
});
test('following counts toward time but never inflates fixed-tempo metrics or plan evidence',()=>{
 const a=takeActivity(take(perfect)),stats=aggregateActivities([a],{today:'2026-09-22'});assert.equal(stats.seconds,20);assert.equal(stats.pitch,null);assert.equal(stats.rhythm,null);assert.equal(stats.follow.rhythm,100);assert.equal(stats.follow.firstPass,100);
 const plan={fingerprint:musicFingerprint(score),hand:'right',targetBpm:60};assert.equal(planEvidence(plan,[a],{today:'2026-09-22'}).complete,0);
 const partial=takeActivity(take(perfect.slice(0,2),{interrupted:true}));assert.equal(aggregateActivities([partial],{today:'2026-09-22'}).follow.firstPass,null);
});
test('follow summary rejects invalid counts while old fixed summaries remain compatible',()=>{
 const a=takeActivity(take(perfect));assert.throws(()=>normalizeActivity({...a,practiceMode:'unknown'}));assert.throws(()=>normalizeFollowSummary({...a.follow,firstPassGroups:999}));assert.throws(()=>normalizeFollowSummary({...a.follow,errorAttempts:-1}));assert.throws(()=>normalizeFollowSummary({...a.follow,correctionSeconds:Infinity}));
 const fixed=takeActivity(take(perfect,{options:{...options,practiceMode:'fixed'}}));const {practiceMode,...old}=fixed;assert.equal(normalizeActivity(old).practiceMode,'fixed');
});
test('AI summary separates modes, preserves follow errors, and uses follow-specific hotspots',()=>{
 const events=[event(61,0),event(60,10),event(62,11),event(64,12),event(65,13)],f=take(events),fixed=take(perfect,{id:'fixed-test',options:{...options,practiceMode:'fixed'}});
 const s=buildCoachSummary({activities:[takeActivity(f),takeActivity(fixed)],learning:defaultLearning(),takes:[f,fixed],today:'2026-09-22'});assert.equal(s.pieces.length,2);assert.equal(s.current.pitch,100);assert.equal(s.current.follow.errorAttempts,1);assert.equal(s.pieces.find(p=>p.practiceMode==='follow').first.pitch,null);assert.equal(s.pieces.find(p=>p.practiceMode==='follow').first.firstPass,75);assert(s.hotspots.some(h=>h.practiceMode==='follow'&&h.bar===1));
 const sanitized=validateCoachSummary(s);assert.deepEqual(sanitized.current.follow,s.current.follow);assert(sanitized.pieces.some(p=>p.practiceMode==='follow'&&p.errorAttempts===1));
});
