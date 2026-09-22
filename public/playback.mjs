/** Playback time excludes pauses; recording uses its own uninterrupted clock. */
export class PlaybackTransport {
  constructor({onNote=()=>{},onNoteEnd=()=>{},onProgress=()=>{},onState=()=>{},silence=()=>{},now=()=>performance.now(),setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id),requestFrame=fn=>requestAnimationFrame(fn),cancelFrame=id=>cancelAnimationFrame(id)}={}) {
    Object.assign(this,{onNote,onNoteEnd,onProgress,onState,silence,now,setTimer,clearTimer,requestFrame,cancelFrame});
    this.state='idle';this.offset=0;this.duration=0;this.notes=[];this.timers=new Set();this.frame=null;this.generation=0;
  }
  get position(){return Math.min(this.duration,this.offset+(this.state==='playing'?(this.now()-this.started)/1000:0));}
  play(notes,duration){
    this.stop();
    this.notes=notes.map(n=>({...n})).sort((a,b)=>a.time-b.time);
    this.duration=duration;
    if(duration>0){this.state='paused';this.resume();}
  }
  invalidate(){
    this.generation++;
    for(const id of this.timers)this.clearTimer(id);
    this.timers.clear();
    if(this.frame!==null)this.cancelFrame(this.frame);
    this.frame=null;this.silence();
  }
  schedule(fn,delay){
    const generation=this.generation;
    const id=this.setTimer(()=>{this.timers.delete(id);if(generation===this.generation&&this.state==='playing')fn();},Math.max(0,delay)*1000);
    this.timers.add(id);
  }
  pause(){
    if(this.state!=='playing')return;
    const position=this.position;
    if(position>=this.duration){this.stop();return;}
    this.offset=position;this.state='paused';this.invalidate();
    this.onProgress(position);this.onState(this.state);
  }
  resume(){
    if(this.state!=='paused')return;
    this.started=this.now();this.state='playing';const generation=++this.generation;
    for(const note of this.notes){
      const end=Math.min(this.duration,note.time+note.duration);
      if(end<=this.offset)continue;
      this.schedule(()=>{
        const position=this.position;
        if(end<=position)return;
        // A held note resumes at its sample offset, without replaying its attack.
        this.onNote(note,end-position,Math.max(0,position-note.time));
        this.schedule(()=>this.onNoteEnd(note),end-position);
      },note.time-this.offset);
    }
    const tick=()=>{if(generation!==this.generation||this.state!=='playing')return;this.onProgress(this.position);this.frame=this.requestFrame(tick);};
    tick();this.schedule(()=>this.stop(),this.duration-this.offset+.15);this.onState(this.state);
  }
  stop(){
    this.state='idle';this.offset=0;this.invalidate();this.notes=[];this.duration=0;this.onState(this.state);
  }
}
