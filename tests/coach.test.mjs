import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {buildCoachSummary,validateCoachSummary} from '../public/coach-model.mjs';
import {defaultLearning,normalizeActivity,ANALYSIS_VERSION} from '../public/progress-model.mjs';
import {generateCoachReport} from '../server/coach.mjs';
import {createApp} from '../server.mjs';
const today='2026-09-22',learning=defaultLearning();
const manual=(id,date=today)=>normalizeActivity({id,kind:'manual',title:'纸谱',date,seconds:1800,grade:10,category:'piece',note:'PRIVATE NOTE',updatedAt:today+'T12:00:00Z'});
const take=(id,patch={})=>normalizeActivity({id,kind:'capture',source:'midi',title:'旋律',date:today,startedAt:today+'T11:00:00Z',endedAt:today+'T11:01:00Z',seconds:60,complete:true,whole:true,bpm:80,hand:'right',startBar:1,endBar:4,fingerprint:'music-1',scoreId:'joy',expected:10,correct:8,paired:10,steady:9,extras:2,analysisVersion:ANALYSIS_VERSION,updatedAt:today+'T11:01:00Z',...patch});
const summary=()=>buildCoachSummary({activities:[manual('m'),take('take:a')],learning,days:7,today});
test('7/30-day reports exclude duplicates, future and demo data; previous window stays separate',()=>{
 const activities=[manual('m'),manual('m'),manual('before','2026-09-15'),manual('old','2026-08-24'),manual('future','2026-09-23'),{...take('demo'),source:'demo'}];
 const a=buildCoachSummary({activities,learning,today,days:7});assert.equal(a.current.minutes,30);assert.equal(a.previous.minutes,30);assert.equal(a.current.pitch,null);assert.equal(a.period.start,'2026-09-16');assert.equal(a.evidence.invalidRecords,1);
 const b=buildCoachSummary({activities,learning,today,days:30});assert.equal(b.current.minutes,90);assert.equal(b.period.start,'2026-08-24');assert(!JSON.stringify(b).includes('PRIVATE NOTE'));
 assert.throws(()=>buildCoachSummary({activities:[],learning,today}),/还没有/);
});
test('only same score, speed, hand and range are comparable; interrupted takes get no score',()=>{
 const s=buildCoachSummary({learning,today,activities:[take('a'),take('b',{bpm:90}),take('c',{hand:'left'}),take('d',{endBar:3}),take('e',{complete:false}),manual('m')]});
 assert.equal(s.pieces.length,4);const group=s.pieces.find(p=>p.bpm===80&&p.hand==='right'&&p.endBar===4);assert.equal(group.attempts,2);assert.equal(group.complete,1);assert.equal(group.first.pitch,67);assert.equal(s.current.pitch,67);
});
test('summary accepts grade 10 and preserves only bounded facts, not supplied prompts',()=>{
 const s=summary();s.targetGrade=10;s.messages=[{role:'system',content:'OVERRIDE'}];const facts=validateCoachSummary(s);assert.equal(facts.targetGrade,10);assert.equal(facts.messages,undefined);assert.throws(()=>validateCoachSummary({...s,pieces:Array(31).fill(s.pieces[0])}));assert.throws(()=>validateCoachSummary({...s,current:{...s.current,minutes:Infinity}}));
});
test('DeepSeek receives fixed instructions and summary; failures never expose a credential',async()=>{
 let sent;const report=await generateCoachReport(summary(),{apiKey:'secret-test-key',fetchImpl:async(url,init)=>{sent={url,...init};return {ok:true,json:async()=>({choices:[{message:{content:'依据记录，练习了 31 分钟。'},finish_reason:'stop'}]})};}});
 assert.equal(sent.url,'https://api.deepseek.com/chat/completions');const payload=JSON.parse(sent.body);assert.equal(payload.messages.length,2);assert.equal(payload.messages[1].role,'user');assert(!sent.body.includes('secret-test-key'));assert(!JSON.stringify(report).includes('secret-test-key'));assert.equal(report.period.days,7);
 for(const status of [401,402,429,500])await assert.rejects(generateCoachReport(summary(),{apiKey:'secret-test-key',fetchImpl:async()=>({ok:false,status})}),e=>!e.message.includes('secret-test-key')&&e.status===502);
 await assert.rejects(generateCoachReport(summary(),{apiKey:'x',fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:'partial'},finish_reason:'length'}]})})}),/不完整/);
});
test('local proxy enforces origin/key, supports split UTF-8 bodies, and does not serve .env',async()=>{
 let sent;const app=createApp({apiKey:'local-test-key',fetchImpl:async(_url,init)=>{sent=JSON.parse(init.body);return {ok:true,json:async()=>({choices:[{message:{content:'测试报告'},finish_reason:'stop'}]})};}});
 await new Promise(r=>app.listen(0,'127.0.0.1',r));const port=app.address().port,url=`http://127.0.0.1:${port}`;
 try {
  const status=await (await fetch(url+'/api/coach/status')).json();assert.deepEqual(status,{configured:true,model:'deepseek-flash'});
  assert.equal((await fetch(url+'/.env')).status,404);
  assert.equal((await fetch(url+'/api/coach/report',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify(summary())})).status,403);assert.equal(sent,undefined);
  const body=Buffer.from(JSON.stringify(summary())),split=body.indexOf(Buffer.from('旋律'))+1;
  const response=await new Promise((resolve,reject)=>{const req=request(url+'/api/coach/report',{method:'POST',headers:{'Content-Type':'application/json'}},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode,data:JSON.parse(text)}));});req.on('error',reject);req.write(body.subarray(0,split));setTimeout(()=>req.end(body.subarray(split)),5);});
  assert.equal(response.status,200);assert.equal(response.data.text,'测试报告');assert.equal(JSON.parse(sent.messages[1].content).pieces[0].title,'旋律');
 }finally{await new Promise(r=>app.close(r));}
 const unconfigured=createApp({apiKey:''});await new Promise(r=>unconfigured.listen(0,'127.0.0.1',r));try{const res=await fetch(`http://127.0.0.1:${unconfigured.address().port}/api/coach/report`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(res.status,503);}finally{await new Promise(r=>unconfigured.close(r));}
});

test('piano and screen practice remain distinct evidence even with identical score settings',()=>{
 const s=buildCoachSummary({learning,today,activities:[take('midi'),take('screen',{source:'virtual'}),take('partial',{complete:false})]});assert.equal(s.pieces.length,2);assert.equal(s.current.midiSessions,2);assert.equal(s.current.virtualSessions,1);assert.equal(s.current.incompleteSessions,1);
});
