// A separate localhost origin with a mock provider; no real API call or credential.
import {readFileSync} from 'node:fs';
import {createApp} from '../server.mjs';
const app=createApp({apiKey:'qa-placeholder',fetchImpl:async(_url,init)=>{
 const facts=JSON.parse(JSON.parse(init.body).messages[1].content);
 await new Promise(r=>setTimeout(r,3000));
 return {ok:true,json:async()=>({choices:[{message:{content:`模拟报告：近 ${facts.period.days} 天补记了 ${facts.current.manualMinutes} 分钟。补记没有音符准确率，不能推断技术进步。`},finish_reason:'stop'}]})};
}});
const serve=app.listeners('request')[0];app.removeAllListeners('request');
const fixtures={'/coach-qa-local.html':'coach-browser.html','/qa-local.html':'browser-qa.html','/dynamics-qa-local.html':'dynamics-browser.html'};
app.on('request',(req,res)=>{const fixture=fixtures[req.url];if(fixture){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(readFileSync(new URL('../tests/'+fixture,import.meta.url)));}else serve(req,res);});
app.listen(3001,'127.0.0.1',()=>console.log('QA only: http://localhost:3001/coach-qa-local.html and /qa-local.html'));
