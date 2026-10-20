/** Documento humano -> pacote do Cadastro. Não executa código nem infere regras. */
import {NPC_GENERATION_PROFILES} from './npc-generation-profiles.mjs';
export const NPC_BATCH_HEADER='QUEDACO-NPCS 1';
const aliases={nome:'name',legado:'legacy',heranca:'heritage',classe:'characterClass',antecedente:'background',nivel:'level',dinheiro:'cash',atributos:'attributes',inventario:'inventory',relacoes:'relations',pertences:'possessions',pericias:'skillPriority',idiomas:'languagePriority',talentos:'featPriority',maldicao:'curse',trilha:'path',conjuracao:'spellcasting',papel:'role',funcao:'job',regiao:'regionId',local:'placeId',aparencia:'appearance',vestuario:'clothes',comportamento:'behavior',voz:'voice',rotina:'routine',objetivo:'desire',receio:'fear',segredo:'secret',gancho:'hook',tatica:'tactics',descricao:'description',equipe:'teamId',tags:'tags',modulo:'sourceModule',contexto:'context',retrato:'portrait',token:'token',organizacao:'organizationId',ambiente:'environmentId'};
const key=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const jsonFields=new Set(['attributes','inventory','relations','possessions','skillPriority','languagePriority','featPriority','tags']);
const paragraphs=new Set(['description','appearance','clothes','behavior','voice','routine','desire','fear','secret','hook','tactics','context']);

export const NPC_BATCH_EXAMPLE=`QUEDACO-NPCS 1
id: teatro-primeiro-elenco
nome: Teatro dos Condenados — primeiro elenco
---
## teatro:mara | Mara, a Apostadora
Legado: Anuro
Herança: Bufonin
Classe: Combatente
Antecedente: Militar
Nível: 1
Dinheiro: 12
Atributos: {"str":3,"dex":1,"con":2,"int":0,"wis":2,"cha":-1}
Inventário: []
Função: Apostadora e antiga lutadora
Equipe: arquibancada-norte
Tags: ["apostadora", "teatro-dos-condenados"]
Módulo: quedaco-teatro
Descrição: Reconhece as equipes pelas cicatrizes e pelos escudos.
  Cobra favores dos lutadores que já patrocinou.
Objetivo: Financiar uma equipe que possa derrotar o campeão.
Segredo: Deve dinheiro ao organizador das lutas.
Relações: []`;

export function getNpcBatchInstructions(){
  return {format:'quedaco-npcs',schemaVersion:1,maxNpcs:200,maxBytes:2_000_000,example:NPC_BATCH_EXAMPLE,
    instructions:'Transforme o pedido narrativo do usuário em QUEDACO-NPCS 1. Um bloco ## ID | Nome por pessoa, inclusive cada integrante de equipe. Preserve IDs em reenvios. Detalhe função, descrição, aparência, vestuário, comportamento, voz, rotina, objetivo, receio, segredo, gancho e tática. Consulte os compêndios autorizados para legado, herança, classe, antecedente, trilha e equipamento. Preencha seis modificadores de atributo, nível 1–12, dinheiro inteiro em Trocados e inventário. Não invente nomes de conteúdo mecânico. Listas, atributos e inventário usam JSON em uma linha. Continuação de parágrafo usa dois espaços. Equipe é um identificador compartilhado; não cria Actor de equipe. Organização e Ambiente precisam de IDs existentes no Cadastro. Importe pela API previewAmbientContent/importAmbientContent, depois previewNpcBatch/createNpcBatch com IDs dos modelos importados. Somente a Mestra executa. O texto livre é preparado pelo assistente usando estas instruções; o módulo não chama IA externa.',
    descriptionEngine:{schemaVersion:1,mode:'local-rules',example:'Uma gnoma com ânima de gato, nível 1, batedora em Huma.',profileGroup:'npcGenerationProfiles',profileExample:structuredClone(NPC_GENERATION_PROFILES[0]),workflow:['stageNpcRequests({id,text,level,purpose,sourceModule,batchId})','prepareNpcRequests({ids})','createPreparedNpcRequests({ids}, {expectedSignature})'],notes:'Pedidos incompletos ficam em Journals privados da Mestra. O motor consulta termos/perfis cadastrados e compêndios. Não é um modelo de linguagem geral; conteúdo não reconhecido produz pendências.'},
    populationEngine:{schemaVersion:1,capability:'npcPopulation',mode:'local-rules',
      instructions:'Ao receber um pedido como “um grupo de ladrões de Maruma”, consulte getWorldCatalog() para resolver os IDs reais de região/localidade e npcGenerationProfiles. Consulte auditNpcGeneration() para legados e lacunas. Não invente IDs, regras nem substitua ladrões por outro propósito silenciosamente. Se o perfil não existir, proponha seu cadastro para revisão. Confirme ou explicite quantidade, faixa de níveis e legados permitidos. Use planNpcPopulation para um elenco sorteado, ou stageNpcRequests para integrantes descritos individualmente. O Cadastro prepara as propostas e delega as fichas ao Criador. A criação só ocorre após a ação de revisão da Mestra. Não chamar createPreparedNpcRequests como efeito automático de preparar um texto.',
      groupTemplate:{regionId:'ID_REAL_DA_REGIAO',count:6,minLevel:1,maxLevel:3,placeWeights:{ID_REAL_DA_LOCALIDADE:1},purposeWeights:{ID_REAL_DO_PERFIL:1},legacyWeights:{NOME_EXATO_DO_LEGADO:1},sourceModule:'ID_DO_MODULO_SOLICITANTE',text:'Objetivo do grupo, atividades, aparência, costumes locais e detalhes comuns. Não incluir uma lista de legados/profissões alternativos na prosa; usar os campos próprios.'},
      example:{format:'quedaco-grupo-npcs',schemaVersion:1,population:{regionId:'blurghta',placeWeights:{maruma:1},purposeWeights:{ladrao:1},legacyWeights:{Anuro:1},count:6,minLevel:1,maxLevel:3,teamId:'ladroes-de-maruma',seed:'maruma-grupo-01',text:'Proposta da campanha: um grupo de ladrões de Maruma que observa a chegada dos barcos, circula pelas palafitas e usa os túneis submersos como rota de fuga. Quer interceptar uma carga sem prejudicar os moradores. Adaptar vestuário e conduta ao ambiente fluvial.'}},
      individualTemplate:{id:'modulo:grupo:integrante-01',sourceModule:'modulo',batchId:'grupo',teamId:'grupo',text:'Descrição detalhada do integrante, sua função e vínculo com o local.',regionId:'ID_REAL_DA_REGIAO',placeId:'ID_REAL_DA_LOCALIDADE',purposeProfileId:'ID_REAL_DO_PERFIL',legacy:'NOME_EXATO_DO_LEGADO',level:1},
      documentFormat:{format:'quedaco-grupo-npcs',schemaVersion:1,population:'Preencher com groupTemplate, OU usar requests: [individualTemplate, ...]. Não enviar ambos.'},
      code:'const api = game.modules.get("quedaco").api;\nconst guia = api.getNpcBatchInstructions().populationEngine;\n// A IA consulta api.getWorldCatalog() e monta documento JSON com IDs reais.\nconst revisao = await api.prepareNpcGroup(documento);\n// Conferir revisao.rows, revisao.issues e revisao.population.\n// Após autorização da Mestra, sem precisar de cliques na interface:\nconst resultado = await api.createPreparedNpcGroup(revisao);',
      workflow:['getNpcBatchInstructions().populationEngine','getWorldCatalog() / auditNpcGeneration()','prepareNpcGroup(documento JSON ou objeto)','Revisar rows/issues; ação explícita da Mestra pode ser por código','createPreparedNpcGroup(revisao)'],
      notes:'Cada sorteio sem seed gera novo elenco. Reenvie config.seed para repetir o mesmo plano; IDs estáveis evitam duplicação na fila. Não cria Scenes/tokens nem entende prosa arbitrária sem uma IA externa que siga o contrato.'},
    workflow:['getNpcBatchInstructions()','previewAmbientContent(documento)','importAmbientContent(documento, {expectedRevision})','previewNpcBatch({ids})','createNpcBatch({ids}, {expectedRevision, expectedSignature})'],
    fields:{...aliases},actorType:'character',ownership:'gm',notes:'NPCs sociais e combatentes usam fichas character do Skyfall pelo motor existente. Não são ameaças npc. Nenhum Actor é criado ao importar o documento.'};
}

function packetFromBatch(batch){
  const npcs=batch.npcs??batch.characters??batch.personagens;
  if(!Array.isArray(npcs)||npcs.length<1||npcs.length>200)throw Error('O lote precisa de 1 a 200 NPCs.');
  return {format:'quedaco-ambientacao',schemaVersion:1,id:batch.id??'lote-de-npcs',title:batch.name??batch.nome??'Lote de NPCs',records:{npcModels:npcs.map(npc=>{
    if(!npc||typeof npc!=='object'||Array.isArray(npc))throw Error('Cada NPC precisa ser um objeto.');
    const {id,organizationId,environmentId,...model}=npc;
    return {id,name:model.name,visibility:'gm',...(organizationId?{organizationId}:{}),...(environmentId?{environmentId}:{}),model};
  })}};
}

export function npcBatchContent(input){
  if(typeof input==='object'){
    if(input?.format==='quedaco-npcs'&&input.schemaVersion!==1)throw Error('Versão de lote não suportada.');
    if(input?.format==='quedaco-npcs'||input?.npcs||input?.characters||input?.personagens)return packetFromBatch(input);
    return input;
  }
  let text=input.replace(/^\uFEFF/,'').trim();
  const fenced=/^```(?:json|text|txt|markdown|md)?\s*\n([\s\S]*?)\n```$/.exec(text);
  if(fenced)text=fenced[1].trim();
  if(text.startsWith('{'))return npcBatchContent(JSON.parse(text));
  if(!text.startsWith(NPC_BATCH_HEADER+'\n')&&!text.startsWith(NPC_BATCH_HEADER+'\r\n'))return text;
  const lines=text.split(/\r?\n/);lines.shift();
  const split=lines.indexOf('---');
  if(split<0)throw Error('Separe o cabeçalho dos NPCs com ---.');
  const meta={};
  for(const line of lines.slice(0,split).filter(line=>line.trim())){
    const match=/^(id|nome):\s*(.+)$/.exec(line);
    if(!match||Object.hasOwn(meta,match[1]))throw Error(`Cabeçalho inválido: ${line}`);
    meta[match[1]]=match[2].trim();
  }
  const npcs=[];let npc,last;
  for(const [index,line] of lines.slice(split+1).entries()){
    if(!line.trim())continue;
    const heading=/^## ([a-z0-9][a-z0-9:-]{0,99})\s*\|\s*(.+)$/.exec(line);
    if(heading){npc={id:heading[1],name:heading[2].trim()};npcs.push(npc);last=null;continue;}
    if(!npc)throw Error('Comece cada NPC com ## id | Nome.');
    if(/^  /.test(line)&&paragraphs.has(last)){npc[last]+='\n'+line.slice(2);continue;}
    const match=/^([^:]+):\s*(.*)$/.exec(line),field=match&&aliases[key(match[1])];
    if(!field||Object.hasOwn(npc,field))throw Error(`Campo inválido ou repetido na linha ${index+split+3}: ${line}`);
    const value=match[2].trim();
    if(jsonFields.has(field)){
      try{npc[field]=JSON.parse(value);}catch{throw Error(`${npc.name}: ${match[1]} precisa de JSON válido em uma linha.`);}
    }else if(['level','cash'].includes(field)){
      if(!/^-?\d+$/.test(value))throw Error(`${npc.name}: ${match[1]} precisa de um inteiro.`);
      npc[field]=Number(value);
    }else npc[field]=value;
    last=field;
  }
  return packetFromBatch({id:meta.id,name:meta.nome,npcs});
}
