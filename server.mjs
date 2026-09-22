import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {generateCoachReport} from './server/coach.mjs';
const project=fileURLToPath(new URL('.',import.meta.url));
export function createApp({apiKey=process.env.DEEPSEEK_API_KEY,model=process.env.DEEPSEEK_MODEL||'deepseek-flash',fetchImpl=fetch}={}) {
 const root=resolve(project,'public'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.woff':'font/woff','.json':'application/json','.mp3':'audio/mpeg','.txt':'text/plain; charset=utf-8'};let busy=false;
 return createServer(async(req,res)=>{
  const json=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}).end(JSON.stringify(value));};
  try {
   const host=req.headers.host||'',url=new URL(req.url,'http://'+host);
   if(url.pathname.startsWith('/api/')) {
    // Local proxy must not become a LAN or cross-site relay for the private key.
    if(!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))return json(403,{error:'AI 点评仅允许本机访问。'});
    if(req.headers.origin&&req.headers.origin!==url.origin)return json(403,{error:'不允许跨站请求。'});
    if(req.method==='GET'&&url.pathname==='/api/coach/status')return json(200,{configured:!!apiKey,model});
    if(req.method!=='POST'||url.pathname!=='/api/coach/report')return json(404,{error:'接口不存在。'});
    if(req.headers['content-type']?.split(';')[0]!=='application/json')return json(415,{error:'需要 JSON 摘要。'});
    if(busy)return json(429,{error:'已有报告正在生成，请等待完成。'});
    if(!apiKey)return json(503,{error:'请在项目根目录 .env 配置 DEEPSEEK_API_KEY，再重启 npm start。'});
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>65536)return json(413,{error:'摘要超过 64 KB。'});chunks.push(chunk);}
    let summary;try{summary=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return json(400,{error:'JSON 摘要无效。'});}
    busy=true;try {return json(200,await generateCoachReport(summary,{apiKey,model,fetchImpl}));}catch(error){return json(error.status||400,{error:error.message});}finally{busy=false;}
   }
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
   const p=resolve(root,'.'+decodeURIComponent(url.pathname));if(!p.startsWith(root+'/')&&p!==root){res.writeHead(403).end();return;}
   const file=p===root?root+'/index.html':p,body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','Permissions-Policy':'midi=(self)','X-Content-Type-Options':'nosniff'}).end(req.method==='HEAD'?undefined:body);
  }catch {if(!res.headersSent)res.writeHead(404).end('Not found');}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try {process.loadEnvFile(resolve(project,'.env'));}catch(error){if(error.code!=='ENOENT')throw error;}
 createApp().listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('Banpai: http://localhost:'+(process.env.PORT||3000)));
}
