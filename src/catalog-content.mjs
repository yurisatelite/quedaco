/** Contrato de conteúdo: dados de mundo, sem JavaScript nem documentos Actor. */
export const CONTENT_FORMAT='quedaco-ambientacao';
export const CONTENT_SCHEMA=1;
export const CONTENT_GROUPS=['regions','places','tags','climates','organizations','environments','npcModels'];
const forbidden=new Set(['__proto__','prototype','constructor']);
export function assertContentObject(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Esperado um objeto de conteúdo.');
  const visit=(row,depth)=>{
    if(depth>16)throw Error('Conteúdo muito aninhado.');
    if(!row||typeof row!=='object')return;
    for(const [name,child] of Object.entries(row)){
      if(forbidden.has(name))throw Error('Chave de conteúdo inválida.');
      visit(child,depth+1);
    }
  };
  visit(value,0);return value;
}
export function contentText(value,label,max=24000){
  if(typeof value!=='string')throw Error(`${label}: informe texto.`);
  if(value.length>max)throw Error(`${label}: limite de ${max} caracteres.`);
  return value.trim();
}
export function contentStrings(value,label){
  if(!Array.isArray(value)||value.length>200)throw Error(`${label}: informe uma lista com até 200 entradas.`);
  return [...new Set(value.map(row=>contentText(row,label,500)))].filter(Boolean);
}
export function contentSections(value){
  if(!Array.isArray(value)||value.length>100)throw Error('Seções: limite de 100 entradas.');
  const ids=new Set();
  return value.map(section=>{
    allowedKeys(section,['id','title','text'],'Seção');
    const id=contentText(section.id,'ID da seção',100);
    if(!/^[a-z0-9][a-z0-9:-]*$/.test(id)||ids.has(id))throw Error('Seção com ID inválido ou repetido.');
    ids.add(id);return {id,title:contentText(section.title,'Título da seção',200),text:contentText(section.text,'Texto da seção')};
  });
}
export function allowedKeys(value,keys,label){
  assertContentObject(value);
  for(const key of Object.keys(value))if(!keys.includes(key))throw Error(`${label}: campo não aceito “${key}”.`);
}
export function contentProfile(value,before={}){
  allowedKeys(value,['source','identity','uniform','conduct','equipment','finances','ranks','hooks','limits'],'Perfil');
  const result=structuredClone(before);
  if(value.source!==undefined&&value.source!=='campaign')throw Error('Perfil institucional é conteúdo de campanha.');
  result.source='campaign';
  for(const field of ['identity','finances','limits'])if(value[field]!==undefined)result[field]=contentText(value[field],field);
  for(const field of ['conduct','ranks','hooks'])if(value[field]!==undefined)result[field]=contentStrings(value[field],field);
  if(value.uniform!==undefined){
    allowedKeys(value.uniform,['everyday','field','formal','adaptations'],'Uniforme');
    result.uniform={...before.uniform};
    for(const [key,text] of Object.entries(value.uniform))result.uniform[key]=contentText(text,`Uniforme ${key}`);
  }
  if(value.equipment!==undefined){
    if(!Array.isArray(value.equipment)||value.equipment.length>100)throw Error('Equipamento: lista inválida.');
    result.equipment=value.equipment.map(kit=>{
      allowedKeys(kit,['purpose','items','notes'],'Equipamento');
      return {purpose:contentText(kit.purpose,'Função',200),items:contentStrings(kit.items,'Itens'),notes:contentText(kit.notes??'','Notas')};
    });
  }
  return result;
}

/** Modelo de entrada do Criador; não é uma ficha nem contém código executável. */
export function contentNpcModel(value){
  allowedKeys(value,['name','legacy','heritage','curse','characterClass','background','level','attributes','cash','spellcasting','path','role','job','regionId','placeId','appearance','clothes','behavior','voice','routine','desire','fear','secret','hook','tactics','possessions','skillPriority','languagePriority','featPriority','inventory','relations'],'Modelo de NPC');
  const result={};
  for(const field of ['name','legacy','heritage','characterClass','background']){result[field]=contentText(value[field],field,200);if(!result[field])throw Error(`Modelo: falta ${field}.`);}
  for(const field of ['curse','spellcasting','path','role','job','regionId','placeId','appearance','clothes','behavior','voice','routine','desire','fear','secret','hook','tactics'])if(value[field]!==undefined)result[field]=contentText(value[field],field);
  if(!Number.isInteger(value.level)||value.level<1||value.level>12)throw Error('Modelo: nível deve estar entre 1 e 12.');
  if(!Number.isSafeInteger(value.cash)||value.cash<0)throw Error('Modelo: dinheiro deve ser inteiro não negativo em Trocados.');
  allowedKeys(value.attributes,['str','dex','con','int','wis','cha'],'Atributos');
  if(Object.keys(value.attributes).length!==6||Object.values(value.attributes).some(v=>!Number.isInteger(v)||v< -4||v>4))throw Error('Modelo: preencha os seis modificadores de atributo.');
  Object.assign(result,{level:value.level,cash:value.cash,attributes:structuredClone(value.attributes)});
  for(const field of ['possessions','skillPriority','languagePriority','featPriority'])result[field]=contentStrings(value[field]??[],field);
  if(!Array.isArray(value.inventory)||value.inventory.length>100)throw Error('Modelo: inventário inválido.');
  result.inventory=value.inventory.map(item=>{
    allowedKeys(item,['name','quantity','rename','uniform','equipped'],'Item de inventário');
    if(!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>999)throw Error('Modelo: quantidade inválida.');
    for(const field of ['uniform','equipped'])if(item[field]!==undefined&&typeof item[field]!=='boolean')throw Error('Modelo: marcação de equipamento inválida.');
    return {name:contentText(item.name,'Nome do item',200),quantity:item.quantity,...(item.rename?{rename:contentText(item.rename,'Nome visual',200)}:{}),...(item.uniform!==undefined?{uniform:item.uniform}:{}),...(item.equipped!==undefined?{equipped:item.equipped}:{})};
  });
  if(!Array.isArray(value.relations??[])||(value.relations??[]).length>100)throw Error('Modelo: relações inválidas.');
  result.relations=(value.relations??[]).map(link=>{allowedKeys(link,['target','name','kind','text'],'Relação');return Object.fromEntries(Object.entries(link).map(([field,text])=>[field,contentText(text,field,2000)]));});
  return result;
}

/** .json e .txt aceitam o pacote JSON; .md/.txt também aceitam o cabeçalho abaixo. */
export function parseContentPackage(input){
  if(typeof input!=='string')return structuredClone(assertContentObject(input));
  if(new TextEncoder().encode(input).byteLength>2_000_000)throw Error('Arquivo de conteúdo maior que 2 MB.');
  const text=input.replace(/^\uFEFF/,'').trim();
  if(text.startsWith('{')){
    try{return assertContentObject(JSON.parse(text));}catch(error){throw Error(`JSON de ambientação inválido: ${error.message}`);}
  }
  const lines=text.split(/\r?\n/);
  if(lines.shift()!=='QUEDACO-AMBIENTACAO 1')throw Error('Use um pacote JSON ou o cabeçalho QUEDACO-AMBIENTACAO 1.');
  const separator=lines.indexOf('---');
  if(separator<0)throw Error('Separe os metadados do texto com uma linha ---.');
  const record={};let group='environments';
  for(const line of lines.slice(0,separator).filter(line=>line.trim())){
    const match=/^([a-zA-Z]+):\s*(.*)$/.exec(line);
    if(!match)throw Error(`Metadado inválido: ${line}`);
    const [,field,value]=match;
    if(field==='group'){if(!['environments','organizations'].includes(value))throw Error('Tipo de texto inválido.');group=value;continue;}
    if(!['id','name','kind','regionId','placeId','organizationId'].includes(field)||field in record)throw Error(`Metadado repetido ou não aceito: ${field}`);
    record[field]=value;
  }
  const sections=[];let current={id:'descricao',title:'Descrição',text:''};
  for(const line of lines.slice(separator+1)){
    if(/^##? /.test(line)){
      if(current.text.trim())sections.push(current);
      current={id:`secao-${sections.length+1}`,title:line.replace(/^##? /,''),text:''};
    }else current.text+=`${line}\n`;
  }
  if(current.text.trim())sections.push(current);
  record.sections=sections;
  if(group==='organizations'){
    if(record.regionId!==undefined){record.regionIds=[record.regionId];delete record.regionId;}
    if(record.placeId!==undefined){record.placeIds=[record.placeId];delete record.placeId;}
    if(record.organizationId!==undefined)throw Error('Organização não pode pertencer a outra por organizationId.');
  }
  return {format:CONTENT_FORMAT,schemaVersion:CONTENT_SCHEMA,id:record.id,title:record.name,records:{[group]:[record]}};
}

export function assertContentPackage(packet){
  allowedKeys(packet,['format','schemaVersion','id','title','records'],'Pacote');
  if(packet.format!==CONTENT_FORMAT||packet.schemaVersion!==CONTENT_SCHEMA)throw Error('Formato ou versão do conteúdo não suportado.');
  if(!/^[a-z0-9][a-z0-9:-]{0,99}$/.test(packet.id??''))throw Error('ID do pacote inválido.');
  contentText(packet.title??packet.id,'Título do pacote',200);
  if(new TextEncoder().encode(JSON.stringify(packet)).byteLength>2_000_000)throw Error('Pacote maior que 2 MB.');
  allowedKeys(packet.records,CONTENT_GROUPS,'Cadastros');
  let total=0;
  for(const [group,rows] of Object.entries(packet.records)){
    if(!Array.isArray(rows))throw Error(`${group}: informe uma lista.`);
    const ids=new Set();
    for(const row of rows){assertContentObject(row);if(ids.has(row.id))throw Error(`ID repetido em ${group}: ${row.id}`);ids.add(row.id);total++;}
  }
  if(total>500||total<1)throw Error('Pacote deve conter entre 1 e 500 registros.');
  return packet;
}

export function sameContent(a,b){
  const sorted=value=>Array.isArray(value)?value.map(sorted):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,sorted(value[key])])):value;
  return JSON.stringify(sorted(a))===JSON.stringify(sorted(b));
}
