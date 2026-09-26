import test from 'node:test';
import assert from 'node:assert/strict';
import {HANON_TREMOLO_MIDDLE} from '../scripts/hanon-tremolo-middle.mjs';
import {normalizeScore} from '../public/score-model.mjs';
const at=(score,hand,beat)=>score.notes.filter(n=>n.hand===hand&&Math.abs(n.beat-beat)<1e-8).map(n=>n.pitch).sort((a,b)=>a-b);
const [p111,p112,p113]=HANON_TREMOLO_MIDDLE;

test('Hanon 60 middle pages retain complete page boundaries, source and strict profile',()=>{
 assert.deepEqual(HANON_TREMOLO_MIDDLE.map(s=>s.totalBeats),[56,32,40]);
 for(const[i,score]of HANON_TREMOLO_MIDDLE.entries()){
  assert.equal(score.id,`hanon-60-part-${i+2}`);assert.equal(score.category,'technique');assert.equal(score.evaluationProfile,'technique');
  assert.equal(score.bpm,48);assert.deepEqual(score.timeSignature,[4,4]);assert.match(score.source.note,new RegExp(String(111+i)));
  assert.ok(score.notes.length<4096);assert.ok(score.notes.every(n=>n.pitch>=21&&n.pitch<=108));assert.deepEqual(normalizeScore(score),score);
  assert.equal(new Set(score.notes.map(n=>n.id)).size,score.notes.length);
 }
});

test('p111 keeps the independent left entrance and the high ff chord ledger pitches',()=>{
 assert.deepEqual(at(p111,'right',0),[74,79,83]);assert.deepEqual(at(p111,'left',0),[50,55,59]);
 assert.deepEqual(at(p111,'left',8),[48]);assert.deepEqual(at(p111,'left',8.125),[52]);assert.deepEqual(at(p111,'left',8.25),[48,52,55]);
 assert.deepEqual(at(p111,'right',14),[81,86,89]);assert.deepEqual(at(p111,'right',14.125),[77]);
 assert.deepEqual(at(p111,'left',14),[38,45]);assert.deepEqual(at(p111,'left',15),[41,45]);
});

test('p111 carries written sharps within the bar and honors the following natural',()=>{
 assert.deepEqual(at(p111,'right',36),[64,68]);assert.deepEqual(at(p111,'right',38),[68]);
 assert.deepEqual(at(p111,'left',38),[52,56]);
 assert.deepEqual(at(p111,'left',44),[54]);assert.deepEqual(at(p111,'left',46),[53]);
 assert.deepEqual(at(p111,'right',46.125),[61]);
});

test('p112 is eight bars and retains chromatic pitches rather than inventing barlines',()=>{
 assert.deepEqual(at(p112,'right',2),[72,77]);assert.deepEqual(at(p112,'right',3),[72,78]);
 assert.deepEqual(at(p112,'left',3),[56]);assert.deepEqual(at(p112,'right',4),[72,79]);
 assert.deepEqual(at(p112,'left',6),[54,60]);assert.deepEqual(at(p112,'left',6.125),[63]);
 assert.deepEqual(at(p112,'right',16),[81,84]);assert.deepEqual(at(p112,'right',19),[81,87]);
 assert.deepEqual(at(p112,'right',22),[81,89]);
});

test('phrase closings sustain the final single note once and preserve the following rest',()=>{
 for(const[score,end,hand,pitch]of [[p111,24,'right',72],[p111,24,'left',60],[p111,56,'right',60],[p112,16,'left',48],[p112,32,'right',69],[p113,40,'left',33]]){
  const tied=score.notes.find(n=>n.hand===hand&&n.pitch===pitch&&n.beat===end-2.125);
  assert.ok(tied);assert.equal(tied.duration,1.125);assert.ok(!at(score,hand,end-2).includes(pitch));
  assert.ok(!score.notes.some(n=>n.beat>=end-1&&n.beat<end));
 }
});

test('p113 retains the descending accompaniment and applies the final bass octave sign',()=>{
 assert.deepEqual(at(p113,'left',0),[57,60]);assert.deepEqual(at(p113,'left',16),[45,48]);
 assert.deepEqual(at(p113,'left',32),[33]);assert.deepEqual(at(p113,'left',34),[28]);
 assert.deepEqual(at(p113,'left',35),[24]);assert.deepEqual(at(p113,'left',36),[21]);
 assert.deepEqual(at(p113,'left',36.125),[33]);assert.deepEqual(at(p113,'right',36),[60,64,69]);
});
