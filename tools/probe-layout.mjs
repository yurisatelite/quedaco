// Sonda: lista os elementos que passam da borda direita do <main> numa área/variante/largura.
// Uso: node tools/probe-layout.mjs <area> <variante|-> <largura> [altura]
import {chromium} from 'playwright-core';
import {createVisualServer} from './visual-server.mjs';
const [area='npcs',variantArg='-',w='900',h='700']=process.argv.slice(2);const variant=variantArg==='-'?'':variantArg;
const executable=process.env.QUEDACO_BROWSER_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe';
const {server,url}=await createVisualServer();let browser;
try{
 browser=await chromium.launch({executablePath:executable,headless:true});
 const page=await browser.newPage({viewport:{width:+w,height:+h}});
 await page.goto(url);await page.waitForSelector('html[data-ready="true"]',{state:'attached'});
 await page.evaluate(([a,v])=>preview.render(a,v),[area,variant]);
 const out=await page.evaluate(()=>{
  const main=document.querySelector('.sy-shell > main');const mr=main.getBoundingClientRect();const lim=mr.left+main.clientWidth;
  const path=el=>{const p=[];for(let e=el;e&&e!==main;e=e.parentElement)p.unshift(e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).join('.'):''));return p.slice(-4).join(' > ');};
  return {scrollW:main.scrollWidth,clientW:main.clientWidth,items:[...main.querySelectorAll('*')].filter(e=>e.getClientRects().length).map(e=>({e,b:e.getBoundingClientRect()})).filter(({b})=>b.width>0&&b.right>lim+1).filter(({e})=>![...main.querySelectorAll('*')].some(()=>false)).slice(0,40).map(({e,b})=>({path:path(e),right:Math.round(b.right-lim),w:Math.round(b.width),text:(e.textContent||'').trim().slice(0,30)}))};
 });
 console.log(JSON.stringify(out,null,1));
 await page.screenshot({path:`.local/visual-review/probe-${area}-${variant||'default'}-${w}.png`,fullPage:false});
}finally{await browser?.close();await new Promise(r=>server.close(r));}
