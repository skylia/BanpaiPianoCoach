import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseStaff} from '../scripts/build-primer.mjs';
import {PRIMER_EXTRA_PIECES,PRIMER_EXTRA_SOURCES,PRIMER_EXTRA_DEMOS} from '../scripts/primer-extra-pieces.mjs';

const hand=(id,name)=>{const p=PRIMER_EXTRA_PIECES.find(p=>p.id===id);return parseStaff(p[name],name,p.meter,p.id);};
const between=(notes,start,end)=>notes.filter(n=>n.pitch!==null&&n.beat>=start-1e-8&&n.beat<end-1e-8);

test('historical source PDFs and licensed audio match audited hashes',()=>{
  for(const s of Object.values(PRIMER_EXTRA_SOURCES))assert.equal(createHash('sha256').update(readFileSync(new URL('../'+s.file,import.meta.url))).digest('hex'),s.sha256);
  for(const d of PRIMER_EXTRA_DEMOS)assert.equal(createHash('sha256').update(readFileSync(new URL('../public/'+d.src.replace(/^\.\//,''),import.meta.url))).digest('hex'),d.sha256);
});

test('WoO86 retains the original pickup, second endings, high register and A natural',()=>{
  const r=hand('beethoven-woo86','right'),l=hand('beethoven-woo86','left');
  assert.equal(r.totalBeats,34);assert.equal(l.totalBeats,34);
  assert.equal(r.notes.filter(n=>n.pitch!==null).length,52);assert.equal(l.notes.filter(n=>n.pitch!==null).length,47);
  assert.deepEqual(between(r.notes,0,2).map(n=>[n.pitch,n.beat,n.duration]),[[63,1,.5],[63,1.5,.5]]);
  assert.deepEqual(between(r.notes,16,18).map(n=>n.pitch),[63,63,65]);
  assert.deepEqual(between(r.notes,26,28).map(n=>n.pitch),[79,82,80,79]);
  assert.deepEqual(between(r.notes,30,34).map(n=>n.pitch),[77,81,82,75]);
});

test('K2 preserves the exact triplet and chromatic notes across all 24 bars',()=>{
  const r=hand('mozart-k2','right'),l=hand('mozart-k2','left');
  assert.equal(r.totalBeats,72);assert.equal(l.totalBeats,72);
  assert.equal(r.notes.filter(n=>n.pitch!==null).length,85);assert.equal(l.notes.filter(n=>n.pitch!==null).length,45);
  const triplet=between(r.notes,18,19);assert.deepEqual(triplet.map(n=>n.pitch),[60,64,67]);
  for(const n of triplet)assert.equal(n.duration,1/3);
  assert(Math.abs(triplet[2].beat+triplet[2].duration-19)<1e-7);
  assert.deepEqual(between(r.notes,24,27).map(n=>n.pitch),[72,75,69,69]);
  assert.deepEqual(between(l.notes,24,27).map(n=>n.pitch),[54]);
  assert.deepEqual(between(r.notes,30,36).map(n=>n.pitch),[69,72,66,66,66,67]);
  assert.deepEqual(between(l.notes,69,72).map(n=>n.pitch),[53,48,41]);
});

test('K3 preserves the second pickup without an inserted pause and both written grace pitches',()=>{
  const r=hand('mozart-k3','right'),l=hand('mozart-k3','left');
  assert.equal(r.totalBeats,62);assert.equal(l.totalBeats,62);
  assert.equal(r.notes.filter(n=>n.pitch!==null).length,99);assert.equal(l.notes.filter(n=>n.pitch!==null).length,64);
  assert.deepEqual(between(r.notes,24,26).map(n=>[n.pitch,n.beat,n.duration]),[[65,24,1.5],[77,25.5,.5]]);
  assert.deepEqual(between(r.notes,18,18.5).map(n=>n.pitch),[69,67]);
  assert.deepEqual(between(r.notes,54,54.5).map(n=>n.pitch),[74,72]);
  assert.deepEqual(between(r.notes,58,60).map(n=>n.pitch),[72,71,72,71,72,74]);
  assert.deepEqual(between(r.notes,60,62).map(n=>[n.pitch,n.duration]),[[70,1.5]]);
});
