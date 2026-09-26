import test from 'node:test';
import assert from 'node:assert/strict';
import {EXPANDED_REPERTOIRE} from '../public/repertoire-expanded.mjs';
import {annotateBuiltinScore} from '../public/score-annotations.mjs';
import {normalizeScore,scoreToTimedNotes} from '../public/score-model.mjs';
import {analyze} from '../public/analysis.mjs';
import {analyzeFollow} from '../public/follow.mjs';
import {realizeOrnamentDemo,musicalDynamics} from '../public/evaluation.mjs';
import {PerformancePosition} from '../public/performance-position.mjs';

const musical={evaluationProfile:'musical'};
const andante=normalizeScore(annotateBuiltinScore(EXPANDED_REPERTOIRE.find(s=>s.id==='mutopia-clementi-op36-no1-movement2')));

test('all three source-annotated Andante trills accept faster and slower realizations without swallowing accompaniment',()=>{
  for(const bar of [3,21,25])for(const pace of [.65,1,1.8]){
    const notes=scoreToTimedNotes(andante,{startBar:bar,endBar:bar+1});
    assert.equal(notes.ornaments[0].bar,bar);
    const events=realizeOrnamentDemo(notes).map(n=>({...n,time:n.time*pace}));
    const result=analyze(notes,events,andante.bpm,musical);
    assert.equal(result.pitch,100,`bar ${bar}, pace ${pace}`);
    assert.equal(result.rhythm,100);
    assert.equal(result.extras.length,0);
    assert(result.ornamentResults[0].valid);
    const follow=analyzeFollow(notes,events,andante.bpm,{...musical,elapsed:20});
    assert.equal(follow.follow.completedGroups,follow.follow.totalGroups);
    assert.equal(follow.follow.errorAttempts,0);
    assert(follow.ornamentResults[0].valid);
    const bass=notes.find(n=>n.hand==='left'&&n.time>notes.ornaments[0].time&&n.time<notes.ornaments[0].endTime);
    const missingBass=events.filter(n=>n.id!==bass.id);
    assert.equal(analyze(notes,missingBass,andante.bpm,musical).rows.find(r=>r.expected.id===bass.id).status,'missing');
    const blocked=analyzeFollow(notes,missingBass,andante.bpm,{...musical,elapsed:20});
    assert(blocked.follow.completedGroups<blocked.follow.totalGroups);
  }
});

test('a missing chord tone does not steal another correctly played tone',()=>{
  const notes=scoreToTimedNotes(normalizeScore({title:'Chord regression',bpm:60,totalBeats:4,notes:[
    {id:'missing',pitch:60,beat:0,duration:1},{id:'correct',pitch:64,beat:0,duration:1},
    ...[65,67,69].map((pitch,i)=>({id:`tail${i}`,pitch,beat:i+1,duration:1})),
  ]}));
  const result=analyze(notes,notes.filter(n=>n.id!=='missing'),60,musical);
  assert.equal(result.rows.find(r=>r.expected.id==='missing').status,'missing');
  assert.equal(result.rows.find(r=>r.expected.id==='correct').status,'correct');
  assert.equal(result.wrong,0);
  assert.equal(result.missing,1);
});

test('short-note rhythm proportions remain audible problems at fast tempos',()=>{
  const notes=Array.from({length:18},(_,i)=>({id:String(i),time:i*.125,beat:i*.25,bar:1,pitch:60+i%6,hand:'right'}));
  const events=notes.map((n,i)=>({...n,time:n.time+(i===8?.075:0)}));
  const result=analyze(notes,events,120,musical);
  assert.equal(result.pitch,100);
  assert(result.rhythm<100);
  assert(result.observations.some(o=>o.type==='rhythm'));
  const follow=analyzeFollow(notes,events,120,{...musical,elapsed:3});
  assert.equal(follow.pitch,100);
  assert(follow.rhythm<100);
});

test('musical dynamics are factual observations, with no synthetic expressive score',()=>{
  assert.equal(musicalDynamics([{velocity:90}]),null);
  const result=musicalDynamics([40,45,50,55,60,70,80,85,90,95].map(velocity=>({velocity})));
  assert.equal(result.type,'dynamics');
  assert(result.high>result.low);
  assert.match(result.message,/不等同于实际响度或表达质量/);
  assert.equal(result.score,undefined);
});

test('visual cursor keeps fast trill alternations in their passage and reacquires the next anchor',()=>{
  const notes=scoreToTimedNotes(andante,{startBar:3,endBar:4}),o=notes.ornaments[0],cursor=new PerformancePosition(notes);
  const events=realizeOrnamentDemo(notes).map(n=>({...n,time:n.time*.65}));
  for(const n of events){
    cursor.accept(n);
    if(n.time<o.endTime*.65)assert(cursor.beat<o.endBeat);
  }
  assert.equal(cursor.progress,1);
});
