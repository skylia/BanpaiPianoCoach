// All adapters emit {type, pitch, velocity, at}. Future audio/mobile adapters share this contract.
import {velocityVolume,EVEN_PLAYBACK_VOLUME} from './expression.mjs';
export class MidiInput{
 constructor(onEvent,onState){this.onEvent=onEvent;this.onState=onState;this.access=null;this.selected=null;this.selectionVersion=0;}
 async connect(){
  if(!window.isSecureContext)throw new Error('请通过 HTTPS 地址打开练习室，才能连接琴键。');
  if(!navigator.requestMIDIAccess)throw new Error('当前浏览器不支持连接琴键。请使用电脑版 Chrome 或 Edge，也可以先试用屏幕琴键。');
  try{this.access=await navigator.requestMIDIAccess({sysex:false});}catch(e){throw new Error(e.name==='NotAllowedError'||e.name==='SecurityError'?'连接权限未开启。请在浏览器地址栏的网站权限中允许音乐设备访问，再重试。':'暂时无法连接琴键，请检查数据线、设备驱动并重试。');}
  this.access.onstatechange=()=>this.refresh();this.refresh();
 }
 refresh(){const devices=[...this.access.inputs.values()].filter(d=>d.state==='connected');const lost=this.selected&&!devices.some(d=>d.id===this.selected);if(lost)this.selected=null;this.onState({devices,lost,selected:this.selected});}
 async select(id){
  const version=++this.selectionVersion,access=this.access,d=access?.inputs.get(id);
  if(!d||d.state!=='connected')throw new Error('这台琴已断开，请重新连接。');
  const cancelled=()=>version!==this.selectionVersion||access!==this.access;
  // Keep the working input until its replacement has opened successfully.
  try{await d.open();}catch(error){if(cancelled())return null;throw error;}
  if(cancelled())return null;
  if(d.state!=='connected')throw new Error('这台琴已断开，请重新连接。');
  for(const device of access.inputs.values())device.onmidimessage=null;
  this.selected=id;
  d.onmidimessage=e=>{const [status,pitch,velocity=0]=e.data;if(status===undefined||pitch===undefined)return;const command=status&0xf0;if(command===0x90||command===0x80)this.onEvent({type:command===0x90&&velocity>0?'on':'off',pitch,velocity,at:performance.now()});};
  return d.name||'已连接的琴键';
 }
 detach(){this.selectionVersion++;if(this.access)for(const d of this.access.inputs.values())d.onmidimessage=null;this.selected=null;}
}
export class PianoSound {
 constructor(){this.context=null;this.voices=new Set();this.buffers=new Map();this.held=new Map();this.loading=null;this.timbre='grand';this.samples=Array.from({length:30},(_,i)=>21+i*3).concat(108).filter((p,i,a)=>a.indexOf(p)===i&&p<=108);}
 async ready(){
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  if(!this.context){this.context=new Audio();this.connectOutput();}
  if(this.context.state==='suspended')await this.context.resume();
  if(this.buffers.size===this.samples.length)return;
  this.loading??=Promise.all(this.samples.map(async pitch=>{if(this.buffers.has(pitch))return;const names=['C','Cs','D','Ds','E','F','Fs','G','Gs','A','As','B'];const name=names[pitch%12]+(Math.floor(pitch/12)-1);const res=await fetch(new URL(`./audio/salamander/${name}.mp3`,import.meta.url));if(!res.ok)throw Error('钢琴采样加载失败');this.buffers.set(pitch,await this.context.decodeAudioData(await res.arrayBuffer()));})).finally(()=>{this.loading=null;});
  await this.loading;
 }
 connectOutput(){this.filter=this.context.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=this.timbre==='warm'?4500:16000;this.master=this.context.createDynamicsCompressor();this.filter.connect(this.master).connect(this.context.destination);}
 setTimbre(value){this.timbre=['grand','warm','simple'].includes(value)?value:'grand';if(this.filter)this.filter.frequency.value=this.timbre==='warm'?4500:16000;}
 playNote(note,duration=note.duration,offset=0,{dynamics=true}={}){return this.tone(note.pitch,duration,dynamics?velocityVolume(note.velocity):EVEN_PLAYBACK_VOLUME,offset);}
 tone(pitch,duration=.4,volume=.16,offset=0){
  if(!this.context)return;const c=this.context,t=c.currentTime,gain=c.createGain();let source;
  if(this.timbre!=='simple'&&this.buffers.size){const anchor=[...this.buffers.keys()].reduce((a,b)=>Math.abs(b-pitch)<Math.abs(a-pitch)?b:a);source=c.createBufferSource();source.buffer=this.buffers.get(anchor);source.playbackRate.value=2**((pitch-anchor)/12);}
  else{source=c.createOscillator();source.type='triangle';source.frequency.value=440*2**((pitch-69)/12);}
  const level=Math.max(.0001,Math.min(.55,volume*(source.buffer?3:1)));gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(level,t+.006);
  if(source.buffer){gain.gain.setValueAtTime(level,t+Math.max(.03,duration));gain.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.03,duration)+.3);}
  else gain.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.08,duration));
  source.connect(gain).connect(this.filter);const voice={source,gain,level,release:()=>{const now=c.currentTime;gain.gain.cancelAndHoldAtTime(now);gain.gain.exponentialRampToValueAtTime(.0001,now+.18);try{source.stop(now+.2);}catch{}}};
  if(this.voices.size>=64){const oldest=this.voices.values().next().value;try{oldest.source.stop();}catch{}this.voices.delete(oldest);}
  this.voices.add(voice);source.onended=()=>{this.voices.delete(voice);gain.disconnect();source.disconnect();};if(source.buffer)source.start(t,Math.min(source.buffer.duration,Math.max(0,offset)*source.playbackRate.value));else source.start(t);source.stop(t+Math.max(.08,duration)+.35);return voice;
 }
 keyOn(pitch,volume){this.keyOff(pitch);const voice=this.tone(pitch,12,volume);if(voice)this.held.set(pitch,voice);}
 keyOff(pitch){this.held.get(pitch)?.release();this.held.delete(pitch);}
 click(accent=false){if(!this.context)return;const c=this.context,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.frequency.value=accent?1300:950;g.gain.setValueAtTime(.055,t);g.gain.exponentialRampToValueAtTime(.0001,t+.035);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.04);o.onended=()=>{o.disconnect();g.disconnect();};}
 stop(){for(const v of this.voices){try{v.source.stop();}catch{}}this.voices.clear();this.held.clear();}
}
