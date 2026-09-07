import {normalize} from './rules.mjs';

const array=value=>value==null?[]:Array.from(value instanceof Set&&value.toObject?value.toObject():value);
const rootTypes=['legacy','curse','background','class'];

async function entriesFromUuids(catalog,uuids) {
  const entries=[];
  for (const uuid of uuids) {
    const item=catalog.items.find(entry=>entry.uuid===uuid);
    if (item) entries.push(item);
  }
  return entries;
}

export async function buildLevelOnePlan(catalog,selections={}) {
  const rootEntries=rootTypes.map(type=>catalog.items.find(item=>item.uuid===selections[type])).filter(Boolean);
  const roots=[];const included=[];const includedByUuid=new Map();const groups=new Map();const queue=[];
  for (const entry of rootEntries) {
    const document=await catalog.document(entry.uuid);
    roots.push({entry,document});queue.push({document,level:entry.type==='class'?1:0});
  }
  const curse=roots.find(root=>root.entry.type==='curse')?.document;
  while(queue.length) {
    const {document,level}=queue.shift();
    const benefits=array(document.system?.benefits).filter(benefit=>level==null||Number(benefit.level??0)===level);
    for (const benefit of benefits) {
      if (benefit.uuid) {
        if (benefit.type==='heritage'&&benefit.uuid!==selections.heritage) continue;
        if (includedByUuid.has(benefit.uuid)) continue;
        const entry=catalog.items.find(item=>item.uuid===benefit.uuid);
        if (!entry) throw Error(`Benefício inacessível no catálogo: ${benefit.uuid}`);
        const child=await catalog.document(benefit.uuid);
        const node={entry,document:child,originId:benefit._id,parentUuid:document.uuid};
        included.push(node);includedByUuid.set(benefit.uuid,node);queue.push({document:child,level:0});
        continue;
      }
      if (benefit.type!=='grant') continue;
      const key=`${document.uuid}|${benefit.granting}|${benefit.query??''}`;
      const group=groups.get(key)??{id:key,title:document.name,owner:document,granting:benefit.granting,query:benefit.query??'',originIds:[],options:[]};
      group.originIds.push(benefit._id);groups.set(key,group);
    }
  }
  for (const group of groups.values()) {
    let uuids=[];
    if (group.granting==='feat') {
      uuids.push(...array(group.owner.system?.feats));
      if (group.owner.type==='legacy'&&curse) uuids.push(...array(curse.system?.feats));
    } else if (group.granting==='path') {
      uuids.push(...catalog.list('path').map(item=>item.uuid));
    } else if (group.granting==='spell') {
      const spells=catalog.list('spell');
      for (const spell of spells) {
        const document=await catalog.document(spell.uuid);
        if (normalize(group.owner.name)==='conexao superficial'&&!array(document.system?.descriptors).includes('cantrip')) continue;
        uuids.push(spell.uuid);
      }
    }
    group.options=await entriesFromUuids(catalog,[...new Set(uuids)]);
    group.count=group.originIds.length;
  }
  return {roots,included,groups:[...groups.values()]};
}

const prowessByStyle={
  'combate com escudo':'facanha com escudo','combate com arma pesada':'facanha com arma pesada',
  'combate com arma a distancia':'facanha com arma a distancia','combate com duas armas':'facanha de duas armas',
  'combate desarmado':'facanha desarmada','combate montado':'facanha montada','combate com uma arma':'facanha com uma arma'
};

export function validateBenefitChoices(plan,choices={}) {
  const errors=[];
  for (const group of plan.groups) {
    const selected=array(choices[group.id]).filter(Boolean);
    if (selected.length!==group.count) errors.push(`${group.title}: escolha ${group.count===1?'uma opção':`${group.count} opções`}.`);
    if (new Set(selected).size!==selected.length) errors.push(`${group.title}: não repita a mesma opção.`);
    const allowed=new Set(group.options.map(option=>option.uuid));
    if (selected.some(uuid=>!allowed.has(uuid))) errors.push(`${group.title}: existe uma opção inválida ou indisponível.`);
  }
  const style=plan.groups.find(group=>group.query==='fighting-style');
  const prowess=plan.groups.find(group=>group.query==='combat-prowess'&&normalize(group.title)==='facanhas de combate');
  if (style&&prowess) {
    const styleName=style.options.find(option=>option.uuid===array(choices[style.id])[0])?.name;
    const prowessName=prowess.options.find(option=>option.uuid===array(choices[prowess.id])[0])?.name;
    const expected=prowessByStyle[normalize(styleName)];
    if (expected&&normalize(prowessName)!==expected) errors.push(`Façanhas de combate: escolha “${prowess.options.find(option=>normalize(option.name)===expected)?.name??expected}”, correspondente ao estilo selecionado.`);
  }
  return errors;
}

export function resolvedPlanItems(plan,choices={}) {
  const selected=[];
  for (const group of plan.groups) array(choices[group.id]).forEach((uuid,index)=>{
    if (!uuid) return;
    const entry=group.options.find(option=>option.uuid===uuid);
    if (entry) selected.push({entry,originId:group.originIds[index]??group.originIds[0],parentUuid:group.owner.uuid});
  });
  return [...plan.roots.map(root=>({entry:root.entry,document:root.document,originId:null,parentUuid:null})),...plan.included,...selected];
}
