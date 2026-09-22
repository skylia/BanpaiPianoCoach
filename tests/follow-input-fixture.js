// Loaded only by the isolated QA server, never by the production application.
const device={id:'qa-follow-piano',name:'QA Piano',state:'connected',open:async()=>{},onmidimessage:null};
const access={inputs:new Map([[device.id,device]]),onstatechange:null};
Object.defineProperty(navigator,'requestMIDIAccess',{configurable:true,value:async()=>access});
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.data?.banpaiFollowQA!==true)return;
 if(event.data.disconnect){device.state='disconnected';access.onstatechange?.();return;}
 const {pitch,velocity=88,off=false}=event.data;
 device.onmidimessage?.({data:new Uint8Array([off?0x80:0x90,pitch,velocity]),timeStamp:performance.now()});
});
