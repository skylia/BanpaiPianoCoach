// All adapters emit {type, pitch, velocity, at}. Future audio/mobile adapters share this contract.
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
export class PianoSound{
 constructor(){this.context=null;this.voices=new Set();}
 async ready(){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;this.context??=new Audio();if(this.context.state==='suspended')await this.context.resume();}
 tone(pitch,duration=.4,volume=.16){if(!this.context)return;const c=this.context,t=c.currentTime,osc=c.createOscillator(),gain=c.createGain();osc.type='triangle';osc.frequency.value=440*Math.pow(2,(pitch-69)/12);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.009);gain.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.08,duration));osc.connect(gain).connect(c.destination);osc.start();osc.stop(t+Math.max(.08,duration)+.03);this.voices.add(osc);osc.onended=()=>{this.voices.delete(osc);gain.disconnect();};}
 click(accent=false){this.tone(accent?91:84,.045,.06);}
 stop(){for(const o of this.voices){try{o.stop();}catch{}}this.voices.clear();}
}
