import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {REPERTOIRE} from '../public/repertoire.mjs';
import {normalizeScore,scoreToTimedNotes} from '../public/score-model.mjs';
import {parseMidi,midiToScore} from '../public/midi.mjs';
import {buildNotationBars} from '../public/notation.mjs';
const manifest=JSON.parse(readFileSync(new URL('../research/REPERTOIRE-MANIFEST.json',import.meta.url)));
test('each grade has ten distinct musical works; basic drills do not count',()=>{
 const graded=REPERTOIRE.filter(s=>s.grade);assert.equal(graded.length,100);assert.equal(new Set(graded.map(s=>s.id)).size,100);
 for(let g=1;g<=10;g++)assert.equal(graded.filter(s=>s.grade===g).length,10);
 for(const s of graded){assert(!/哈农|音阶接力|五指/.test(s.title));assert.equal(s.grading,'general');normalizeScore(s);}
});
test('90 sourced MIDI scores retain every pitch, onset, duration, tempo and explicit hand assignment',()=>{
 for(const m of manifest){const bytes=readFileSync(new URL(`../research/repertoire/${m.name}/${m.name}.mid`,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256);
 const parsed=parseMidi(bytes),original=midiToScore(parsed,{rightTrackIds:[parsed.tracks[0].id],leftTrackIds:[parsed.tracks[1].id],quantize:0});const s=REPERTOIRE.find(s=>s.title===m.title&&s.grade===m.grade);assert(s,m.name);
 const music=score=>score.notes.map(n=>[n.pitch,n.beat,n.duration,n.hand]);assert.deepEqual(music(s),music(original),m.name);assert.deepEqual(s.tempoMap,original.tempoMap,m.name);assert.equal(scoreToTimedNotes(s).length,s.notes.filter(n=>n.pitch!==null).length);
 }
});
test('all graded scores prepare complete bars in both hands without mutating source timing',()=>{
 for(const raw of REPERTOIRE.filter(s=>s.grade)){const score=normalizeScore(raw),before=JSON.stringify(score),p=buildNotationBars(score);assert.equal(JSON.stringify(score),before);
 for(const bar of p.bars)for(const hand of ['left','right'])assert(Math.abs(bar.hands[hand].reduce((sum,s)=>sum+s.duration,0)-p.time.barBeats)<1e-7,score.title);
 }
});
test('triplets preserve the three equal onsets and leave a simultaneous sustained voice intact',()=>{
 const p=buildNotationBars({timeSignature:[4,4],totalBeats:4,notes:[0,1,2].map(i=>({id:'t'+i,pitch:60+i,beat:i/3,duration:1/3,hand:'right'})).concat({id:'bass',pitch:48,beat:0,duration:4,hand:'left'})});
 assert.deepEqual(p.bars[0].hands.right.slice(0,3).map(s=>[s.beat,s.duration,s.tuplet]),[[0,1/3,true],[1/3,1/3,true],[2/3,1/3,true]]);assert.equal(p.bars[0].hands.left[0].duration,4);assert.equal(p.warnings.length,0);
});
