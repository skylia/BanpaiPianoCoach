import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNotationBars,notationTime,chooseNotationClefs,notationFollowTarget} from '../public/notation.mjs';
const base={title:'Notation test',timeSignature:[4,4],keySignature:'C',totalBeats:8,bpm:80,notes:[]};
const n=(id,pitch,beat,duration,hand='right')=>({id,pitch,beat,duration,hand});

test('follow keeps the page still while current and next systems are fully visible',()=>{
  assert.equal(notationFollowTarget({top:36,height:198,nextBottom:438,scrollTop:0,viewportHeight:470}),null);
});
test('follow reveals the next system before the current one reaches the viewport bottom',()=>{
  // The active system itself fits, but the following system is clipped.
  assert.equal(notationFollowTarget({top:238,height:198,nextBottom:640,scrollTop:0,viewportHeight:470}),238);
});
test('enlarged notation keeps the current system whole when two cannot fit',()=>{
  assert.equal(notationFollowTarget({top:36,height:355,nextBottom:752,scrollTop:0,viewportHeight:470}),null);
  assert.equal(notationFollowTarget({top:397,height:355,nextBottom:1113,scrollTop:0,viewportHeight:470}),397);
});
test('follow handles backwards playback, the final system, and a system taller than the viewport',()=>{
  assert.equal(notationFollowTarget({top:36,height:198,nextBottom:438,scrollTop:420,viewportHeight:470}),36);
  assert.equal(notationFollowTarget({top:36,height:198,nextBottom:null,scrollTop:0,viewportHeight:470}),null);
  assert.equal(notationFollowTarget({top:4,height:900,nextBottom:null,scrollTop:0,viewportHeight:470}),4);
});

test('notation splits an eight-beat sustained note across bars without losing its id or duration',()=>{
  const result=buildNotationBars({...base,notes:[n('held',60,0,8)]});
  assert.equal(result.bars.length,2);
  const segments=result.bars.flatMap(b=>b.hands.right).filter(s=>s.notes.some(n=>n.id==='held'));
  assert.equal(segments.reduce((s,n)=>s+n.duration,0),8);assert.deepEqual(segments.map(s=>s.beat),[0,4]);
});
test('mixed polyphony preserves sustained voices using split chords and a disclosure',()=>{
  const result=buildNotationBars({...base,totalBeats:4,notes:[n('long',60,0,4),n('short',64,1,1)]});
  const parts=result.bars[0].hands.right;
  assert.deepEqual(parts.map(p=>[p.beat,p.duration,p.notes.map(n=>n.id)]),[[0,1,['long']],[1,1,['long','short']],[2,2,['long']]]);
  assert.match(result.warnings.join(''),/复调/);
});
test('dotted notes, chords, and explicit rests remain selectable and fill a complete bar',()=>{
  const result=buildNotationBars({...base,totalBeats:4,notes:[n('c',60,0,1.5),n('e',64,0,1.5),n('rest',null,1.5,.5),n('g',67,2,2)]});
  const parts=result.bars[0].hands.right;
  assert.equal(parts[0].value,'q');assert.equal(parts[0].dots,1);assert.equal(parts[0].notes.length,2);
  assert.equal(parts[1].notes.length,0);assert.equal(parts[1].rests[0].id,'rest');
  assert.equal(parts.reduce((s,n)=>s+n.duration,0),4);
});
test('notation quantization is disclosed and never mutates imported performance data',()=>{
  const score={...base,notes:[n('a',60,.12,.37)]};const copy=structuredClone(score);
  const result=buildNotationBars(score);assert.deepEqual(score,copy);assert.match(result.warnings.join(''),/网格/);
});
test('a selected bar range retains absolute quarter-beat positions for playback',()=>{
  const result=buildNotationBars({...base,totalBeats:32,notes:[n('later',64,12,1)]},{startBar:4,endBar:5});
  assert.deepEqual(result.bars.map(b=>b.number),[4,5]);assert.equal(result.bars[0].startBeat,12);
});
test('empty hands receive exact rests for simple and compound meters',()=>{
  for(const ts of [[4,4],[3,4],[6,8],[2,2],[16,16],[3,32],[1,1]]) {
    const {barBeats}=notationTime({timeSignature:ts});
    const result=buildNotationBars({...base,totalBeats:barBeats,timeSignature:ts});
    assert.equal(result.bars.length,1);
    for(const hand of ['right','left'])assert.equal(result.bars[0].hands[hand].reduce((s,n)=>s+n.duration,0),barBeats);
  }
});
test('long score rendering is bounded at 256 bars and explains the displayed range',()=>{
  const result=buildNotationBars({...base,totalBeats:2000});assert.equal(result.bars.length,256);assert.match(result.warnings.join(''),/256/);
});
test('same-pitch overlap is merged visually and disclosed without changing the original events',()=>{
  const result=buildNotationBars({...base,totalBeats:4,notes:[n('first',60,0,3),n('second',60,1,2)]});
  assert.equal(result.notes.length,2);assert(result.bars[0].hands.right.every(s=>s.notes.length<=1));assert.match(result.warnings.join(''),/同音/);
});

test('high-register left hand uses treble consistently and empty hands keep conventional defaults',()=>{
  assert.deepEqual(chooseNotationClefs(base),{right:'treble',left:'bass'});
  const high={...base,notes:[n('r',72,0,4),n('l1',60,0,2,'left'),n('l2',64,2,2,'left')]};
  assert.deepEqual(chooseNotationClefs(high),{right:'treble',left:'treble'});
  assert.deepEqual(buildNotationBars(high,{startBar:2,endBar:2}).clefs,{right:'treble',left:'treble'});
  assert.deepEqual(chooseNotationClefs({...base,notes:[n('low',48,0,4)]}),{right:'bass',left:'bass'});
});
test('Czerny 599 reading studies retain original registers with two treble clefs',async()=>{
  const {REPERTOIRE}=await import('../public/repertoire.mjs');
  const studies=REPERTOIRE.filter(score=>score.id.startsWith('czerny-599-'));
  assert(studies.length>=2);
  for(const score of studies) assert.deepEqual(buildNotationBars(score).clefs,{right:'treble',left:'treble'});
});
