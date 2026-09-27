import test from 'node:test';
import assert from 'node:assert/strict';
import {HANON_SCALE_SCORES as scores} from '../public/hanon-scales.mjs';
import {normalizeScore,barCount} from '../public/score-model.mjs';
import {transcribeHanonScales} from '../scripts/transcribe-hanon-scales.mjs';

const get=id=>scores.find(s=>s.id===`hanon-${id}`);
const at=(s,beat,hand='right')=>s.notes.filter(n=>n.beat===beat&&n.hand===hand).map(n=>n.pitch);

test('39–43 cover all printed variants and the checked-in file is reproducible',()=>{
 assert.deepEqual(scores,transcribeHanonScales());
 assert.equal(new Set(scores.map(s=>s.id)).size,70);
 for(const [number,count] of [[39,36],[40,8],[41,24],[42,1],[43,1]])assert.equal(scores.filter(s=>s.id.startsWith(`hanon-${number}-`)).length,count);
 for(const s of scores){assert.deepEqual(normalizeScore(s),s);assert.equal(s.category,'technique');assert.equal(s.evaluationProfile,'technique');assert.ok(s.notes.length<=4096);assert.ok(barCount(s)<=256);}
});

test('39 C major retains the scanned four-octave path and complete cadence',()=>{
 const s=get('39-c-major');
 assert.equal(s.totalBeats,20);
 assert.deepEqual([at(s,0),at(s,7),at(s,13.75)],[[48],[96],[50]]);
 assert.deepEqual(at(s,14,'left'),[36,48]);
 assert.deepEqual(at(s,15),[62,69,72]);assert.deepEqual(at(s,15,'left'),[41,53]);
 assert.deepEqual(at(s,16),[64,67,72]);assert.deepEqual(at(s,16,'left'),[43,55]);
 assert.deepEqual(at(s,17),[62,65,67,71]);assert.deepEqual(at(s,17,'left'),[31,43]);
 assert.deepEqual(at(s,18),[60,64,67,72]);
 assert.ok(s.notes.filter(n=>n.beat===18).every(n=>n.duration===2));
});

test('39 melodic minor changes sixth/seventh only on descent; harmonic minor keeps its leading tone',()=>{
 const melodic=get('39-aminor-melodic'),harmonic=get('39-aminor-harmonic');
 assert.deepEqual([at(melodic,1.25),at(melodic,1.5),at(melodic,7.25),at(melodic,7.5)],[[54],[56],[91],[89]]);
 assert.deepEqual([at(harmonic,1.25),at(harmonic,1.5),at(harmonic,7.25),at(harmonic,7.5)],[[53],[56],[92],[89]]);
 assert.deepEqual(at(harmonic,15),[71,77,81]);
 // Enharmonic G# minor starts an octave above the Ab-major start in this edition.
 assert.deepEqual(at(get('39-gsharpminor-harmonic'),0),[56]);
 assert.deepEqual(at(get('39-ab-major'),0),[44]);
});

test('40 keeps the actual close-position minor third and opposing directions',()=>{
 const third=get('40-minor-third');
 assert.deepEqual([at(third,0),at(third,0,'left'),at(third,12),at(third,12,'left')],[[39],[36],[87],[84]]);
 const contrary=get('40-contrary-minor-third');
 assert.deepEqual([at(contrary,0),at(contrary,6),at(contrary,6,'left')],[[87],[63],[60]]);
 for(const s of scores.filter(s=>s.id.startsWith('hanon-40-'))){assert.deepEqual(at(s,s.totalBeats-1),[null]);assert.deepEqual(at(s,s.totalBeats-1,'left'),[null]);}
 const legato=get('40-legato-fingering');
 assert.equal(legato.notes.find(n=>n.hand==='right'&&n.beat===6).finger,3);
});

test('41 uses four octaves and preserves the lower Gb/G/F# register of the arpeggio edition',()=>{
 const s=get('41-c');
 assert.deepEqual([at(s,0),at(s,2.75),at(s,3),at(s,5.75),at(s,6)],[[48],[91],[96],[52],[48]]);
 assert.deepEqual(at(get('41-gb'),0),[42]);assert.deepEqual(at(get('41-g'),0),[43]);assert.deepEqual(at(get('41-fsharpminor'),0),[42]);
 assert.equal(scores.filter(s=>s.id.startsWith('hanon-41-')).every(s=>s.totalBeats===9),true);
});

test('42/43 expand all seven roots, four warmups, two main passes and the genuine coda',()=>{
 const dim=get('42-complete'),dom=get('43-complete');
 assert.equal(dim.totalBeats,144);assert.equal(dom.totalBeats,150);
 for(const s of [dim,dom]){
  for(const [i,root] of [48,50,52,53,55,57,59].entries()){
   for(const offset of [0,2,4,6,8,14])assert.deepEqual(at(s,i*20+offset),[root]);
  }
 }
 assert.deepEqual(at(dim,140),[71]);assert.deepEqual(at(dim,141.75),[50]);assert.deepEqual(at(dim,142),[48]);assert.deepEqual(at(dim,142,'left'),[36]);
 assert.deepEqual(at(dom,140.75),[71]); // printed B natural, not Bb
 assert.deepEqual(at(dom,142),[84]);assert.deepEqual(at(dom,146),[60]);assert.deepEqual(at(dom,147),[48]);
 assert.deepEqual(at(dom,148),[48,52,55,60]);assert.deepEqual(at(dom,148,'left'),[36,40,43]);
});
