import test from 'node:test';
import assert from 'node:assert/strict';
import {HANON_TREMOLO_CLOSING as scores} from '../scripts/hanon-tremolo-closing.mjs';
import {HANON_TREMOLO_OPENING} from '../scripts/hanon-tremolo-outer.mjs';
import {HANON_TREMOLO_MIDDLE} from '../scripts/hanon-tremolo-middle.mjs';
const [reprise,closing]=scores;
const at=(s,beat,hand='right')=>s.notes.filter(n=>n.beat===beat&&n.hand===hand).map(n=>n.pitch).sort((a,b)=>a-b);
const musical=ns=>ns.map(({pitch,beat,duration,hand})=>({pitch,beat,duration,hand}));

test('60 has six full page sections including the 12-bar reprise and eight-bar coda',()=>{
 const all=[HANON_TREMOLO_OPENING,...HANON_TREMOLO_MIDDLE,...scores];
 assert.deepEqual(all.map(s=>s.id),Array.from({length:6},(_,i)=>`hanon-60-part-${i+1}`));
 assert.deepEqual(all.map(s=>s.totalBeats),[40,56,32,40,48,32]);
 for(const s of all){assert.equal(s.category,'technique');assert.equal(s.evaluationProfile,'technique');assert.ok(s.notes.length<=4096);assert.ok(s.notes.every(n=>n.pitch>=21&&n.pitch<=108));}
});
test('the p114 reprise retains the complete opening and subsequent independent G-major voicing',()=>{
 assert.deepEqual(musical(reprise.notes.filter(n=>n.beat<40)),musical(HANON_TREMOLO_OPENING.notes));
 assert.deepEqual(at(reprise,40),[74,79,83]);assert.deepEqual(at(reprise,40,'left'),[50,55,59]);
 assert.deepEqual(at(reprise,46,'left'),[43,47,50]);assert.deepEqual(at(reprise,46.125,'left'),[53]);
});
test('p115 preserves the individual bass entrance and delayed low-register sharp',()=>{
 assert.deepEqual(at(closing,0,'left'),[48]);assert.deepEqual(at(closing,.125,'left'),[52]);
 assert.deepEqual(at(closing,.25,'left'),[48,52,55]);
 assert.deepEqual(at(closing,2),[74,76,80]);assert.deepEqual(at(closing,2.125),[67]);assert.deepEqual(at(closing,2.375),[68]);
 // Confirmed against the clear Ricordi plate at printed p119, PDF120.
 assert.deepEqual(at(closing,6),[81,86,89]);assert.deepEqual(at(closing,6.125),[77]);
});
test('p115 keeps one-beat bass inversions and the exact right-hand octave-line boundary',()=>{
 assert.deepEqual(at(closing,14,'left'),[52,55,60]);assert.deepEqual(at(closing,14.125,'left'),[64]);
 assert.deepEqual(at(closing,15,'left'),[48,52,55]);
 assert.deepEqual(at(closing,18,'left'),[48,52,55]);assert.deepEqual(at(closing,19,'left'),[43,48,52]);
 assert.deepEqual(at(closing,20),[84,88,91]);assert.deepEqual(at(closing,20,'left'),[40,43,48]);
 assert.deepEqual(at(closing,22,'left'),[43,48,52]);assert.deepEqual(at(closing,23,'left'),[40,43,48]);
});
test('the final C6/C3 lasts across the tied half-note chord without a second attack',()=>{
 assert.deepEqual(at(closing,24),[88,91,96]);assert.deepEqual(at(closing,24,'left'),[36,40,43]);
 for(const[hand,pitch]of [['right',84],['left',48]]){
  assert.deepEqual(at(closing,27.875,hand),[pitch]);
  assert.equal(closing.notes.find(n=>n.hand===hand&&n.pitch===pitch&&n.beat===27.875).duration,2.125);
  assert.ok(!at(closing,28,hand).includes(pitch));
 }
 assert.deepEqual(at(closing,28),[88,91,96]);assert.deepEqual(at(closing,28,'left'),[36,40,43]);
 assert.ok(closing.notes.filter(n=>n.beat===28).every(n=>n.duration===2));
 assert.ok(!closing.notes.some(n=>n.beat>=30));assert.equal(closing.totalBeats,32);
});
