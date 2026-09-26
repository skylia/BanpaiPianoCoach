import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseStaff} from '../scripts/build-primer.mjs';
import {PRIMER_TURK_BALLET_PIECES,PRIMER_TURK_BALLET_SOURCES,PRIMER_TURK_BALLET_DEMOS} from '../scripts/primer-turk-ballet.mjs';

const piece=PRIMER_TURK_BALLET_PIECES[0];
const hand=name=>parseStaff(piece[name],name,piece.meter,piece.id);
const passage=(notes,start,end)=>notes.filter(n=>n.pitch!==null&&n.beat>=start&&n.beat<end);

test('Türk Ballet original edition and licensed recording retain audited bytes',()=>{
  const source=PRIMER_TURK_BALLET_SOURCES['turk-ballet'],demo=PRIMER_TURK_BALLET_DEMOS[0];
  for(const [file,hash]of [[source.file,source.sha256],['public/'+demo.src.replace(/^\.\//,''),demo.sha256]]){
    assert.equal(createHash('sha256').update(readFileSync(new URL('../'+file,import.meta.url))).digest('hex'),hash);
  }
  assert.equal(demo.license,'CC BY-NC-SA 4.0');
  assert.match(demo.attribution,/noncommercial/);
  assert.match(source.gradeEvidence,/Level 1/);
});

test('Türk Ballet preserves both pickups and closes each written section',()=>{
  const r=hand('right'),l=hand('left');
  assert.equal(r.totalBeats,34);assert.equal(l.totalBeats,34);
  assert.equal(r.notes.filter(n=>n.pitch!==null).length,75);
  assert.equal(l.notes.filter(n=>n.pitch!==null).length,48);
  assert.deepEqual(passage(r.notes,0,2).map(n=>[n.pitch,n.beat,n.duration]),[[69,1.5,.5]]);
  assert.deepEqual(passage(r.notes,16,18).map(n=>[n.pitch,n.beat,n.duration]),[[69,16,1],[69,17.5,.25],[71,17.75,.25]]);
  assert.deepEqual(passage(r.notes,32,34).map(n=>[n.pitch,n.duration]),[[62,1]]);
  assert.deepEqual(passage(l.notes,32,34).map(n=>[n.pitch,n.duration]),[[50,1]]);
});

test('Türk Ballet retains D-major accidentals and left-hand clef changes',()=>{
  const r=hand('right').notes,l=hand('left').notes;
  assert.deepEqual(passage(r,2,4).map(n=>n.pitch),[74,74,74,69]);
  assert.deepEqual(passage(l,2,4).map(n=>n.pitch),[66,66,66]);
  assert.deepEqual(passage(l,14,18).map(n=>n.pitch),[49,49,50,52,45]);
  assert.deepEqual(passage(l,18,22).map(n=>n.pitch),[64,67,64,64,67,64]);
  assert.deepEqual(passage(l,30,34).map(n=>n.pitch),[54,54,55,57,50]);
  assert.deepEqual(passage(r,15,15.5).map(n=>[n.pitch,n.duration]),[[73,.125],[71,.375]]);
  assert.deepEqual(passage(r,31,31.5).map(n=>[n.pitch,n.duration]),[[66,.125],[64,.375]]);
});
