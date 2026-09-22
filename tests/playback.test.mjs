import test from 'node:test';
import assert from 'node:assert/strict';
import {PlaybackTransport} from '../public/playback.mjs';
function fixture(){
 let time=0,serial=0;const jobs=new Map(),starts=[],ends=[],frames=[],states=[],active=new Set();
 const clock={now:()=>time,setTimer:(fn,ms)=>{const id=++serial;jobs.set(id,{at:time+ms,fn});return id;},clearTimer:id=>jobs.delete(id)};
 const advance=ms=>{const target=time+ms;while(true){const next=[...jobs].filter(([,j])=>j.at<=target).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!next)break;time=next[1].at;jobs.delete(next[0]);next[1].fn();}time=target;};
 const player=new PlaybackTransport({...clock,requestFrame:fn=>clock.setTimer(fn,16),cancelFrame:clock.clearTimer,onNote:(n,duration,offset)=>{starts.push({id:n.id,at:time,duration,offset});active.add(n.id);},onNoteEnd:n=>{ends.push(n.id);active.delete(n.id);},onProgress:p=>frames.push(p),onState:s=>states.push(s),silence:()=>active.clear()});
 return {player,advance,starts,ends,frames,states,active,jobs};
}
const notes=[{id:'held',pitch:60,time:0,duration:2},{id:'second',pitch:64,time:2,duration:1},{id:'last',pitch:67,time:3,duration:1}];
test('pause and resume retain the held and upcoming notes original velocity',()=>{
 const f=fixture(),heard=[];f.player.onNote=(note,duration,offset)=>heard.push([note.velocity,duration,offset]);
 f.player.play([{...notes[0],velocity:35},{...notes[1],velocity:115}],3);f.advance(500);f.player.pause();f.advance(4000);f.player.resume();f.advance(1500);
 assert.deepEqual(heard,[[35,2,0],[35,1.5,.5],[115,1,0]]);
});
test('pause cancels sound and future notes, freezes time, then continues held and upcoming notes',()=>{
 const f=fixture();f.player.play(notes,4);f.advance(750);f.player.pause();assert.equal(f.player.state,'paused');assert.equal(f.player.position,.75);assert.equal(f.active.size,0);assert.equal(f.jobs.size,0);const frames=f.frames.length;
 f.advance(30000);assert.equal(f.player.position,.75);assert.equal(f.frames.length,frames);assert.equal(f.starts.length,1);
 f.player.resume();f.advance(0);assert.deepEqual(f.starts.at(-1),{id:'held',at:30750,duration:1.25,offset:.75});f.advance(1250);assert.equal(f.starts.at(-1).id,'second');assert.equal(f.player.position,2);assert.deepEqual(f.ends,['held']);
});
test('repeated pause/resume does not accumulate wall time or duplicate a completed onset',()=>{
 const f=fixture();f.player.play(notes,4);f.advance(2000);f.player.pause();f.advance(9000);f.player.resume();f.advance(200);f.player.pause();f.advance(6000);f.player.resume();f.advance(800);
 assert.equal(f.player.position,3);assert.equal(f.starts.filter(n=>n.id==='held').length,1);assert.equal(f.starts.filter(n=>n.id==='last').length,1);assert(Math.abs(f.starts.at(-2).offset-.2)<1e-9);
});
test('pause in a rest retains silence until the remaining rest ends',()=>{
 const f=fixture();f.player.play([{id:'after-rest',pitch:60,time:2,duration:1}],3);f.advance(1000);f.player.pause();f.advance(5000);f.player.resume();f.advance(999);assert.equal(f.starts.length,0);f.advance(1);assert.equal(f.starts[0].id,'after-rest');
});
test('stop from paused state clears the session and playing again starts from zero',()=>{
 const f=fixture();f.player.play(notes,4);f.advance(600);f.player.pause();f.player.stop();f.player.resume();f.advance(10000);assert.equal(f.starts.length,1);assert.equal(f.player.state,'idle');assert.equal(f.player.position,0);
 f.player.play(notes,4);f.advance(0);assert.equal(f.starts.at(-1).offset,0);assert.equal(f.player.position,0);
});
test('replacing a playing session cancels all callbacks from the old score',()=>{
 const f=fixture();f.player.play(notes,4);f.advance(1000);f.player.play([{id:'new',pitch:70,time:0,duration:.5}],.5);f.advance(5000);assert.deepEqual(f.starts.map(n=>n.id),['held','new']);assert.equal(f.player.state,'idle');assert.equal(f.jobs.size,0);assert.equal(f.active.size,0);
});
test('natural completion resets controls, while pausing at the end does not create an empty resume',()=>{
 const f=fixture();f.player.play(notes,4);f.advance(4150);assert.equal(f.player.state,'idle');assert.equal(f.jobs.size,0);assert.equal(f.active.size,0);
 f.player.play(notes,4);f.advance(4000);f.player.pause();assert.equal(f.player.state,'idle');assert.equal(f.jobs.size,0);
});
test('chord members and notes crossing a selected-range boundary resume only for their remaining duration',()=>{
 const f=fixture();f.player.play([{id:'r',pitch:64,time:0,duration:4},{id:'l',pitch:48,time:0,duration:3}],2);f.advance(500);f.player.pause();f.advance(900);f.player.resume();f.advance(0);assert.deepEqual(f.starts.slice(-2).map(n=>[n.id,n.duration,n.offset]),[['r',1.5,.5],['l',1.5,.5]]);f.advance(1650);assert.equal(f.player.state,'idle');
});
