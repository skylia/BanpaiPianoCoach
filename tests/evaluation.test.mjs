import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeScore,scoreToTimedNotes,serializeScore} from '../public/score-model.mjs';
import {analyze} from '../public/analysis.mjs';
import {analyzeFollow,FollowSession} from '../public/follow.mjs';
import {realizeOrnamentDemo,evaluationVersion} from '../public/evaluation.mjs';
import {buildNotationBars} from '../public/notation.mjs';
import {takeActivity,aggregateActivities,defaultLearning,parseProgressBackup,normalizeActivity,planEvidence,musicFingerprint} from '../public/progress-model.mjs';
import {buildCoachSummary,validateCoachSummary} from '../public/coach-model.mjs';
const melody=normalizeScore({id:'musical-test',title:'音乐表达测试',bpm:60,totalBeats:12,notes:Array.from({length:12},(_,i)=>({id:'n'+i,pitch:60+i%7,beat:i,duration:.8,hand:'right'}))});
const expected=scoreToTimedNotes(melody),musical={evaluationProfile:'musical'},event=(pitch,time)=>({pitch,time,duration:.2,velocity:80});
const trillScore=()=>normalizeScore({id:'trill-test',title:'颤音与伴奏',bpm:60,totalBeats:8,notes:[{id:'start',pitch:65,beat:0,duration:1},{id:'tr',pitch:67,beat:1,duration:1.8},{id:'bass1',pitch:48,beat:1,duration:1,hand:'left'},{id:'bass2',pitch:50,beat:2,duration:1,hand:'left'},{id:'g1',pitch:65,beat:2.8,duration:.1},{id:'g2',pitch:67,beat:2.9,duration:.1},{id:'next',pitch:69,beat:3,duration:1},{id:'tail',pitch:71,beat:4,duration:1}],ornaments:[{id:'tr1',type:'trill',noteId:'tr',auxiliaryPitch:69,endBeat:3,graceNoteIds:['g1','g2']}]});
const trillEvents=(upper=false)=>[event(65,0),event(upper?69:67,1),event(48,1.02),event(upper?67:69,1.25),event(upper?69:67,1.5),event(69,1.75),event(50,2),event(67,2.05),event(69,2.3),event(67,2.55),event(65,2.8),event(67,2.9),event(69,3),event(71,4)];
test('profile omission preserves old exact results; technique keeps strict timing',()=>{
 const events=expected.map(n=>event(n.pitch,n.time*1.35));const old=analyze(expected,events,60),strict=analyze(expected,events,60,{evaluationProfile:'technique'}),loose=analyze(expected,events,60,musical);
 assert.equal(strict.rhythm,old.rhythm);assert.equal(strict.pitch,old.pitch);assert.equal(loose.pitch,100);assert.equal(loose.rhythm,100);assert(loose.performedToEnd);assert.equal(loose.observations.filter(o=>['pause','rhythm','ornament'].includes(o.type)).length,0);assert.throws(()=>analyze(expected,events,60,{evaluationProfile:'anything'}));
});
test('smooth rubato remains musical while altered rhythm proportions and long stops stay visible',()=>{
 let time=0;const smooth=expected.map((n,i)=>{if(i)time+=1+i*.07;return event(n.pitch,time);});const a=analyze(expected,smooth,60,musical);assert.equal(a.pitch,100);assert(!a.observations.some(o=>o.type==='pause'||o.type==='rhythm'));
 const odd=expected.map((n,i)=>event(n.pitch,n.time+(i===5?.8:0)));assert(analyze(expected,odd,60,musical).observations.some(o=>o.type==='rhythm'));
 const pause=expected.map((n,i)=>event(n.pitch,n.time+(i>=5?4:0)));assert(analyze(expected,pause,60,musical).observations.some(o=>o.type==='pause'));
});
test('musical alignment still detects wrong, missing and extra notes and incomplete endings',()=>{
 const wrong=expected.map((n,i)=>event(n.pitch+(i===4?1:0),n.time*1.5));assert.equal(analyze(expected,wrong,60,musical).wrong,1);
 const missing=expected.filter((n,i)=>i!==4).map(n=>event(n.pitch,n.time*1.5));const r=analyze(expected,missing,60,musical);assert.equal(r.missing,1);assert.equal(r.rows[4].status,'missing');assert(r.performedToEnd);
 const extra=expected.map(n=>event(n.pitch,n.time*1.5));extra.push(event(90,7.8));assert.equal(analyze(expected,extra,60,musical).extras.length,1);
 assert.equal(analyze(expected,expected.slice(0,4),60,musical).performedToEnd,false);
});
test('trill schema roundtrips and rejects invalid pitch, overlap, foreign notes and swallowed melody',()=>{
 const score=trillScore();assert.deepEqual(normalizeScore(JSON.parse(serializeScore(score))),score);
 for(const patch of [{auxiliaryPitch:67},{auxiliaryPitch:74},{noteId:'missing'},{graceNoteIds:['bass2']},{endBeat:4}])assert.throws(()=>normalizeScore({...score,ornaments:[{...score.ornaments[0],...patch}]}));
 assert.throws(()=>normalizeScore({...score,ornaments:[score.ornaments[0],{...score.ornaments[0],id:'duplicate'}]}));
 const prepared=buildNotationBars(score);assert(prepared.notes.find(n=>n.id==='tr').trill);assert.equal(prepared.notes.find(n=>n.id==='next').graceNotes.length,2);assert(!prepared.notes.some(n=>n.id==='g1'));
 assert.equal(scoreToTimedNotes(score,{hand:'left'}).ornaments.length,0);
});
test('trill may begin on either pitch; accompaniment remains scored in both transport modes',()=>{
 const notes=scoreToTimedNotes(trillScore());for(const upper of [false,true]){const events=trillEvents(upper),r=analyze(notes,events,60,musical),f=analyzeFollow(notes,events,60,{...musical,elapsed:5});assert.equal(r.wrong,0);assert.equal(r.missing,0);assert.equal(r.extras.length,0);assert(r.ornamentResults[0].valid);assert.equal(f.follow.errorAttempts,0);assert.equal(f.follow.completedGroups,f.follow.totalGroups);assert(f.ornamentResults[0].valid);}
 const missingBass=trillEvents().filter(n=>n.pitch!==50);const r=analyze(notes,missingBass,60,musical);assert.equal(r.rows.find(r=>r.expected.id==='bass2').status,'missing');const f=analyzeFollow(notes,missingBass,60,{...musical,elapsed:5});assert(f.follow.completedGroups<f.follow.totalGroups);
});
test('missing alternation and wrong pitches give bounded feedback instead of ignoring ornaments',()=>{
 const notes=scoreToTimedNotes(trillScore());const plain=notes.map(n=>event(n.pitch,n.time)),r=analyze(notes,plain,60,musical),f=analyzeFollow(notes,plain,60,{...musical,elapsed:5});assert(!r.ornamentResults[0].valid);assert(f.follow.errorAttempts>=1);assert.equal(f.follow.completedGroups,f.follow.totalGroups);
 const bad=trillEvents();for(let i=0;i<15;i++)bad.push(event(80,1.3+i*.03));bad.sort((a,b)=>a.time-b.time);const a=analyze(notes,bad,60,musical),b=analyzeFollow(notes,bad,60,{...musical,elapsed:5});assert(a.extras.length>=15);assert(!a.ornamentResults[0].valid);assert.equal(b.follow.errorAttempts,1);assert.equal(b.follow.completedGroups,b.follow.totalGroups);
});
test('one illustrative demo realizes ornament without changing original notes',()=>{
 const notes=scoreToTimedNotes(trillScore()),before=JSON.stringify(notes),demo=realizeOrnamentDemo(notes);assert.equal(JSON.stringify(notes),before);assert(demo.length>notes.length);assert(demo.some(n=>n.id==='bass2'));const f=analyzeFollow(notes,demo,60,{...musical,elapsed:6});assert.equal(f.follow.errorAttempts,0);
});
test('musical follow adapts pace but retains errors and matches live saved analysis',()=>{
 const events=expected.map(n=>event(n.pitch,n.time*1.5)),f=new FollowSession(expected,60,musical);events.forEach((n,i)=>f.accept(n,i));f.flush(20,true);const r=analyzeFollow(expected,events,60,{...musical,elapsed:20});assert.deepEqual(r.follow,f.summary(20));assert.equal(r.follow.firstPassGroups,12);assert(r.rhythm>=90);
});
const take=(profile,id=profile,mode='fixed')=>({id,score:melody,options:{bpm:60,hand:'right',startBar:1,endBar:3,practiceMode:mode,...(profile?{evaluationProfile:profile}:{})},source:'midi',bpm:60,startedAt:'2026-09-26T00:00:00Z',date:'2026-09-26T00:00:24Z',elapsed:24,events:expected.map(n=>event(n.pitch,n.time*1.5)),interrupted:false});
test('activity, backup and AI keep profile and version separate, with actual musical duration',()=>{
 const takes=[take(undefined,'old'),take('technique'),take('musical'),take('musical','mf','follow')],records=takes.map(takeActivity);assert(records.every(Boolean));assert.equal(records[2].seconds,24);assert.equal(records[1].seconds,12);
 const backup=parseProgressBackup(JSON.stringify({type:'banpai-progress',schemaVersion:1,learning:defaultLearning(),activities:records}));assert.deepEqual(backup.activities,records);assert.throws(()=>normalizeActivity({...records[2],analysisVersion:'banpai-onset-1'}));
 const aggregate=aggregateActivities(records,{today:'2026-09-26'});assert.equal(aggregate.profiles.length,4);assert.equal(aggregate.profiles.find(p=>p.evaluationProfile==='musical').pitch,null);
 const report=validateCoachSummary(buildCoachSummary({activities:records,learning:defaultLearning(),takes,today:'2026-09-26'}));assert.equal(report.current.profiles.length,4);assert.equal(report.pieces.length,4);assert.equal(report.pieces.find(p=>p.evaluationProfile==='musical').last.rhythm,null);
 assert.equal(report.current.profiles.find(p=>p.evaluationProfile==='musical'&&p.practiceMode==='fixed').observations.uniformVelocitySessions,1);
 const plan={fingerprint:musicFingerprint(melody),hand:'right',targetBpm:60};assert.equal(planEvidence(plan,[records[2]],{today:'2026-09-26'}).complete,0);
});
test('AI musical hotspots include missing trill evidence, even with correct main pitches',()=>{
 const score=trillScore(),t={...take('musical','plain-trill'),score,options:{...take('musical').options,endBar:2},events:scoreToTimedNotes(score).map(n=>event(n.pitch,n.time))};
 const record=takeActivity(t),summary=validateCoachSummary(buildCoachSummary({activities:[record],learning:defaultLearning(),takes:[t],today:'2026-09-26'}));
 assert.equal(summary.current.profiles[0].observations.ornamentIssues,1);
 assert(summary.hotspots.some(h=>h.bar===1&&h.evaluationProfile==='musical'));
});
test('AI distinguishes a phrase pause from note errors and never counts it twice',()=>{
 const t=take('musical','phrase-pause');t.events=expected.map((n,i)=>event(n.pitch,n.time+(i>=8?4:0)));
 const record=takeActivity(t),summary=validateCoachSummary(buildCoachSummary({activities:[record],learning:defaultLearning(),takes:[t],today:'2026-09-26'}));
 const hotspot=summary.hotspots.find(h=>h.bar===3);assert(hotspot);assert.equal(hotspot.issues,0);assert.equal(hotspot.noteIssues,0);assert.equal(hotspot.timingIssues,0);assert.equal(hotspot.pauseObservations,1);
});
test('an ornament at the end of the selected range still receives its alternating notes',()=>{
 const score=trillScore();score.totalBeats=4;score.notes=score.notes.filter(n=>n.beat<3);score.ornaments[0].endBeat=3;
 const notes=scoreToTimedNotes(normalizeScore(score)),events=realizeOrnamentDemo(notes),r=analyzeFollow(notes,events,60,{...musical,elapsed:4});assert.equal(r.follow.errorAttempts,0);assert(r.ornamentResults[0].valid);
});
test('new technique plan evidence stays in its own version group and never borrows a legacy pass',()=>{
 const perfect=expected.map(n=>event(n.pitch,n.time)),base=take('technique');base.events=perfect;
 const a=takeActivity({...base,id:'first',startedAt:'2026-09-25T00:00:00Z',date:'2026-09-25T00:00:24Z'}),b=takeActivity({...base,id:'second'}),old=takeActivity({...take(undefined,'old-pass'),events:perfect}),plan={fingerprint:musicFingerprint(melody),hand:'right',targetBpm:60};
 assert.equal(planEvidence(plan,[a,b,old],{today:'2026-09-26'}).ready,false);
 const c=takeActivity({...base,id:'third',startedAt:'2026-09-26T01:00:00Z',date:'2026-09-26T01:00:24Z'});assert.equal(planEvidence(plan,[a,b,c,old],{today:'2026-09-26'}).ready,true);
});
