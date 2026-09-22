import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('public'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.woff':'font/woff','.json':'application/json'};
createServer(async(req,res)=>{try{const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+'/')&&p!==root){res.writeHead(403).end();return;}const file=p===root?root+'/index.html':p;const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'text/plain','Cache-Control':'no-cache','Permissions-Policy':'midi=(self)'}).end(body);}catch{res.writeHead(404).end('Not found');}}).listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Banpai listening on port '+(process.env.PORT||3000)));
