import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {join,dirname,basename} from 'node:path';
import {imageKeywords,pickToken,slugify} from '../src/tokens.mjs';
const index=JSON.parse(readFileSync('.local/tokens-skyfall-index.json','utf8')),input=JSON.parse(readFileSync('.local/fichas-para-casar.json','utf8')),out='.local/tokens-escolhidos',report=[];mkdirSync(out,{recursive:true});
for(const doc of Array.isArray(input)?input:input.documents??[]){const monster=doc.type==='npc',token=pickToken(imageKeywords(doc),index,{type:doc.creatureType,humanoid:monster?false:true,seed:doc.uuid??doc.name});if(!token){report.push({...doc,status:'sem candidato'});continue;}const target=join(out,`${slugify(doc.name)}.png`);mkdirSync(dirname(target),{recursive:true});copyFileSync(join(index.root,token.p),target);report.push({name:doc.name,uuid:doc.uuid,token:token.p,output:basename(target)});}
writeFileSync(join(out,'RELATORIO.json'),JSON.stringify(report,null,2));console.log(`Selecionados ${report.filter(item=>item.token).length} de ${report.length}. Veja ${out}/RELATORIO.json`);
