import test from 'node:test';
import assert from 'node:assert/strict';
import {restorePracticeContext,preferredMidiDevice,readLocalJSON,writeLocalJSON,defaultProfile} from '../public/practice-context.mjs';
import {summarizePractice,recentPracticeIssues} from '../public/practice-summary.mjs';
import {PerformancePosition} from '../public/performance-position.mjs';

const score={id:'piece',bpm:72,totalBeats:24,timeSignature:[3,4],notes:[{pitch:60,hand:'right'},{pitch:48,hand:'left'}]};
test('last practice context restores the piece and independently retains transport and evaluation',()=>{
  const raw={version:1,scoreId:'piece',bpm:68,hand:'right',startBar:3,endBar:6,practiceMode:'follow',evaluationProfile:'musical',scrollTop:220,lastBar:4,metronome:false,loopCount:3,showNames:true,showFingers:false,followScore:false};
  const restored=restorePracticeContext(raw,[score]);
  assert.equal(restored.score,score);assert.equal(restored.options.practiceMode,'follow');assert.equal(restored.options.evaluationProfile,'musical');assert.equal(restored.options.startBar,3);assert.equal(restored.lastBar,4);assert.equal(restored.scrollTop,220);assert.equal(restored.metronome,false);
  assert.equal(restored.loopCount,3);assert.equal(restored.showNames,true);assert.equal(restored.showFingers,false);assert.equal(restored.followScore,false);
});
test('practice brief ignores duplicated, invalid and future records and identifies useful issue bars',()=>{
  const activity={id:'take:one',kind:'capture',scoreId:'piece',source:'midi',date:'2026-09-26',seconds:90};
  const result=summarizePractice({scoreId:'piece',today:'2026-09-26',activities:[activity,{...activity},{...activity,id:'future',date:'2026-09-27'},{...activity,id:'invalid',date:'bad'}],takes:[{score,source:'midi',events:[{}],date:'2026-09-27T00:00:00Z'}]});
  assert.equal(result.pieceSessions,1);assert.equal(result.todaySeconds,90);assert.equal(result.latest,null);
  assert.deepEqual(recentPracticeIssues({rows:[{status:'correct',expected:{bar:1}},{status:'wrong',expected:{bar:3}}],observations:[{type:'tempo',bar:1},{type:'ornament',bar:3},{type:'pause',bar:5}]}),['第 3 小节：核对音符、核对装饰音','第 5 小节：回听停留']);
});
test('removed or corrupted context falls back; changed scores clamp range and unsafe values',()=>{
  assert.equal(restorePracticeContext({version:1,scoreId:'deleted'},[score]),null);
  assert.equal(restorePracticeContext({version:2,scoreId:'piece'},[score]),null);
  const r=restorePracticeContext({version:1,scoreId:'piece',startBar:200,endBar:-1,bpm:NaN,hand:'anything',scrollTop:-10},[score]);
  assert.deepEqual([r.options.startBar,r.options.endBar,r.options.bpm,r.options.hand,r.scrollTop],[8,8,72,'both',0]);
  assert.equal(defaultProfile({...score,category:'study'}),'musical');assert.equal(defaultProfile({...score,category:'technique'}),'technique');
});
test('device preference uses stable IDs then unambiguous names and does not guess among multiple devices',()=>{
  const devices=[{id:'a',name:'Piano',manufacturer:'Maker'},{id:'b',name:'Controller'}];
  assert.equal(preferredMidiDevice(devices,{id:'b'}),devices[1]);
  assert.equal(preferredMidiDevice(devices,{id:'old',name:'Piano',manufacturer:'Maker'}),devices[0]);
  assert.equal(preferredMidiDevice(devices,{}),null);
  assert.equal(preferredMidiDevice([devices[0]],{}),devices[0]);
  assert.equal(preferredMidiDevice([{id:'a',name:'Piano'},{id:'b',name:'Piano'}],{name:'Piano'}),null);
});
test('denied browser storage never crashes startup or pretends to persist',()=>{
  const denied={getItem(){throw Error('denied');},setItem(){throw Error('full');}};
  assert.equal(readLocalJSON('test',denied),null);assert.equal(writeLocalJSON('test',{},denied),false);
});
test('practice summary includes only real current-piece sessions and keeps global manual time',()=>{
  const activities=[{kind:'capture',scoreId:'piece',source:'midi',date:'2026-09-26',seconds:90},{kind:'capture',scoreId:'other',source:'midi',date:'2026-09-26',seconds:60},{kind:'capture',scoreId:'piece',source:'demo',date:'2026-09-26',seconds:900},{kind:'manual',source:'manual',date:'2026-09-25',seconds:1200},{kind:'capture',scoreId:'piece',source:'midi',date:'2026-09-19',seconds:60}];
  const takes=[{score,source:'midi',events:[{}],date:'2026-09-25T00:00:00Z'},{score,source:'demo',events:[{}],date:'2026-09-26T00:00:00Z'}];
  const r=summarizePractice({scoreId:'piece',activities,takes,learning:{weeklyMinutes:180},today:'2026-09-26'});
  assert.equal(r.pieceSessions,1);assert.equal(r.pieceSeconds,90);assert.equal(r.todaySeconds,150);assert.equal(r.weekSeconds,1350);assert.equal(r.latest,takes[0]);
});
test('visual follower is driven by input, accepts a missed note and never advances from elapsed time',()=>{
  const p=new PerformancePosition([60,62,64,65].map((pitch,i)=>({pitch,id:String(i),time:i,beat:i})));
  p.accept({pitch:60,time:10});assert.equal(p.beat,0);p.accept({pitch:99,time:11});assert.equal(p.beat,0);p.accept({pitch:64,time:12});assert.equal(p.beat,2);
});
