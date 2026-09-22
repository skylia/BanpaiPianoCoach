import test from 'node:test';
import assert from 'node:assert/strict';
import {REPERTOIRE} from '../public/repertoire.mjs';
import {normalizeScore,scoreToTimedNotes,scoreDuration,barCount} from '../public/score-model.mjs';
import {TASKS,GRADES} from '../public/curriculum.mjs';
import {ANALYSIS_VERSION,dayKey,validDay,shiftDay,monday,musicFingerprint,takeActivity,normalizeActivity,defaultLearning,normalizeLearning,gradeProgress,aggregateActivities,planEvidence,parseProgressBackup} from '../public/progress-model.mjs';
const today='2026-09-22';
const score=normalizeScore(REPERTOIRE.find(s=>s.id==='joy'));
const options={bpm:120,hand:'right',startBar:1,endBar:barCount(score)};
const makeTake=(patch={})=>({id:'a',score,options,bpm:120,source:'midi',date:today+'T11:00:12.350Z',startedAt:today+'T11:00:00Z',events:scoreToTimedNotes(score,options).map(n=>({...n,velocity:80})),elapsed:scoreDuration(score,options),interrupted:false,...patch});
const capture=(patch={})=>normalizeActivity({id:'take:a',kind:'capture',source:'midi',title:'Test',scoreId:score.id,fingerprint:musicFingerprint(score),date:today,startedAt:today+'T10:00:00Z',endedAt:today+'T10:01:00Z',seconds:60,complete:true,whole:true,bpm:120,hand:'right',startBar:1,endBar:barCount(score),expected:100,correct:100,extras:0,paired:100,steady:100,analysisVersion:ANALYSIS_VERSION,updatedAt:today+'T10:01:00Z',...patch});
const manual=(patch={})=>normalizeActivity({id:'manual-1',kind:'manual',title:'纸谱练习',date:today,seconds:1800,grade:3,category:'piece',note:'慢练',updatedAt:today+'T10:00:00Z',...patch});
const plan={scoreId:score.id,fingerprint:musicFingerprint(score),hand:'right',targetBpm:120};
const three=()=>[capture({id:'take:1',date:'2026-09-21',updatedAt:'2026-09-21T10:00:00Z'}),capture({id:'take:2',updatedAt:today+'T09:00:00Z'}),capture({id:'take:3',updatedAt:today+'T10:00:00Z'})];
test('ten levels contain 120 distinct learning tasks and no fabricated completion',()=>{
 assert.equal(GRADES.length,10);assert.equal(TASKS.length,120);assert.equal(new Set(TASKS.map(t=>t.id)).size,120);
 for(let grade=1;grade<=10;grade++){const p=gradeProgress(grade,defaultLearning(),TASKS);assert.deepEqual(p,{total:12,done:0,review:0,practicing:0,teacher:0,percent:0});}
});
test('learning checklist separates teacher notes, self assessment and pending review',()=>{
 const l=defaultLearning();l.checks={'g3-technique-1':{state:'done',verifiedBy:'teacher'},'g3-technique-2':{state:'done',verifiedBy:'self'},'g3-study-1':{state:'review'},'g3-study-2':{state:'practicing'}};
 assert.deepEqual(gradeProgress(3,l,TASKS),{total:12,done:2,review:1,practicing:1,teacher:1,percent:17});assert.equal(gradeProgress(2,l,TASKS).done,0);
});
test('capture summary uses reference music, retains complete evidence and excludes demos/empty takes',()=>{
 const a=takeActivity(makeTake());assert(a);assert.equal(a.correct,a.expected);assert.equal(a.steady,a.paired);assert.equal(a.source,'midi');assert.equal(a.whole,true);assert.equal(a.complete,true);
 assert.equal(takeActivity(makeTake({source:'demo'})),null);assert.equal(takeActivity(makeTake({events:[]})),null);assert.equal(takeActivity(makeTake({elapsed:0})),null);
 assert.equal(takeActivity(makeTake({source:'virtual'})).source,'virtual');assert.equal(takeActivity(makeTake({interrupted:true})).complete,false);
 assert(takeActivity(makeTake({options:undefined})), 'older takes may use default whole-score options');
});
test('capture starts are preserved at midnight independently of completion buffer',()=>{
 const a=takeActivity(makeTake({startedAt:'2026-09-21T23:59:59.900Z',date:'2026-09-22T00:00:12.350Z'}));assert.equal(a.date,dayKey('2026-09-21T23:59:59.900Z'));assert.equal(a.startedAt,'2026-09-21T23:59:59.900Z');
});
test('calendar arithmetic handles leap years, Monday boundary and year transition',()=>{
 assert.equal(validDay('2024-02-29'),true);assert.equal(validDay('2025-02-29'),false);assert.equal(validDay('2026-04-31'),false);assert.equal(shiftDay('2024-03-01',-1),'2024-02-29');assert.equal(shiftDay('2026-01-01',-1),'2025-12-31');assert.equal(monday('2026-09-22'),'2026-09-21');
});
test('accuracy is note weighted, includes extra notes and never assigns manual or partial recordings a score',()=>{
 const a=capture({expected:10,correct:10,paired:10,steady:10}),b=capture({id:'take:b',expected:90,correct:0,paired:90,steady:0});
 let stats=aggregateActivities([a,b,manual(),capture({id:'take:c',complete:false,seconds:120})],{today});assert.equal(stats.pitch,10);assert.equal(stats.rhythm,10);assert.equal(stats.seconds,2040);assert.equal(stats.captureSeconds,240);assert.equal(stats.manualSeconds,1800);
 stats=aggregateActivities([manual(),capture({complete:false})],{today});assert.equal(stats.pitch,null);assert.equal(stats.rhythm,null);
 assert.equal(aggregateActivities([capture({extras:25})],{today}).pitch,80);
});
test('duplicates and examples do not increase totals; future entries are excluded',()=>{
 const a=manual();const stats=aggregateActivities([a,a,{...a,id:'future',date:'2026-09-23'},{...capture(),source:'demo'}],{today});assert.equal(stats.seconds,1800);assert.equal(stats.count,1);assert.equal(stats.days,1);
});
test('current window, weekly target and all-time totals have separate date scopes',()=>{
 const rows=[manual({id:'older',date:'2026-08-01'}),manual({id:'sunday',date:'2026-09-20'}),manual({id:'monday',date:'2026-09-21'}),manual()];
 const s=aggregateActivities(rows,{today,days:7});assert.equal(s.seconds,5400);assert.equal(s.totalSeconds,7200);assert.equal(s.weeklySeconds,3600);assert.equal(s.streak,3);assert.equal(s.todaySeconds,1800);
 assert.equal(aggregateActivities(rows.slice(0,-1),{today}).streak,2);assert.equal(aggregateActivities([rows[0]],{today}).streak,0);
});
test('fingerprints survive re-import and title/fingering changes but detect musical changes',()=>{
 const clone=structuredClone(score);clone.id='custom-new';clone.title='Renamed';clone.notes[0].finger=5;assert.equal(musicFingerprint(clone),musicFingerprint(score));clone.notes[0].pitch++;assert.notEqual(musicFingerprint(clone),musicFingerprint(score));
});
test('stable evidence requires three unique recent takes across two dates',()=>{
 const rows=three();assert.equal(planEvidence(plan,rows,{today}).ready,true);assert.equal(planEvidence(plan,[rows[0],rows[1],rows[1]],{today}).ready,false);assert.equal(planEvidence(plan,rows.map(a=>({...a,date:today})),{today}).ready,false);
 assert.equal(planEvidence(plan,rows.map(a=>({...a,scoreId:'restored-id'})),{today}).ready,true);assert.equal(planEvidence({...plan,fingerprint:''},rows.map(a=>({...a,fingerprint:''})),{today}).ready,false);
});
test('stable evidence excludes wrong versions, ranges, hands, speeds and analysis versions',()=>{
 for(const patch of [{fingerprint:'music-bad'},{whole:false},{complete:false},{hand:'left'},{bpm:119},{analysisVersion:'new-analysis'},{expected:7,correct:7,paired:7,steady:7},{date:'2026-08-23'},{date:'2026-09-23'},{source:'demo'}])assert.equal(planEvidence(plan,three().map(a=>({...a,...patch})),{today}).ready,false,JSON.stringify(patch));
 const boundary=three();boundary[0].date='2026-08-24';assert.equal(planEvidence(plan,boundary,{today}).ready,true);
});
test('a new failed take supersedes an older passing take, using actual timestamp order',()=>{
 const rows=three();rows[0].updatedAt=today+'T01:00:00+08:00';rows[1].updatedAt=today+'T02:00:00+08:00';rows[2].updatedAt=today+'T03:00:00+08:00';rows.push(capture({id:'latest-failed',correct:0,updatedAt:today+'T01:00:00Z'}));assert.equal(planEvidence(plan,rows,{today}).ready,false);
});
test('no score plan is automatically marked completed by performance evidence',()=>{
 const l=defaultLearning();const before=JSON.stringify(l);planEvidence(plan,three(),{today});assert.equal(JSON.stringify(l),before);
});
test('backup validates grades, exact task IDs, integer bars and genuine capture timestamps',()=>{
 assert.throws(()=>manual({grade:2.5}));assert.throws(()=>capture({startBar:1.5}));assert.throws(()=>capture({startedAt:'bad'}));assert.throws(()=>capture({endedAt:'2020-01-01T00:00:00Z'}));assert.throws(()=>capture({correct:101}));assert.throws(()=>capture({source:'demo'}));assert.throws(()=>normalizeLearning({...defaultLearning(),checks:{'g1-rubbish-1':{state:'done'}}}));
});
test('portable backup roundtrip preserves notes, progress and unique summaries',()=>{
 const raw={type:'banpai-progress',schemaVersion:1,learning:defaultLearning(),activities:[capture(),manual()]},restored=parseProgressBackup(JSON.stringify(raw));assert.deepEqual(restored.activities,raw.activities);assert.deepEqual(restored.learning,raw.learning);
 assert.throws(()=>parseProgressBackup(JSON.stringify({...raw,activities:[capture(),capture()]})));assert.throws(()=>parseProgressBackup(JSON.stringify({...raw,type:'banpai-library'})));assert.throws(()=>parseProgressBackup('{broken'));assert.throws(()=>parseProgressBackup(JSON.stringify({...raw,activities:[manual({date:'2026-09-22'}),{...manual(),id:'bad record'}]})));
});
test('large multibyte personal notebooks remain importable beyond the former 32 MB limit',()=>{
 const row=manual({note:'琴'.repeat(1000)});const data=JSON.stringify({type:'banpai-progress',schemaVersion:1,learning:defaultLearning(),activities:Array.from({length:11000},(_,i)=>({...row,id:'manual-'+i}))});assert(new TextEncoder().encode(data).length>32*1024*1024);assert.equal(parseProgressBackup(data).activities.length,11000);
});

test('old progress survives upgrade while grade 10 plans and checks roundtrip',()=>{
 const old={...defaultLearning(),checks:{'g3-technique-1':{state:'done',verifiedBy:'teacher'}}};const upgraded=normalizeLearning({...old,targetGrade:10,checks:{...old.checks,'g10-polyphony-2':{state:'review'}},plans:[{id:'grade-10',title:'高级作品',grade:10,targetBpm:80,hand:'both',status:'learning'}]});
 const restored=parseProgressBackup(JSON.stringify({type:'banpai-progress',schemaVersion:1,learning:upgraded,activities:[manual({grade:10})]}));assert.deepEqual(restored.learning,upgraded);assert.equal(restored.learning.checks['g3-technique-1'].state,'done');assert.equal(restored.learning.targetGrade,10);assert.equal(restored.activities[0].grade,10);
});
