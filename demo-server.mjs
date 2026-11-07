import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
http.createServer(async(req,res)=>{
 try {
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!target.startsWith(root)){res.writeHead(403);res.end();return;}
  const data=await readFile(target);
  res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(4173,'127.0.0.1',()=>console.log('SCI One demo: http://127.0.0.1:4173 — press Ctrl+C to stop'));
