const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),port=Number(process.env.PORT||43891);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8','.json':'application/json; charset=utf-8'};
const server=http.createServer((req,res)=>{let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end('Bad request');return;}
  if(pathname.endsWith('/'))pathname+='index.html';
  const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)||pathname.includes('\0')){res.writeHead(403);res.end('Forbidden');return;}
  fs.readFile(file,(err,body)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);});
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/`));
server.on('error',err=>{console.error(err.message);process.exitCode=1;});
