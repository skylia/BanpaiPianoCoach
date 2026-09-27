import test from 'node:test';
import assert from 'node:assert/strict';
import {HANON_ADVANCED as scores} from '../public/hanon-advanced.mjs';
import {transcribeHanonAdvanced} from '../scripts/build-hanon-advanced.mjs';
import {normalizeScore,barCount} from '../public/score-model.mjs';
const get=id=>scores.find(s=>s.id===`hanon-${id}`);
const at=(s,beat,hand='right')=>s.notes.filter(n=>Math.abs(n.beat-beat)<1e-6&&n.hand===hand).map(n=>n.pitch).sort((a,b)=>a-b);

test('44–55 include every numbered exercise and source variant, reproducibly',()=>{
 assert.deepEqual(scores,transcribeHanonAdvanced());
 assert.equal(scores.length,63);
 for(let n=44;n<=55;n++)assert.ok(scores.some(s=>s.tags.includes(`哈农第${n}条`)));
 assert.equal(scores.filter(s=>s.id.startsWith('hanon-45-')).length,6);
 assert.equal(scores.filter(s=>s.id.startsWith('hanon-52-')).length,12);
 assert.equal(scores.filter(s=>s.id.startsWith('hanon-53-')).length,24);
 for(const s of scores){assert.deepEqual(normalizeScore(s),s);assert.equal(s.category,'technique');assert.equal(s.evaluationProfile,'technique');assert.ok(s.notes.length<=4096);assert.ok(barCount(s)<=256);assert.match(s.source.url,/IMSLP91547/);}
});

test('44 keeps triplet timing, introduction and lower final tonic',()=>{
 const s=get('44');assert.equal(s.totalBeats,152);
 assert.deepEqual(at(s,0),[48]);assert.deepEqual(at(s,16),[48]);
 assert.deepEqual(at(s,148),[36]);assert.deepEqual(at(s,148,'left'),[24]);
 assert.deepEqual(s.notes.filter(n=>n.hand==='right').slice(0,3).map(n=>n.finger),[3,2,1]);
});

test('47 descent and 48 scale passages preserve the independent left-hand line',()=>{
 const s=get('47');assert.deepEqual(at(s,56),[83]);assert.deepEqual(at(s,56,'left'),[67]);
 const thirds=get('48-thirds');assert.equal(thirds.totalBeats,48);
 assert.deepEqual(at(thirds,23.75),[62,65]);
 assert.deepEqual(at(thirds,26),[74,77]);assert.deepEqual(at(thirds,26,'left'),[62,65]);
 assert.deepEqual(at(thirds,30),[74,77]);assert.deepEqual(at(thirds,30,'left'),[62,65]);
 const sixths=get('48-sixths');assert.deepEqual(at(sixths,48),[64,72]);assert.deepEqual(at(sixths,48,'left'),[52,60]);
});

test('49 keeps the summit turn, separate continuation and original two-octave hand spacing',()=>{
 const a=get('49-stretch'),b=get('49-continuation');
 assert.deepEqual(at(a,0),[64]);assert.deepEqual(at(a,0,'left'),[40]);
 assert.deepEqual(a.notes.filter(n=>n.hand==='right'&&n.beat>=14&&n.beat<16).map(n=>n.pitch),[88,96,91,96,100,96,91,88]);
 assert.notDeepEqual(at(a,15),at(b,15));
 for(const s of [a,b]){assert.equal(s.totalBeats,36);assert.deepEqual(at(s,31.75),[65]);assert.deepEqual(at(s,32),[64,72]);}
});

test('50 chromatic thirds and 51 octave sections retain written lengths and opposing turns',()=>{
 const c=get('50-chromatic-scale');assert.equal(c.totalBeats,21);assert.deepEqual(at(c,9),[84,87]);assert.deepEqual(at(c,18),[48,51]);
 assert.equal(get('51-expanding-scales').totalBeats,96);
 const s=get('51-contrary-scales');assert.equal(s.totalBeats,28);
 assert.deepEqual(at(s,0),[64,76]);assert.deepEqual(at(s,0,'left'),[36,48]);
 assert.deepEqual(at(s,18),[84,96]);assert.deepEqual(at(s,18,'left'),[40,52]);
 assert.deepEqual(at(get('51-chromatic-third'),12),[63,75]);
});

test('52 uses harmonic-minor thirds and 53 ends on the printed C octave, after its E-minor bridge',()=>{
 const a=get('52-Am');assert.deepEqual(at(a,1),[64,68]);assert.deepEqual(at(a,14),[57,60]);
 const e=get('53-Em');assert.deepEqual(at(e,0),[52,64]);assert.deepEqual(at(e,7.25),[53,65]);assert.deepEqual(at(e,7.75),[50,62]);
 assert.deepEqual(at(e,8),[48,60]);assert.deepEqual(at(e,8,'left'),[24,36]);
});

test('54 retains accidentals and the independent held-bass voice; 55 remains in C major',()=>{
 const s=get('54-special-fingering-1');assert.deepEqual(at(s,0),[61,64]);assert.deepEqual(at(s,0,'left'),[55,58]);assert.deepEqual(at(s,4),[58,61]);assert.deepEqual(at(s,4.25),[57,62]);
 const pedal=get('54-held-bass');assert.ok(pedal.notes.some(n=>n.pitch===43&&n.beat===0&&n.duration===2));assert.ok(pedal.notes.some(n=>n.pitch===43&&n.beat===8.5&&n.duration===.5));
 const triple=get('55');assert.deepEqual(at(triple,0),[55,60]);assert.deepEqual(at(triple,0,'left'),[52]);assert.ok(triple.notes.every(n=>[0,2,4,5,7,9,11].includes(n.pitch%12)));
});
