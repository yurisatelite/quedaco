const clean=value=>String(value??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const originalBio=actor=>String(actor.system?.biography??'').replace(/<section data-quedaco-hunt-profile="1">[\s\S]*?<\/section>/g,'');
export function huntEligibility(actor){return actor?.type==='npc'&&['complex','boss'].includes(actor.system?.hierarchy);}
export function analyzeHuntCreature(actor){
  const bio=originalBio(actor),text=clean(bio),items=Array.from(actor.items??[]);
  const field=(label)=>{
    const match=new RegExp(`<strong>\\s*${label}:?\\s*</strong>\\s*([\\s\\S]*?)</p>`,'i').exec(bio);
    const value=clean(match?.[1]??'');return {value:value==='—'?'':value,certainty:value&&value!=='—'?(actor.flags?.quedaco?.convertedFrom?'inferred':'explicit'):'unknown',source:match?'system.biography':''};
  };
  const profile={schemaVersion:1,actorUuid:actor.uuid??`Actor.${actor.id}`,eligible:huntEligibility(actor),hierarchy:actor.system?.hierarchy??'',
    biographyPresent:Boolean(text),fields:{habitat:field('Habitat em Opath'),appearance:field('Aparência'),temperament:field('Temperamento'),behavior:field('Comportamento'),tactics:field('Táticas'),motivation:field('O que quer'),
      diet:field('Alimentação'),lair:field('Covil'),activity:field('Atividade'),social:field('Organização social')},
    mechanics:{intelligence:actor.system?.abilities?.int?.value??null,movement:structuredClone(actor.system?.movement??{}),damageTaken:structuredClone(actor.system?.modifiers?.damage?.taken??{}),archetypes:Array.from(actor.system?.archetype??[])},
    traits:items.map(item=>({uuid:item.uuid??'',name:item.name??'',type:item.type,description:clean(item.system?.description?.value??item.system?.description??'')})),
    note:'Compilação de dados da ficha. Texto de conversão e informações narrativas exigem revisão; lacunas não concedem habilidades.'};
  // Só preserva campos explicitamente revisados; propostas não viram fatos por repetição.
  for(const key of Object.keys(profile.fields)){
    const previous=actor.flags?.quedaco?.huntProfile?.fields?.[key];
    if(previous?.reviewed===true&&typeof previous.value==='string'&&['explicit','inferred','unknown'].includes(previous.certainty))profile.fields[key]=structuredClone(previous);
  }
  profile.suggestions=[{kind:'investigation',certainty:'inferred',text:'Investigue um sinal de passagem e ofereça uma rota alternativa por observação ou relato. A natureza do vestígio depende da revisão do perfil.'}];
  for(const [key,text] of [['walk','Propor rastros em solo compatível com o terreno; confirmar formato e tamanho da criatura.'],['flight','Propor observação de rotas aéreas ou pontos de pouso, sem presumir ninho.'],['swim','Propor investigação nas margens ou na água, sem presumir dieta aquática.'],['burrow','Propor perturbações no solo, sem presumir um covil subterrâneo.']]){
    if(Number(profile.mechanics.movement[key])>0)profile.suggestions.push({kind:'trail',certainty:'inferred',source:`system.movement.${key}`,text});
  }
  return profile;
}
export function enrichedHuntBiography(actor,profile){
  const rows=Object.entries(profile.fields).map(([key,row])=>`<li><strong>${esc(({habitat:'Habitat',appearance:'Aparência',temperament:'Temperamento',behavior:'Comportamento',tactics:'Táticas',motivation:'Motivação',diet:'Alimentação',lair:'Covil',activity:'Atividade',social:'Organização social'})[key])}:</strong> ${esc(row.value||'Não informado — preencher durante a preparação.')}</li>`).join('');
  const suggestions=profile.suggestions.map(row=>`<li>${esc(row.text)} (Sugestão narrativa, revisar.)</li>`).join('');
  return `${originalBio(actor)}<section data-quedaco-hunt-profile="1"><h2>Preparação de caçada — QUEDAÇO</h2><p>Hierarquia: ${esc(profile.hierarchy)}. Dados compilados da ficha, sujeitos à revisão da Mestra.</p><ul>${rows}</ul><h3>Possibilidades de investigação</h3><ul>${suggestions}</ul><p>Relógios não revelam a identidade automaticamente. Perfil sem alteração das estatísticas ou habilidades.</p></section>`;
}
const signature=actor=>JSON.stringify({system:actor.system?.toObject?.()??actor.system,items:Array.from(actor.items??[]).map(item=>item.toObject?.()??item),profile:actor.flags?.quedaco?.huntProfile??null});
export function createHuntProfileService(game,{updateActors,makeId=()=>globalThis.crypto.randomUUID()}={}){
  const plans=new Map();let queue=Promise.resolve();
  const gm=()=>{if(!game.user?.isGM)throw Error('Somente a Mestra prepara fichas de caçada.');};
  return Object.freeze({
    previewMonsterHuntProfiles(){
      gm();const creatures=Array.from(game.actors??[]).filter(actor=>actor.type==='npc'),eligible=creatures.filter(huntEligibility);
      const rows=eligible.map(actor=>{const profile=analyzeHuntCreature(actor),biography=enrichedHuntBiography(actor,profile);return {id:actor.id,uuid:actor.uuid,name:actor.name,profile,biography,signature:signature(actor),before:{biography:actor.system.biography??'',profile:structuredClone(actor.flags?.quedaco?.huntProfile??null)}};});
      const id=makeId();if(plans.size>=10)plans.delete(plans.keys().next().value);plans.set(id,rows);
      return {id,total:rows.length,excludedSimple:creatures.filter(actor=>actor.system?.hierarchy==='simple').length,unrecognized:creatures.filter(actor=>!['simple','complex','boss'].includes(actor.system?.hierarchy)).length,rows:structuredClone(rows)};
    },
    async applyMonsterHuntProfiles(id){
      gm();const task=queue.then(async()=>{
        gm();const rows=plans.get(id);if(!rows)throw Error('Gere uma nova prévia.');
        for(const row of rows){const actor=Array.from(game.actors??[]).find(actor=>actor.id===row.id);if(!actor||!huntEligibility(actor)||signature(actor)!==row.signature)throw Error('Uma ficha mudou. Gere nova prévia antes de aplicar.');}
        const changes=rows.filter(row=>row.biography!==row.before.biography||JSON.stringify(row.profile)!==JSON.stringify(row.before.profile)).map(row=>({_id:row.id,'system.biography':row.biography,'flags.quedaco.huntProfile':row.profile,'flags.quedaco.huntProfileBackup':row.before}));
        if(changes.length)await updateActors(changes);
        plans.delete(id);return {updated:changes.length,excludedSimple:true};
      });queue=task.catch(()=>{});return task;
    }
  });
}
