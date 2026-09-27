import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createApp} from '../server.mjs';
test('recordings support browser byte-range seeking and HEAD metadata',async()=>{
 const app=createApp({apiKey:''});await new Promise(r=>app.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${app.address().port}/audio/demos/clementi-op36-no1-luis-kolodin.m4a`,file=await readFile(new URL('../public/audio/demos/clementi-op36-no1-luis-kolodin.m4a',import.meta.url));
 try{
  const head=await fetch(url,{method:'HEAD'});assert.equal(head.headers.get('content-type'),'audio/mp4');assert.equal(Number(head.headers.get('content-length')),file.length);
  for(const [range,start,end]of [['bytes=100-199',100,199],['bytes=-20',file.length-20,file.length-1],['bytes=3694300-',3694300,file.length-1]]){
   const r=await fetch(url,{headers:{Range:range}});assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),`bytes ${start}-${end}/${file.length}`);assert.deepEqual(Buffer.from(await r.arrayBuffer()),file.subarray(start,end+1));
  }
  assert.equal((await fetch(url,{headers:{Range:'bytes=99999999-'}})).status,416);
 }finally{await new Promise(r=>app.close(r));}
});
