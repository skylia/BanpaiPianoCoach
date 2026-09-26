import test from 'node:test';
import assert from 'node:assert/strict';
import {HANON_TRANSCENDENT as raw} from '../public/hanon-transcendent.mjs';
import {normalizeScore,barCount} from '../public/score-model.mjs';
const scores=raw.map(normalizeScore);
const get=id=>scores.find(s=>s.id===`hanon-${id}`);
const at=(s,beat,hand='right')=>s.notes.filter(n=>n.beat===beat&&n.hand===hand).map(n=>n.pitch);
const melody=(s,start,count,hand='right')=>s.notes.filter(n=>n.hand===hand&&n.beat>=start&&n.beat<start+count*.25).map(n=>n.pitch);

test('21–38 retain all numbered exercises, both sections of 38, and schema bounds',()=>{
 assert.equal(scores.length,19);assert.deepEqual([...new Set(scores.map(s=>Number(/^hanon-(\d+)/.exec(s.id)[1])))],Array.from({length:18},(_,i)=>21+i));
 for(const s of scores){assert.equal(s.category,'technique');assert.equal(s.evaluationProfile,'technique');assert.ok(s.notes.length<=4096);assert.ok(barCount(s)<=256);assert.ok(s.notes.some(n=>n.hand==='left'));assert.ok(s.notes.some(n=>n.hand==='right'));}
});
test('21–30 preserve separate descending figures and terminal-bar exceptions',()=>{
 assert.deepEqual(melody(get(21),0,16),[48,50,52,50,48,52,53,55,57,55,53,55,57,55,53,52]);
 assert.deepEqual(melody(get(22),108+3,4),[48,53,52,50]);
 assert.equal(at(get(26),.75)[0],52);assert.deepEqual(melody(get(27),.5,2),[50,52]);
 assert.equal(get(30).totalBeats,110);assert.deepEqual(melody(get(30),107,4),[50,52,50,52]);
 for(let n=21;n<=30;n++){const s=get(n);assert.deepEqual(at(s,s.totalBeats-2),[48]);assert.deepEqual(at(s,s.totalBeats-2,'left'),[36]);}
});
test('31 keeps the different hand registers, midpoint sustain, final octaves and rest',()=>{
 const s=get(31);assert.equal(s.totalBeats,90);
 assert.deepEqual(melody(s,0,12),[52,64,62,64,60,64,59,64,57,64,55,64]);
 assert.deepEqual(melody(s,0,12,'left'),[36,48,47,48,45,48,43,48,41,48,40,48]);
 assert.deepEqual(at(s,42),[76]);assert.deepEqual(at(s,42,'left'),[60]);
 assert.deepEqual(at(s,45),[88]);assert.deepEqual(at(s,45,'left'),[72]);
 assert.deepEqual(at(s,87),[52,64]);assert.deepEqual(at(s,87,'left'),[36,48]);assert.deepEqual(at(s,89),[null]);
});
test('32–35 expand original warmup repetitions instead of substituting generic scales',()=>{
 for(const[n,repeats,barBeats,duration]of [[32,4,3,48],[33,4,3,84],[34,10,2,80],[35,10,3,117]]){
  const s=get(n);assert.equal(s.totalBeats,duration);
  for(let i=1;i<repeats;i++)assert.deepEqual(melody(s,i*barBeats,barBeats*4),melody(s,0,barBeats*4));
 }
 assert.deepEqual(melody(get(32),30,12),[86,84,86,88,86,84,83,81,79,83,81,79]);
 assert.deepEqual(melody(get(36),16,8),[74,77,76,74,72,74,72,71]);
});
test('37 scores only sounding thumb notes and clearly documents silent held keys',()=>{
 const s=get(37);assert.equal(s.totalBeats,48);assert.equal(barCount(s),12);
 assert.deepEqual(at(s,0),[72]);assert.deepEqual(at(s,0,'left'),[48]);
 assert.ok(s.notes.every(n=>n.finger===1));assert.match(s.source.note,/D5、F5、A5/);assert.match(s.source.note,/静默持音不列作/);
 assert.deepEqual(at(s,44),[72]);assert.equal(s.notes.find(n=>n.beat===44).duration,4);
});
test('38 includes both motion types and preserves the printed non-generic closing registers',()=>{
 const p=get('38-parallel'),c=get('38-contrary');
 assert.equal(p.totalBeats,64);assert.equal(c.totalBeats,64);
 assert.deepEqual([at(p,0),at(p,30),at(p,32),at(p,62)],[[48],[72],[84],[60]]);
 assert.deepEqual([at(p,0,'left'),at(p,62,'left')],[[36],[48]]);
 assert.deepEqual([at(c,0),at(c,0,'left'),at(c,30),at(c,30,'left')],[[60],[48],[84],[72]]);
 assert.deepEqual([at(c,32),at(c,32,'left'),at(c,62),at(c,62,'left')],[[96],[60],[72],[36]]);
});
