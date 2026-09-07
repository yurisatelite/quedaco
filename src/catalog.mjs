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
        const index = await pack.getIndex({fields:['type','img','system.identifier']});
        this.packs.push({id:pack.collection,label:pack.metadata.label,count:index.size??index.length});
        for (const entry of index) if (ITEM_TYPES.includes(entry.type)) this.items.push({...entry,uuid:entry.uuid??`Compendium.${pack.collection}.Item.${entry._id}`,source:pack.metadata.label});
      } catch(error) { this.failures.push({pack:pack.collection,reason:error.message}); }
    }
    for (const doc of this.game.items) if (doc.visible !== false && ITEM_TYPES.includes(doc.type)) this.items.push({name:doc.name,type:doc.type,img:doc.img,uuid:doc.uuid,source:'Mundo',system:{identifier:doc.system.identifier}});
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
  report() {return {foundry:this.game.version,system:{id:this.game.system.id,version:this.game.system.version},packs:this.packs,failures:this.failures,...this.audit};}
}
