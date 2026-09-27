import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PRIMER_REPERTOIRE,PRIMER_ARCHIVE,PRIMER_DEMOS} from '../public/primer-repertoire.mjs';
import {REPERTOIRE,LEGACY_REPERTOIRE} from '../public/repertoire.mjs';
import {normalizeScore,barCount,scoreToTimedNotes} from '../public/score-model.mjs';
import {analyzeFollow} from '../public/follow.mjs';

test('ten distinct complete beginner works have two playable staves and source difficulty evidence',()=>{
  assert.equal(PRIMER_REPERTOIRE.length,10);
  assert.equal(new Set(PRIMER_REPERTOIRE.map(s=>s.id)).size,10);
  assert.deepEqual(REPERTOIRE.filter(s=>s.grade===1).map(s=>s.id),PRIMER_REPERTOIRE.map(s=>s.id));
  for(const s of PRIMER_REPERTOIRE){
    assert.deepEqual(normalizeScore(s),s);
    assert.equal(s.grade,1);
    assert.equal(s.evaluationProfile,'musical');
    assert(s.notes.some(n=>n.hand==='left'&&n.pitch!==null));
    assert(s.notes.some(n=>n.hand==='right'&&n.pitch!==null));
    assert.match(s.source.note,/难度参考：/);
    const notes=scoreToTimedNotes(s),follow=analyzeFollow(notes,notes,s.bpm,{elapsed:1000,evaluationProfile:'musical'});
    assert.equal(follow.follow.completedGroups,follow.follow.totalGroups,s.id);
    assert.equal(follow.follow.errorAttempts,0,s.id);
  }
});

test('former ten Gurlitt pieces remain byte-identical and resolvable only through the legacy registry',()=>{
  // Snapshot of the complete former PRIMER_REPERTOIRE before the grade-one replacement.
  assert.equal(createHash('sha256').update(JSON.stringify(PRIMER_ARCHIVE)).digest('hex'),'4662e87db664243d7139267bea38205a3a2b537e2703dec0ce70d7ae386391e6');
  assert.deepEqual(PRIMER_ARCHIVE.map(barCount),[16,12,25,9,16,24,16,16,16,12]);
  for(const [i,score] of PRIMER_ARCHIVE.entries()){
    assert.equal(score.id,`gurlitt-op117-${i+1}`);
    assert.deepEqual(LEGACY_REPERTOIRE.find(s=>s.id===score.id),score);
    assert(!REPERTOIRE.some(s=>s.id===score.id));
    assert(!PRIMER_DEMOS.some(d=>d.scoreIds.includes(score.id)));
  }
});

test('each source PDF is pinned and non-public-domain editions retain their own licenses',()=>{
  const meta=JSON.parse(readFileSync(new URL('../research/primer/source.json',import.meta.url)));
  assert.equal(meta.entries.length,10);
  for(const source of Object.values(meta.sources)){
    const pdf=readFileSync(new URL('../'+source.file,import.meta.url));
    assert.equal(createHash('sha256').update(pdf).digest('hex'),source.sha256,source.file);
    assert(source.gradeEvidence&&source.gradeUrl);
  }
  for(const [id,license,credit]of [['krieger-minuet-a-minor','CC BY-SA 4.0','Klaus Heidtmann'],['jcbach-wa22','CC BY 3.0','RSB']]){
    const entry=meta.entries.find(p=>p.id===id),score=PRIMER_REPERTOIRE.find(s=>s.id===id);
    assert.equal(entry.transcriptionLicense,license);
    assert(score.source.note.includes(license));
    assert(score.source.note.includes(credit));
    assert.doesNotMatch(score.source.note,/CC0/);
  }
});

test('Krieger overlapping bass survives integration and Mozart triplets keep fractional onset times',()=>{
  const krieger=PRIMER_REPERTOIRE.find(s=>s.id==='krieger-minuet-a-minor');
  for(const [beat,pitch]of [[20,40],[44,43],[68,40]]){
    assert(krieger.notes.some(n=>n.hand==='left'&&n.pitch===pitch&&n.beat===beat&&n.duration===1));
    assert(krieger.notes.some(n=>n.hand==='left'&&n.pitch===pitch+12&&n.beat===beat-1&&n.duration===2),`sustained inner voice above the bass onset at ${beat}`);
  }
  const mozart=PRIMER_REPERTOIRE.find(s=>s.id==='mozart-k2');
  const triplet=mozart.notes.filter(n=>n.hand==='right'&&n.beat>=18-1e-7&&n.beat<19-1e-7);
  assert.equal(triplet.length,3);
  for(const [i,n]of triplet.entries()){
    assert(Math.abs(n.beat-(18+i/3))<1e-7);
    assert(Math.abs(n.duration-1/3)<1e-7);
  }
});

test('every active replacement has a local authorized recording or exact Bilibili reference',()=>{
  assert.equal(PRIMER_DEMOS.length,10);
  assert.doesNotMatch(JSON.stringify(PRIMER_DEMOS),/youtube|youtu\.be/i);
  for(const score of PRIMER_REPERTOIRE){
    const matches=PRIMER_DEMOS.filter(d=>d.scoreIds.includes(score.id));
    assert.equal(matches.length,1,score.id);
    const [demo]=matches;
    assert(demo.performer&&demo.attribution&&demo.coverage&&demo.license);
    assert.equal(demo.mapping,null);
    if(demo.kind==='audio'){
      const bytes=readFileSync(new URL('../public/'+demo.src.replace(/^\.\//,''),import.meta.url));
      assert.equal(createHash('sha256').update(bytes).digest('hex'),demo.sha256,demo.id);
      assert.match(demo.license,/^CC BY/);
    }else{
      assert.equal(demo.kind,'external');
      assert.match(demo.sourceUrl,/^https:\/\/www\.bilibili\.com\/video\/BV[A-Za-z0-9]{10}\/?$/);
      assert.equal(demo.src,undefined);
    }
  }
});

test('Türk Echo bar eight sustains the tied left-hand F sharp without an extra attack',()=>{
  const score=PRIMER_REPERTOIRE.find(s=>s.id==='turk-hunting-horns-echo');
  const left=score.notes.filter(n=>n.hand==='left'&&n.pitch!==null&&n.beat>=28&&n.beat<32);
  assert.deepEqual(left.map(n=>[n.pitch,n.beat,n.duration]),[[66,28,1.75],[64,29.75,.25],[62,30,1],[57,31,.75],[57,31.75,.25]]);
});

test('Gurlitt Morning Greeting keeps six cross-bar ties as sustained notes',()=>{
  const score=PRIMER_REPERTOIRE.find(s=>s.id==='gurlitt-op117-13');
  for(const [hand,pitch,beats]of [['right',74,[1,4,25,28]],['left',57,[13,16]]])for(const beat of beats){
    assert(score.notes.some(n=>n.hand===hand&&n.pitch===pitch&&n.beat===beat&&n.duration===1));
    assert(!score.notes.some(n=>n.hand===hand&&n.pitch===pitch&&n.beat===beat+.5));
  }
});
