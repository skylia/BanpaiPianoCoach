import test from 'node:test';
import assert from 'node:assert/strict';
import {HANON_SUSTAINED as scores} from '../public/hanon-sustained.mjs';
import {transcribeHanonSustained} from '../scripts/transcribe-hanon-sustained.mjs';
import {normalizeScore,barCount} from '../public/score-model.mjs';
const get=n=>scores.find(s=>s.id===`hanon-${n}-complete`);
const at=(s,beat,hand='right')=>s.notes.filter(n=>n.beat===beat&&n.hand===hand);
const pitches=(s,beat,hand)=>at(s,beat,hand).map(n=>n.pitch);

test('58/59 are reproducible complete technique entries within portable limits',()=>{
 assert.deepEqual(scores,transcribeHanonSustained());
 for(const s of scores){assert.deepEqual(normalizeScore(s),s);assert.equal(s.evaluationProfile,'technique');assert.ok(s.notes.length<=4096);assert.ok(barCount(s)<=256);}
 assert.equal(get(58).totalBeats,148);assert.equal(get(59).totalBeats,200);
});

test('58 sustains octaves while its separate inner voice articulates sixteenths',()=>{
 const s=get(58);
 assert.deepEqual(pitches(s,0),[60,72]);assert.deepEqual(pitches(s,0,'left'),[36,48]);
 assert.ok(at(s,0).every(n=>n.duration===1));
 for(const beat of [.25,.5,.75]){assert.deepEqual(pitches(s,beat),[64,67]);assert.ok(at(s,beat).every(n=>n.duration===.25));}
 assert.deepEqual(pitches(s,1),[62,74]);assert.deepEqual(pitches(s,1.25),[65,71]);
 assert.deepEqual(pitches(s,16),[88,100]);assert.deepEqual(pitches(s,31),[62,74]);
});

test('58 retains the two-beat hold, wide contrary motion and final whole-note chord',()=>{
 const s=get(58);
 assert.deepEqual(pitches(s,46),[84,96]);assert.ok(at(s,46).every(n=>n.duration===2));
 assert.deepEqual(pitches(s,46,'left'),[24,36]);
 for(let i=1;i<8;i++)assert.deepEqual(pitches(s,46+i*.25),[88,91]);
 assert.deepEqual(pitches(s,48),[88,100]);assert.deepEqual(pitches(s,48,'left'),[24,36]);
 assert.deepEqual(pitches(s,72),[60,72]);
 assert.deepEqual(pitches(s,144),[84,88,91,96]);assert.deepEqual(pitches(s,144,'left'),[24,28,31,36]);
 assert.ok(at(s,144).every(n=>n.duration===4));
});

test('59 preserves written dyads, the four-bar warmup and strict sixteenth attacks',()=>{
 const s=get(59);
 assert.equal(s.bpm,40);assert.equal(s.ornaments,undefined);
 for(const beat of [0,4,8,12,16])assert.deepEqual(pitches(s,beat),[64,72]);
 assert.deepEqual(pitches(s,.25),[65,74]);assert.deepEqual(pitches(s,.25,'left'),[41,50]);
 assert.deepEqual(at(s,0).map(n=>n.finger),[1,4]);assert.deepEqual(at(s,.25).map(n=>n.finger),[2,5]);
 assert.deepEqual(pitches(s,44),[88,96]);
 assert.deepEqual(pitches(s,128),[64,72]);assert.ok(at(s,128).every(n=>n.duration===4));
});

test('59 includes both four-bar variations and their repeats, not just its title trill',()=>{
 const s=get(59);
 assert.deepEqual([0,.25,.5,.75].map(i=>pitches(s,132+i)),[[64,72],[65,74],[65,74],[67,76]]);
 assert.deepEqual(pitches(s,140),[91,100]);
 assert.deepEqual(pitches(s,148),[64,72]);
 assert.deepEqual([0,.25,.5,.75].map(i=>pitches(s,164+i)),[[64,72],[67,76],[65,74],[69,77]]);
 assert.deepEqual(pitches(s,171.75),[93,101]);
 assert.deepEqual(pitches(s,195.75),[62,71]);
 assert.deepEqual(pitches(s,196),[64,67,72]);assert.deepEqual(pitches(s,196,'left'),[36,40,48]);
});
