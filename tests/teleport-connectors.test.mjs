import test from 'node:test';
import assert from 'node:assert/strict';
import {auditTeleportEdge,providerAvailability} from '../src/teleport-connectors.mjs';
import {ensureNativeRegions,ensureStairways,setRuntimeProvider} from '../src/adapter.mjs';

let sequence=0;
const nextId=prefix=>`${prefix}${String(++sequence).padStart(15,'0')}`.slice(0,16);
const copy=value=>structuredClone(value);

class MockRegion {
  constructor(scene,data){
    Object.assign(this,copy(data));
    this.parent=scene;
    this.id=this._id=data._id??nextId('r');
    this._id=this.id;
    this.uuid=`Scene.${scene.id}.Region.${this.id}`;
    this.behaviors=[];
    for(const behavior of data.behaviors??[])this.behaviors.push(this.#behavior(behavior));
  }
  #behavior(data){
    const behavior={...copy(data),id:data._id??nextId('b')};
    behavior._id=behavior.id;
    return behavior;
  }
  async createEmbeddedDocuments(type,sources){
    assert.equal(type,'RegionBehavior');
    const created=sources.map(source=>this.#behavior(source));
    this.behaviors.push(...created);
    return created;
  }
  async updateEmbeddedDocuments(type,updates){
    assert.equal(type,'RegionBehavior');
    return updates.map(update=>{
      const behavior=this.behaviors.find(entry=>entry.id===update._id);
      if(!behavior)throw Error(`Behavior ausente: ${update._id}`);
      Object.assign(behavior,copy(update));
      return behavior;
    });
  }
}

class MockScene {
  constructor(id,{size=100,width=1200}={}){
    this.id=id;
    this.grid={size};
    this.width=width;
    this.stairways=[];
    this.regions=[];
    this.flags={stairways:{data:this.stairways}};
    this.calls=[];
  }
  async createEmbeddedDocuments(type,sources){
    this.calls.push(['create',type,copy(sources)]);
    if(type==='Stairway'){
      const created=sources.map(source=>({...copy(source),id:source._id??nextId('s'),_id:source._id??nextId('s')}));
      for(const document of created)document._id=document.id;
      this.stairways.push(...created);
      this.flags.stairways.data=this.stairways;
      return created;
    }
    if(type==='Region'){
      const created=sources.map(source=>new MockRegion(this,source));
      this.regions.push(...created);
      return created;
    }
    throw Error(`Tipo inesperado: ${type}`);
  }
  async updateEmbeddedDocuments(type,updates){
    this.calls.push(['update',type,copy(updates)]);
    const collection=type==='Stairway'?this.stairways:type==='Region'?this.regions:null;
    if(!collection)throw Error(`Tipo inesperado: ${type}`);
    return updates.map(update=>{
      const document=collection.find(entry=>entry.id===update._id);
      if(!document)throw Error(`${type} ausente: ${update._id}`);
      Object.assign(document,copy(update));
      return document;
    });
  }
  async deleteEmbeddedDocuments(type,ids){
    this.calls.push(['delete',type,[...ids]]);
    const key=type==='Stairway'?'stairways':type==='Region'?'regions':null;
    if(!key)throw Error(`Tipo inesperado: ${type}`);
    const deleted=this[key].filter(document=>ids.includes(document.id));
    this[key]=this[key].filter(document=>!ids.includes(document.id));
    if(type==='Stairway')this.flags.stairways.data=this.stairways;
    return deleted;
  }
}

function mockGame({version='13.351',stairwaysVersion='0.11.1',active=true,isGM=true}={}){
  const from=new MockScene('scene-a'),to=new MockScene('scene-b');
  return {
    version,user:{isGM},
    modules:new Map([['stairways',{id:'stairways',active,version:stairwaysVersion}]]),
    scenes:new Map([[from.id,from],[to.id,to]])
  };
}

function edge(overrides={}){
  return {
    id:'alberich-taverna',label:'Alberich → Taverna',bidirectional:true,
    from:{sceneId:'scene-a',x:100,y:200},to:{sceneId:'scene-b',x:500,y:600},
    runtimeProvider:'stairways',implementations:{},...overrides
  };
}

test('providerAvailability limita Stairways 0.11.x e escrita à Mestra no Foundry 13',()=>{
  assert.deepEqual(providerAvailability(mockGame()).stairways,{available:true,writable:true,active:true,version:'0.11.1',reason:null});
  assert.equal(providerAvailability(mockGame({stairwaysVersion:'0.12.0'})).stairways.reason,'module-version');
  assert.equal(providerAvailability(mockGame({version:'14.350'})).native.available,false);
  assert.equal(providerAvailability(mockGame({isGM:false})).native.writable,false);
});

test('ensureStairways cria par recíproco, marcado e idempotente sem mutar a aresta',async()=>{
  const game=mockGame(),input=edge(),before=copy(input);
  const result=await ensureStairways(game,input);
  assert.deepEqual(input,before);
  const from=game.scenes.get('scene-a').stairways[0],to=game.scenes.get('scene-b').stairways[0];
  assert.equal(from.name,to.name);
  assert.equal(from.scene,'scene-b');
  assert.equal(to.scene,'scene-a');
  assert.equal(from.flags.quedaco.teleport.role,'from');
  assert.equal(to.flags.quedaco.teleport.role,'to');
  assert.equal(from.disabled,false);
  assert.equal(to.disabled,false);
  assert.equal(result.implementations.stairways.connectionStatus,'connected');
  assert.equal(result.implementations.stairways.runtimeActive,true);
  await ensureStairways(game,result);
  assert.equal(game.scenes.get('scene-a').stairways.length,1);
  assert.equal(game.scenes.get('scene-b').stairways.length,1);
  assert.equal(game.scenes.get('scene-a').calls.filter(call=>call[0]==='create'&&call[1]==='Stairway').length,1);
});

test('ensureNativeRegions cria gatilho e landing separados nas duas Scenes',async()=>{
  const game=mockGame(),input=edge({runtimeProvider:'native'});
  const result=await ensureNativeRegions(game,input);
  const all=[...game.scenes.get('scene-a').regions,...game.scenes.get('scene-b').regions];
  assert.equal(all.length,4);
  const byRole=Object.fromEntries(all.map(region=>[region.flags.quedaco.teleport.role,region]));
  assert.deepEqual(byRole['from-trigger'].shapes[0],{type:'rectangle',x:100,y:200,width:100,height:100,rotation:0,hole:false});
  assert.equal(byRole['from-landing'].shapes[0].x,200);
  assert.equal(byRole['to-landing'].shapes[0].x,600);
  assert.equal(byRole['from-trigger'].behaviors.length,1);
  assert.equal(byRole['from-trigger'].behaviors[0].type,'teleportToken');
  assert.equal(byRole['from-trigger'].behaviors[0].system.destination,byRole['to-landing'].uuid);
  assert.equal(byRole['to-trigger'].behaviors[0].system.destination,byRole['from-landing'].uuid);
  assert.equal(byRole['from-trigger'].behaviors[0].system.choice,false);
  assert.equal(byRole['from-trigger'].behaviors[0].disabled,false);
  assert.equal(byRole['from-landing'].behaviors.length,0);
  assert.equal(result.implementations.native.connectionStatus,'connected');
  assert.equal(result.audit.activeCount,1);
});

test('setRuntimeProvider mantém só um mecanismo ativo e permite desligar ambos',async()=>{
  const game=mockGame();
  let result=await ensureStairways(game,edge());
  result=await ensureNativeRegions(game,result);
  const stairways=[...game.scenes.get('scene-a').stairways,...game.scenes.get('scene-b').stairways];
  const triggers=[...game.scenes.get('scene-a').regions,...game.scenes.get('scene-b').regions].filter(region=>region.behaviors.length);
  assert.ok(stairways.every(stairway=>stairway.disabled===false));
  assert.ok(triggers.every(region=>region.behaviors[0].disabled===true));
  result=await setRuntimeProvider(game,result,'native');
  assert.ok(stairways.every(stairway=>stairway.disabled===true));
  assert.ok(triggers.every(region=>region.behaviors[0].disabled===false));
  assert.equal(result.audit.activeCount,1);
  result=await setRuntimeProvider(game,result,'stairways');
  assert.ok(stairways.every(stairway=>stairway.disabled===false));
  assert.ok(triggers.every(region=>region.behaviors[0].disabled===true));
  result=await setRuntimeProvider(game,result,'none');
  assert.ok(stairways.every(stairway=>stairway.disabled===true));
  assert.ok(triggers.every(region=>region.behaviors[0].disabled===true));
  assert.equal(result.audit.activeCount,0);
});

test('ligação nativa unidirecional usa somente um gatilho e um landing',async()=>{
  const game=mockGame(),result=await ensureNativeRegions(game,edge({bidirectional:false,runtimeProvider:'native'}));
  const all=[...game.scenes.get('scene-a').regions,...game.scenes.get('scene-b').regions];
  assert.deepEqual(all.map(region=>region.flags.quedaco.teleport.role).sort(),['from-trigger','to-landing']);
  assert.equal(result.implementations.native.runtimeActive,true);
});

test('auditTeleportEdge denuncia um par Stairways que deixou de ser recíproco',async()=>{
  const game=mockGame(),result=await ensureStairways(game,edge());
  game.scenes.get('scene-a').stairways[0].scene='scene-a';
  const audited=auditTeleportEdge(game,result);
  assert.equal(audited.implementations.stairways.connectionStatus,'non-reciprocal');
  assert.equal(audited.audit.healthy,false);
});
