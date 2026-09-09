const clean=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export const slugify=value=>clean(value).replace(/\s+/g,'-');
const WORDS={mercador:['merchant','trader','shopkeeper','vendor'],ferreiro:['blacksmith','smith','armorer'],mago:['mage','wizard','caster','sorcerer'],guerreiro:['warrior','fighter','soldier'],cacador:['hunter','ranger'],sacerdote:['priest','cleric'],nobre:['noble','lord','lady'],marinheiro:['sailor','captain','mariner','pirate'],alquimista:['alchemist','apothecary']};
export function parseTokenName(input){
 const path=typeof input==='string'?input:input?.p??'',name=path.split('/').at(-1)?.replace(/\.[^.]+$/,'')??'',keywords=clean(name).split(/\s+/).filter(word=>word&&!/^\d+$/.test(word));
 return {path,name,slug:slugify(name),keywords:[...new Set(keywords)]};
}
export function imageKeywords(doc){
 const raw=[doc?.name,doc?.type,doc?.creatureType,doc?.role,doc?.system?.details?.description,doc?.system?.biography,doc?.system?.details?.type].join(' '),base=clean(raw).split(/\s+/).filter(word=>word.length>2),expanded=[];
 for(const word of base){expanded.push(word,...(WORDS[word]??[]));}
 return [...new Set(expanded)];
}
const hash=value=>{let n=2166136261;for(const c of String(value)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;};
const typeKey=value=>clean(value).replace(/ /g,'-');
export function pickToken(keywords,index,{type='',humanoid=null,seed='quedaco'}={}){
 const wanted=new Set((Array.isArray(keywords)?keywords:imageKeywords(keywords)).map(clean)),tokens=Array.isArray(index)?index:index?.tokens??[],kind=typeKey(type);
 let pool=tokens.filter(token=>humanoid==null||Boolean(token.h)===Boolean(humanoid));
 if(kind){const exact=pool.filter(token=>typeKey(token.t)===kind);if(exact.length)pool=exact;else if(humanoid===false)return null;}
 const ranked=pool.map(token=>{const words=new Set([...(token.k??[]),token.r,token.s].map(clean).filter(Boolean)),score=[...wanted].reduce((sum,word)=>sum+(words.has(word)?4:0),0)+(token.n?-1:0);return {token,score,tie:hash(`${seed}|${token.p}`)};}).sort((a,b)=>b.score-a.score||a.tie-b.tie||String(a.token.p).localeCompare(String(b.token.p)));
 return ranked[0]?.token??null;
}
