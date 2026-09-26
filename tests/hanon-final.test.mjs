import test from 'node:test';
import assert from 'node:assert/strict';
import {HANON_FINAL as scores} from '../public/hanon-final.mjs';
import {transcribeHanonFinal} from '../scripts/build-hanon-final.mjs';
const get=id=>scores.find(s=>s.id===`hanon-${id}`);
const at=(s,beat,hand='right')=>s.notes.filter(n=>n.beat===beat&&n.hand===hand).map(n=>n.pitch);

test('56/57 retain 24 complete key sections each and reproduce the checked-in data',()=>{
 assert.deepEqual(scores,transcribeHanonFinal());
 for(const number of [56,57])assert.equal(scores.filter(s=>s.id.startsWith(`hanon-${number}-`)).length,24);
 for(const s of scores){
  assert.equal(s.category,'technique');assert.equal(s.evaluationProfile,'technique');
  assert.ok(s.notes.some(n=>n.hand==='right'));assert.ok(s.notes.some(n=>n.hand==='left'));
  assert.ok(s.notes.every(n=>n.pitch>=21&&n.pitch<=108&&n.beat+n.duration<=s.totalBeats));
 }
});
test('56/57 retain their different F registers and two-octave hand spacing',()=>{
 assert.deepEqual(at(get('56-F'),0),[53]);assert.deepEqual(at(get('56-F'),0,'left'),[29]);
 assert.deepEqual(at(get('57-F'),0),[65]);assert.deepEqual(at(get('57-F'),0,'left'),[41]);
 for(const s of scores){
  const right=s.notes.filter(n=>n.hand==='right'),left=s.notes.filter(n=>n.hand==='left');
  assert.deepEqual(left.map(n=>[n.pitch,n.beat,n.duration]),right.map(n=>[n.pitch-24,n.beat,n.duration]));
 }
});
test('56/57 finish only after the E-minor connecting notes and whole-note octaves',()=>{
 for(const [number,start,end]of [[56,16,20],[57,12,16]]){
  const s=get(`${number}-Em`);assert.equal(s.totalBeats,end);
  assert.deepEqual(at(s,start),[60,72]);assert.deepEqual(at(s,start,'left'),[36,48]);
  assert.ok(s.notes.filter(n=>n.beat===start).every(n=>n.duration===4));
  assert.deepEqual(at(s,start-1.25),[65]);assert.deepEqual(at(s,start-.25),[62]);
 }
});
