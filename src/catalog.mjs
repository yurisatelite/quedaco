import { auditCatalog } from './coverage.mjs';
export const ITEM_TYPES = ['legacy','heritage','curse','background','class','path','feature','feat','ability','spell','weapon','armor','clothing','equipment','consumable','loot','sigil','seal'];
/** Never infer permissions or silently discard a failed compendium. */
export class Catalog {
  constructor(game) { this.game=game; this.items=[]; this.failures=[]; this.packs=[]; this.documents=new Map(); }
  async load() {
    this.items=[];this.failures=[];this.packs=[];this.documents.clear();
    for (const pack of this.game.packs) {
      if (pack.documentName !== 'Item') continue;
      if (pack.metadata?.system && pack.metadata.system !== 'skyfall') continue;
      if (pack.visible === false) { this.failures.push({pack:pack.collection,reason:'Compêndio sem permissão de leitura.'});continue; }
      try {
        const index = await pack.getIndex({fields:['type','img','system.identifier','system.price','system.quantity','system.capacity','system.category','system.purpose','system.type','system.descriptors']});
        this.packs.push({id:pack.collection,label:pack.metadata.label,count:index.size??index.length});
        for (const entry of index) if (ITEM_TYPES.includes(entry.type)) this.items.push({...entry,uuid:entry.uuid??`Compendium.${pack.collection}.Item.${entry._id}`,source:pack.metadata.label});
      } catch(error) { this.failures.push({pack:pack.collection,reason:error.message}); }
    }
    for (const doc of this.game.items) if (doc.visible !== false && ITEM_TYPES.includes(doc.type)) this.items.push({name:doc.name,type:doc.type,img:doc.img,uuid:doc.uuid,source:'Mundo',system:{identifier:doc.system.identifier,price:doc.system.price,quantity:doc.system.quantity,capacity:doc.system.capacity,category:doc.system.category,purpose:doc.system.purpose,type:doc.system.type,descriptors:doc.system.descriptors}});
    this.items.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')||a.uuid.localeCompare(b.uuid));
    this.audit=auditCatalog(this.items);
    return this;
  }
  list(type, query='') {return this.items.filter(i=>(!type||i.type===type)&&i.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));}
  async document(uuid) {
    if (!this.items.some(i=>i.uuid===uuid)) throw Error('O documento não pertence ao catálogo acessível desta mesa.');
    if (!this.documents.has(uuid)) {
      const doc=await fromUuid(uuid);
      if (!doc || doc.visible === false) throw Error('O documento não pôde ser lido. Confira as permissões do compêndio.');
      this.documents.set(uuid,doc);
    }
    return this.documents.get(uuid);
  }
  async benefits(uuid, {type, level=0}={}) {
    const document=await this.document(uuid);
    const benefits=Array.from(document.system?.benefits??[]);
    return benefits.filter(benefit=>(!type||benefit.type===type)&&(level==null||Number(benefit.level??0)===Number(level)));
  }
  async linkedItems(uuid, options={}) {
    const benefits=await this.benefits(uuid,options);
    const linked=[];
    for (const benefit of benefits) {
      if (!benefit.uuid) continue;
      const item=this.items.find(entry=>entry.uuid===benefit.uuid);
      if (item) linked.push(item);
      else this.failures.push({pack:uuid,reason:`Benefício aponta para documento inacessível: ${benefit.uuid}`});
    }
    return linked;
  }
  async auditBenefits(types=['legacy','heritage','curse','background','class','path']) {
    const identities=this.items.filter(item=>types.includes(item.type));
    const referencedHeritages=new Set();
    const missing=[];
    let benefits=0;
    for (const identity of identities) {
      const document=await this.document(identity.uuid);
      for (const benefit of Array.from(document.system?.benefits??[])) {
        benefits+=1;
        if (benefit.type==='heritage'&&benefit.uuid) referencedHeritages.add(benefit.uuid);
        if (benefit.uuid&&!this.items.some(item=>item.uuid===benefit.uuid)) missing.push({source:identity.name,type:benefit.type,uuid:benefit.uuid});
      }
    }
    const unlinkedHeritages=this.items.filter(item=>item.type==='heritage'&&!referencedHeritages.has(item.uuid)).map(item=>({name:item.name,uuid:item.uuid}));
    return {identities:identities.length,benefits,missing,unlinkedHeritages};
  }
  report() {return {foundry:this.game.version,system:{id:this.game.system.id,version:this.game.system.version},packs:this.packs,failures:this.failures,...this.audit};}
}
