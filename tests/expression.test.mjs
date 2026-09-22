import test from 'node:test';
import assert from 'node:assert/strict';
import {velocityVolume,EVEN_PLAYBACK_VOLUME,dynamicsInfo} from '../public/expression.mjs';
import {PianoSound} from '../public/inputs.mjs';
import {normalizeScore,serializeScore,parseScoreJSON,scoreToTimedNotes,toLegacyExercise} from '../public/score-model.mjs';
import {musicFingerprint} from '../public/progress-model.mjs';
import {analyze} from '../public/analysis.mjs';

const score=()=>({id:'expression-fixture',title:'强弱测试',bpm:60,timeSignature:[4,4],totalBeats:8,notes:[
  {id:'soft',pitch:60,beat:0,duration:1,hand:'right',velocity:35},
  {id:'strong',pitch:64,beat:4,duration:1,hand:'right',velocity:115},
  {id:'bass',pitch:48,beat:4,duration:2,hand:'left',velocity:60},
]});

test('optional velocity survives normalization, JSON and tempo/range/hand conversion',()=>{
  const raw=score(),before=structuredClone(raw),normalized=normalizeScore(raw);
  assert.deepEqual(raw,before);assert.deepEqual(parseScoreJSON(serializeScore(normalized)),normalized);
  const selected=scoreToTimedNotes(normalized,{startBar:2,endBar:2,bpm:120,hand:'right'});
  assert.deepEqual(selected.map(n=>[n.id,n.velocity,n.time,n.duration]),[['strong',115,0,.5]]);
  for(const velocity of [0,128,-1,1.5,'80',NaN,Infinity])assert.throws(()=>normalizeScore({...raw,notes:[{...raw.notes[0],velocity}]}),/力度/u);
  const old=normalizeScore({...raw,notes:[{id:'old',pitch:60,beat:0,duration:4}]});assert(!Object.hasOwn(old.notes[0],'velocity'));
  assert.throws(()=>toLegacyExercise(normalized),/力度/u);
});

test('velocity gain is monotonic, bounded below sample saturation, and old notes keep their volume',()=>{
  for(let v=1;v<=127;v++){assert(velocityVolume(v)>0);assert(velocityVolume(v)*3<.55);if(v>1)assert(velocityVolume(v)>velocityVolume(v-1));}
  assert(velocityVolume(110)>2*velocityVolume(40));
  for(const value of [undefined,null,0,-1,128,NaN,'90'])assert.equal(velocityVolume(value),EVEN_PLAYBACK_VOLUME);
});

test('sample and synthesized note entrypoint applies source or uniform dynamics without changing timing',()=>{
  const sound=new PianoSound(),calls=[];sound.tone=(...args)=>calls.push(args);
  for(const timbre of ['grand','warm','simple']){
    sound.setTimbre(timbre);sound.playNote({pitch:60,velocity:35},.75,.25);sound.playNote({pitch:60,velocity:115},.75,.25);
    const [soft,strong]=calls.slice(-2);assert(strong[2]>soft[2]);assert.deepEqual(soft.filter((_,i)=>i!==2),[60,.75,.25]);
    sound.playNote({pitch:60,velocity:35},.75,.25,{dynamics:false});sound.playNote({pitch:60,velocity:115},.75,.25,{dynamics:false});assert.deepEqual(calls.at(-2),calls.at(-1));
  }
});

test('fixed, absent and partial dynamics are distinguished; rests do not supply expression',()=>{
  assert.deepEqual(dynamicsInfo([{pitch:60},{pitch:null,velocity:80}]),{recorded:0,missing:1,varied:false,min:null,max:null});
  assert.equal(dynamicsInfo([{pitch:60,velocity:90},{pitch:64,velocity:90}]).varied,false);
  assert.equal(dynamicsInfo(score().notes).varied,true);
  assert.equal(dynamicsInfo([{pitch:60,velocity:40},{pitch:64}]).missing,1);
});

test('expression does not change timing, pitch scoring or evidence fingerprints',()=>{
  const full=normalizeScore(score()),plain=normalizeScore({...score(),notes:score().notes.map(({velocity,...note})=>note)});
  assert.equal(musicFingerprint(full),musicFingerprint(plain));
  const a=scoreToTimedNotes(full),b=scoreToTimedNotes(plain);assert.deepEqual(a.map(({velocity,...note})=>note),b);
  const result=notes=>{const r=analyze(notes,b,60);return [r.correct,r.extras.length,r.pitch,r.rhythm,r.averageDeviation,r.coverage];};assert.deepEqual(result(a),result(b));
});
