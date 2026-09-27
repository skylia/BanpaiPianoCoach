import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseStaff} from '../scripts/build-primer.mjs';
import {PRIMER_BACH514_PIECES,PRIMER_BACH514_SOURCES} from '../scripts/primer-bach514.mjs';

test('BWV514 uses the audited 1894 public-domain BGA source',()=>{
  const s=PRIMER_BACH514_SOURCES['bach-bwv514'];
  assert.equal(createHash('sha256').update(readFileSync(new URL('../'+s.file,import.meta.url))).digest('hex'),s.sha256);
  assert.match(s.edition,/1894.*printed p\.48 \(PDF p\.43\)/);
  assert.match(s.gradeEvidence,/Level 1.*printed p\.20/);
});

test('BWV514 preserves soprano-clef pitches, unfilled bass and all written short-note figures',()=>{
  const p=PRIMER_BACH514_PIECES[0],r=parseStaff(p.right,'right',3,p.id),l=parseStaff(p.left,'left',3,p.id);
  assert.equal(r.totalBeats,48);assert.equal(l.totalBeats,48);
  assert.equal(r.notes.length,47);assert.equal(l.notes.length,51);
  const bar=(a,b)=>a.filter(n=>n.beat>=(b-1)*3&&n.beat<b*3);
  assert.deepEqual(bar(r.notes,1).map(n=>n.pitch),[72,71,72]);
  assert.deepEqual(bar(r.notes,3).map(n=>[n.pitch,n.duration]),[[65,1.5],[67,.25],[69,.25],[67,1]]);
  assert.deepEqual(bar(l.notes,4).map(n=>n.pitch),[48,43,36]);
  assert.deepEqual(bar(l.notes,6).map(n=>n.pitch),[45,43,42]);
  assert.deepEqual(bar(r.notes,13).map(n=>[n.pitch,n.duration]),[[76,.5],[77,.25],[79,.25],[77,.5],[76,.5],[74,.5],[72,.5]]);
  assert.deepEqual(bar(l.notes,16).map(n=>[n.pitch,n.duration]),[[48,3]]);
});
