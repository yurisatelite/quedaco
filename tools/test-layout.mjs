import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createVisualServer} from './visual-server.mjs';
const executable=process.env.QUEDACO_BROWSER_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe';
const output=path.resolve('.local/visual-review');await fs.mkdir(output,{recursive:true});
const {server,url}=await createVisualServer();let browser;
const reports=[];
try{
 browser=await chromium.launch({executablePath:executable,headless:true});
 const page=await browser.newPage();page.on('pageerror',error=>console.error('BROWSER',error.message));
 for(const [width,height] of [[1180,820],[760,640],[480,600],[360,480],[900,420]]){
  await page.setViewportSize({width,height});await page.goto(url);await page.waitForSelector('html[data-ready="true"]',{state:'attached'});
  for(const [area,variant] of [['npcs',''],['npcs','editor'],['guilds',''],['monsters',''],['items',''],['imbue',''],['quests',''],['modules',''],['map','list'],['map',''],['map','region']]){
   await page.evaluate(([a,v])=>preview.render(a,v),[area,variant]);
   const report=await page.evaluate(()=>{
    const shell=document.querySelector('.sy-shell'),body=shell.querySelector(':scope > main'),rect=shell.getBoundingClientRect();
    const visible=el=>el.getClientRects().length&&el.getBoundingClientRect().width>0;
    const overflow=[...shell.querySelectorAll('button,select,input,summary,h2,h3,.sy-library-grid,.sy-family-grid,.sy-npc-form')].filter(visible).filter(el=>!el.closest('.sy-puzzle-scroll,.sy-puzzle-board,.sy-area-nav,.sy-map-world,.sy-map-breadcrumb,.sy-shop-table')).filter(el=>{const b=el.getBoundingClientRect();return b.right>rect.right+2||b.left<rect.left-2;}).map(el=>({tag:el.tagName,classes:el.className,text:el.textContent.slice(0,65)}));
    const sticky=[...shell.querySelectorAll('main header,main nav')].filter(visible).filter(el=>getComputedStyle(el).position==='sticky').map(el=>el.className);
    return {overflow,sticky,bodyOverflow:body?body.scrollWidth>body.clientWidth+2:false,shellOverflow:shell.scrollWidth>shell.clientWidth+2};
   });
   reports.push({width,height,area,variant,...report});
   if(['npcs','modules','map'].includes(area))await page.screenshot({path:path.join(output,`${width}-${height}-${area}-${variant||'default'}.png`)});
  }
 }
 await fs.writeFile(path.join(output,'layout-report.json'),JSON.stringify(reports,null,2));
 const failures=reports.filter(r=>r.overflow.length||r.sticky.length||r.bodyOverflow||r.shellOverflow);
 console.log(JSON.stringify({cases:reports.length,failures:failures.length,details:failures.slice(0,8)},null,2));
 if(failures.length)process.exitCode=1;
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
