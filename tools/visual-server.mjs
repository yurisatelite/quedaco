import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export async function createVisualServer(){
 const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
 const server=http.createServer(async(req,res)=>{try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>QUEDAÇO — prévia de layout</title><link rel="stylesheet" href="/styles/creator.css"><link rel="stylesheet" href="/styles/library.css"><style>body{margin:0;background:#090d13}button,input,select{font:inherit}button{width:100%;cursor:pointer}button,input,select,textarea{box-sizing:border-box}.application{display:flex;flex-direction:column;position:absolute;inset:8px;width:calc(100% - 16px);height:calc(100% - 16px);border:1px solid #35485b}.window-header{display:flex;align-items:center;flex:0 0 32px}.window-header h1{font:14px system-ui;margin:0}.window-content{display:flex;flex-direction:column;flex:1;min-height:0}</style><section class="application sy-creator"><header class="window-header"><h1>QUEDAÇO — prévia com dados falsos</h1></header><div class="window-content"></div></section><script type="module" src="/tools/visual-fixture.mjs"></script></html>`);return;}
  if(!/^\/(src|styles|assets|tools)\//.test(pathname))throw Error('Denied');
  const file=path.resolve(root,'.'+decodeURIComponent(pathname));if(!file.startsWith(root+path.sep))throw Error('Denied');
  res.setHeader('Content-Type',({'.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.woff2':'font/woff2'})[path.extname(file)]??'application/octet-stream');res.end(await fs.readFile(file));
 }catch{res.statusCode=404;res.end('Not found');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {server,url:`http://127.0.0.1:${server.address().port}`};
}
