import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCharacterPlan,buildLevelOnePlan,validateBenefitChoices,resolvedPlanItems} from '../src/benefits.mjs';

const makeDoc=(uuid,name,type,system={})=>({uuid,name,type,system:{benefits:[],feats:[],...system}});
function mockCatalog(documents) {
  const docs=new Map(documents.map(doc=>[doc.uuid,doc]));
  return {
    items:documents.map(({uuid,name,type,img='art.webp'})=>({uuid,name,type,img})),
    document:async uuid=>docs.get(uuid),
    list(type){return this.items.filter(item=>item.type===type);}
  };
}

test('plano de nível 1 segue herança, características e escolhas aninhadas',async()=>{
  const heritage=makeDoc('heritage','Herança Azul','heritage');
  const fixed=makeDoc('fixed','Sangue Dracônico','feature');
  const style=makeDoc('style','Estilo de Combate','feature',{benefits:[{_id:'style-grant',type:'grant',granting:'feat',query:'fighting-style'}],feats:['shield-style']});
  const shieldStyle=makeDoc('shield-style','Combate com Escudo','feat');
  const legacy=makeDoc('legacy','Draco','legacy',{benefits:[{_id:'heritage-origin',type:'heritage',uuid:'heritage',level:0},{_id:'fixed-origin',type:'feature',uuid:'fixed',level:0}]});
  const cls=makeDoc('class','Combatente','class',{benefits:[{_id:'style-origin',type:'feature',uuid:'style',level:1}]});
  const bg=makeDoc('bg','Erudito','background');
  const catalog=mockCatalog([legacy,heritage,fixed,style,shieldStyle,cls,bg]);
  const plan=await buildLevelOnePlan(catalog,{legacy:'legacy',heritage:'heritage',class:'class',background:'bg'});
  assert.deepEqual(plan.included.map(item=>item.entry.name),['Herança Azul','Sangue Dracônico','Estilo de Combate']);
  assert.equal(plan.groups.length,1);assert.equal(plan.groups[0].options[0].name,'Combate com Escudo');
  const choices={[plan.groups[0].id]:['shield-style']};
  assert.deepEqual(validateBenefitChoices(plan,choices),[]);
  assert.equal(resolvedPlanItems(plan,choices).find(item=>item.entry.uuid==='shield-style').originId,'style-grant');
});

test('três grants de magia exigem três truques diferentes',async()=>{
  const connection=makeDoc('connection','Conexão Superficial','feature',{benefits:['a','b','c'].map(_id=>({_id,type:'grant',granting:'spell',query:''}))});
  const cls=makeDoc('class','Ocultista','class',{benefits:[{_id:'connection-origin',type:'feature',uuid:'connection',level:1}]});
  const bg=makeDoc('bg','Agouro','background');
  const legacy=makeDoc('legacy','Humani','legacy',{benefits:[{_id:'heritage-origin',type:'heritage',uuid:'heritage',level:0}]});
  const heritage=makeDoc('heritage','Herança Maresia','heritage');
  const cantrip=makeDoc('cantrip','Luz','spell',{descriptors:['cantrip']});
  const shallow=makeDoc('shallow','Bola de Fogo','spell',{descriptors:['shallow']});
  const catalog=mockCatalog([connection,cls,bg,legacy,heritage,cantrip,shallow]);
  const plan=await buildLevelOnePlan(catalog,{legacy:'legacy',heritage:'heritage',class:'class',background:'bg'});
  const group=plan.groups[0];assert.equal(group.count,3);assert.deepEqual(group.options.map(option=>option.name),['Luz']);
  assert.match(validateBenefitChoices(plan,{[group.id]:['cantrip','cantrip','cantrip']})[0],/não repita/);
});

test('trilha escolhida entra no plano e abre seus benefícios próprios',async()=>{
  const cls=makeDoc('class','Especialista','class',{benefits:[{_id:'class-02',type:'grant',granting:'path',query:'',level:2}]});
  const pathFeature=makeDoc('path-feature','Ação Ardilosa','feature');
  const path=makeDoc('path','Trilha Ladina','path',{benefits:[{_id:'path-01',type:'feature',uuid:'path-feature',level:1}]});
  const bg=makeDoc('bg','Artista','background');
  const legacy=makeDoc('legacy','Humani','legacy',{benefits:[{_id:'heritage-origin',type:'heritage',uuid:'heritage',level:0}]});
  const heritage=makeDoc('heritage','Herança','heritage');
  const catalog=mockCatalog([cls,path,pathFeature,bg,legacy,heritage]);
  const first=await buildLevelOnePlan(catalog,{legacy:'legacy',heritage:'heritage',class:'class',background:'bg'});
  assert.equal(first.groups.length,0);
  const levelTwo=await buildCharacterPlan(catalog,{legacy:'legacy',heritage:'heritage',class:'class',background:'bg'},{},2);
  const trail=levelTwo.groups.find(group=>group.granting==='path');
  assert.deepEqual(trail.options.map(option=>option.name),['Trilha Ladina']);
  const expanded=await buildCharacterPlan(catalog,{legacy:'legacy',heritage:'heritage',class:'class',background:'bg'},{[trail.id]:['path']},2);
  assert.ok(expanded.included.some(item=>item.entry.name==='Ação Ardilosa'));
});

test('tabela de classe mantém a escolha de trilha disponível quando o grant do compêndio falta',async()=>{
  const cls=makeDoc('class','Combatente','class');
  const pathFeature=makeDoc('path-feature','Golpe de trilha','feature');
  const path=makeDoc('path','Trilha Marcial','path',{benefits:[{_id:'path-feature-origin',type:'feature',uuid:'path-feature',level:1}]});
  const bg=makeDoc('bg','Artista','background');
  const legacy=makeDoc('legacy','Humani','legacy',{benefits:[{_id:'heritage-origin',type:'heritage',uuid:'heritage',level:0}]});
  const heritage=makeDoc('heritage','Herança','heritage');
  const catalog=mockCatalog([cls,path,pathFeature,bg,legacy,heritage]);
  const levelTwo=await buildCharacterPlan(catalog,{legacy:'legacy',heritage:'heritage',class:'class',background:'bg'},{},2);
  const firstTrail=levelTwo.groups.find(group=>group.granting==='path');
  assert.equal(firstTrail.atLevel,2);
  assert.equal(firstTrail.count,1);
  assert.ok(firstTrail.options.length>0);
  const plan=await buildCharacterPlan(catalog,{legacy:'legacy',heritage:'heritage',class:'class',background:'bg'},{},7);
  const trails=plan.groups.filter(group=>group.granting==='path');
  assert.deepEqual(trails.map(group=>group.atLevel),[2,7]);
  assert.ok(trails.every(group=>group.count===1&&group.options.length>0&&group.options[0].uuid==='path'));
  const expanded=await buildCharacterPlan(catalog,{legacy:'legacy',heritage:'heritage',class:'class',background:'bg'},{[trails[0].id]:['path'],[trails[1].id]:['path']},7);
  assert.ok(expanded.included.some(item=>item.entry.uuid==='path-feature'));
});

test('Ocultista mantém as escolhas de truque quando grants antigos de magia estão ausentes',async()=>{
  const cls=makeDoc('class','Ocultista','class');
  const bg=makeDoc('bg','Artista','background');
  const legacy=makeDoc('legacy','Humani','legacy',{benefits:[{_id:'heritage-origin',type:'heritage',uuid:'heritage',level:0}]});
  const heritage=makeDoc('heritage','Herança','heritage');
  const cantrip=makeDoc('cantrip','Luz','spell',{descriptors:['cantrip']});
  const superficial=makeDoc('superficial','Escuridão','spell',{descriptors:['superficial']});
  const catalog=mockCatalog([cls,bg,legacy,heritage,cantrip,superficial]);
  const selections={legacy:'legacy',heritage:'heritage',class:'class',background:'bg'};
  const levelOne=await buildCharacterPlan(catalog,selections,{},1);
  const first=levelOne.groups.find(group=>group.id.includes('cantrip-choice|1'));
  assert.equal(first.count,3);assert.deepEqual(first.options.map(option=>option.uuid),['cantrip']);
  const levelNine=await buildCharacterPlan(catalog,selections,{},9);
  assert.deepEqual(levelNine.groups.filter(group=>group.granting==='spell').map(group=>[group.atLevel,group.count]),[[1,3],[5,1],[9,1]]);
});
