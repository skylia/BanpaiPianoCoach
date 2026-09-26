import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {HANON_REPERTOIRE as scores} from '../public/hanon-repertoire.mjs';
import {HANON_TREMOLO_OPENING} from '../scripts/hanon-tremolo-outer.mjs';
import {HANON_TREMOLO_MIDDLE} from '../scripts/hanon-tremolo-middle.mjs';
import {HANON_TREMOLO_CLOSING} from '../scripts/hanon-tremolo-closing.mjs';
import {parseMidi} from '../public/midi.mjs';
import {normalizeScore,barCount} from '../public/score-model.mjs';
const root=new URL('../research/hanon/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('MANIFEST.json',root)));
const hash=path=>createHash('sha256').update(readFileSync(new URL(path,root))).digest('hex');

test('published Hanon library contains every number 1–60 and all six final-page sections',()=>{
 assert.equal(scores.length,228);assert.equal(new Set(scores.map(s=>s.id)).size,228);
 assert.deepEqual([...new Set(scores.map(s=>Number(s.id.match(/^hanon-(\d+)/)[1])))],Array.from({length:60},(_,i)=>i+1));
 assert.deepEqual(scores.filter(s=>s.id.startsWith('hanon-60-')),[HANON_TREMOLO_OPENING,...HANON_TREMOLO_MIDDLE,...HANON_TREMOLO_CLOSING]);
 for(const s of scores){
  assert.deepEqual(normalizeScore(s),s);assert.equal(s.category,'technique');assert.equal(s.evaluationProfile,'technique');
  assert.ok(s.notes.length<=4096);assert.ok(barCount(s)<=256);
  assert.equal(new Set(s.notes.map(n=>n.id)).size,s.notes.length);
  assert.ok(s.notes.every(n=>(n.pitch===null||(n.pitch>=21&&n.pitch<=108))&&n.beat>=0&&n.beat+n.duration<=s.totalBeats+1e-6));
 }
});
test('source manifest matches current catalogue and original-file SHA-256 fingerprints',()=>{
 assert.equal(manifest.length,scores.length);
 const scanHash=hash('Schirmer-1900-complete.pdf');
 for(const [i,row]of manifest.entries()){
  const score=scores[i];assert.equal(row.number,Number(score.id.match(/^hanon-(\d+)/)[1]));
  assert.equal(row.notes,score.notes.length);assert.equal(row.bars,barCount(score));
  if(row.part===1){assert.equal(hash(row.lyPath),row.lySha256);assert.equal(hash(row.midiPath),row.midiSha256);assert.equal(row.license,'CC BY-SA 4.0');}
  else{assert.equal(row.id,score.id);assert.equal(row.scanSha256,scanHash);assert.match(row.license,/CC0-1.0/);}
 }
});
test('all twenty Mutopia adaptations retain the independent original MIDI note timing',()=>{
 const signature=ns=>ns.filter(n=>n.pitch!==null).map(n=>[n.pitch,n.beat,n.duration]).sort((a,b)=>a[1]-b[1]||b[0]-a[0]);
 for(let n=1;n<=20;n++){
  const row=manifest.find(r=>r.number===n),source=parseMidi(readFileSync(new URL(row.midiPath,root)));
  assert.deepEqual(signature(scores.find(s=>s.id===`hanon-${n}`).notes),signature(source.tracks.flatMap(t=>t.notes)),`Hanon ${n} differs from the source MIDI`);
 }
});
