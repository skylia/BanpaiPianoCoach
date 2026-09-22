import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {REPERTOIRE} from '../public/repertoire.mjs';
import {normalizeScore,scoreToTimedNotes} from '../public/score-model.mjs';
import {parseMidi,midiToScore} from '../public/midi.mjs';
import {buildNotationBars} from '../public/notation.mjs';
const manifest=JSON.parse(readFileSync(new URL('../research/REPERTOIRE-MANIFEST.json',import.meta.url)));
test('each grade retains ten entries, with three complete Clementi movements added to grade 3',()=>{
 const graded=REPERTOIRE.filter(s=>s.grade);assert.equal(graded.length,103);assert.equal(new Set(graded.map(s=>s.id)).size,103);
 for(let g=1;g<=10;g++)assert.equal(graded.filter(s=>s.grade===g).length,g===3?13:10);
 for(const s of graded){assert(!/哈农|音阶接力|五指/.test(s.title));assert.equal(s.grading,'general');normalizeScore(s);}
});
test('all sourced MIDI scores retain every pitch, onset, duration, tempo and explicit hand assignment',()=>{
 assert.equal(manifest.length,93);
 for(const m of manifest){const bytes=readFileSync(new URL(`../research/repertoire/${m.name}/${m.name}.mid`,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256);
 const parsed=parseMidi(bytes),original=midiToScore(parsed,{rightTrackIds:[parsed.tracks[0].id],leftTrackIds:[parsed.tracks[1].id],quantize:0});const s=REPERTOIRE.find(s=>s.title===m.title&&s.grade===m.grade);assert(s,m.name);
 const music=score=>score.notes.map(n=>[n.pitch,n.beat,n.duration,n.hand,n.velocity]);assert.deepEqual(music(s),music(original),m.name);assert.deepEqual(s.tempoMap,original.tempoMap,m.name);assert.equal(scoreToTimedNotes(s).length,s.notes.filter(n=>n.pitch!==null).length);
 const sourceById=new Map(parsed.tracks.flatMap(t=>t.notes).map(n=>[n.id,n.velocity]));for(const note of s.notes)assert.equal(note.velocity,sourceById.get(note.id),m.name+' velocity '+note.id);
 }
});
test('30 sourced pieces have recorded dynamic changes; fixed-velocity Clementi is not artificially shaped',()=>{
 assert.equal(manifest.filter(m=>m.dynamics.varied).length,30);
 for(const s of REPERTOIRE.filter(s=>s.composer==='克列门蒂'))assert.deepEqual([...new Set(s.notes.map(n=>n.velocity))],[90]);
 for(const s of REPERTOIRE.filter(s=>s.grade===1))assert(s.notes.every(n=>n.velocity===undefined));
});
test('Clementi movements match their audited source order, full lengths, meters, keys and beat units',()=>{
 const expected=[
  {movement:1,title:'第一乐章（Spiritoso）',member:'sonatina-1.mid',bars:38,meter:[2,2],key:'C',notes:333,bpm:156,opening:[72,76,72,67]},
  {movement:2,title:'第二乐章（Andante）',member:'sonatina-1-1.mid',bars:26,meter:[3,4],key:'F',notes:332,bpm:92,opening:[72,77,69,72]},
  {movement:3,title:'第三乐章（Vivace）',member:'sonatina-1-2.mid',bars:70,meter:[3,8],key:'C',notes:473,bpm:80,opening:[76,74,72,72]},
 ];
 for(const e of expected){
  const name='clementi-op36-no1-movement'+e.movement,s=REPERTOIRE.find(s=>s.id==='mutopia-'+name),m=manifest.find(m=>m.name===name);assert(s&&m);
  assert.equal(s.grade,3);assert.equal(s.composer,'克列门蒂');assert(s.title.endsWith(e.title));assert.equal(m.archiveMember,e.member);
  assert.equal(s.notes.length,e.notes);assert.equal(buildNotationBars(s).totalBars,e.bars);assert.deepEqual(s.timeSignature,e.meter);assert.equal(s.keySignature,e.key);assert(Math.abs(s.bpm-e.bpm)<.001);
  assert.deepEqual(s.notes.filter(n=>n.hand==='right').slice(0,4).map(n=>n.pitch),e.opening);
  assert.equal(m.license,'Public Domain');assert.equal(m.maintainer,'Brian D. Rude');assert.equal(m.page,'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=804');
 }
 const first=REPERTOIRE.find(s=>s.id==='mutopia-clementi-op36-no1-movement1');assert.match(first.source.note,/不展开反复/);
 const second=REPERTOIRE.find(s=>s.id==='mutopia-clementi-op36-no1-movement2');assert(second.notes.some(n=>n.duration<.1),'grace notes must not disappear');
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
