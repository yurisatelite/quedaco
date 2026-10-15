/**
 * Dossiês de ambientação próprios da campanha.
 *
 * `source:'skyfall-book'` identifica somente fatos confirmados pelo livro;
 * nomes, legados e histórias marcados `source:'campaign'` são material da
 * mesa. Eles não criam Actors nem escrevem no mundo: o painel os usa como
 * referência até a Mestra decidir transformar um dossiê em ficha.
 */
export const ORGANIZATIONS=Object.freeze([
  {id:'dips',name:'DIPS',aliases:['Divisão de Investigação de Portas e Saletas','Divisão de Investigação de Portais e Seletas','Departamento de Investigação de Portas e Salas de Alberich'],kind:'polícia/investigação',status:'canônica',visibility:'gm',regionIds:['thurthur'],placeIds:['alberich','bosque-passagem'],headquartersPlaceId:'alberich',functions:['Investigar crimes e ocorrências ligados a Portas, Salas e Saletas','Conter ameaças e criminosos extraplanares','Registrar e fiscalizar fenômenos planares'],npcRoles:['comissário','detetive','agente de campo','analista de Portas','perito arcano','guarda de custódia','informante'],source:{book:'Skyfall RPG — Livro Básico Digital 1.25',pages:[329,335,376,391]}},
  {id:'copa',name:'COPA',aliases:['Central de Operações da Política de Alberich'],kind:'força-tarefa',status:'canônica',visibility:'gm',regionIds:['thurthur'],placeIds:['alberich','bosque-passagem'],headquartersPlaceId:'alberich',functions:['Atuar em Thur Thur e auxiliar governos vizinhos','Patrulhar, conter e responder a incidentes regionais','Coordenar a segurança da rota do Bosque da Passagem'],npcRoles:['coordenador de operações','oficial de ligação','patrulheiro','caçador/rastreador','especialista em contenção','socorrista'],source:{book:'Skyfall RPG — Livro Básico Digital 1.25',pages:[376]}}
]);

export const AMBIENT_NPCS=Object.freeze([
  {id:'ribs',name:'Ribs',organizationId:'dips',origin:'skyfall-book',canonical:true,role:'detetive',regionId:'thurthur',placeId:'alberich',legacy:'Humani',heritage:'Herança Mortalha',characterClass:'Especialista',level:4,publicSummary:'Detetive atento a detalhes que outros ignoram.',gmHook:'O livro confirma Ribs como detetive da DIPS; legado, herança, classe, nível e gancho são adaptação da campanha.',source:{book:'Skyfall RPG — Livro Básico Digital 1.25',pages:[118]}},
  {id:'naira-vell',name:'Naira Vell',organizationId:'dips',origin:'campaign',canonical:false,role:'comissária',regionId:'thurthur',placeId:'alberich',legacy:'Elfe',heritage:'Corte do Verão',characterClass:'Especialista',level:6,publicSummary:'Comissária metódica que exige registros precisos antes de autorizar uma operação.',gmHook:'Sabe mais do acordo de Lápis do que admite e vigia quem consulta os arquivos antigos.'},
  {id:'orem-daska',name:'Orem Daska',organizationId:'dips',origin:'campaign',canonical:false,role:'analista de Portas',regionId:'thurthur',placeId:'alberich',legacy:'Gnomo',heritage:'2 Heranças Maiores',characterClass:'Ocultista',level:5,publicSummary:'Analista arcano que desenha mapas de ressonância para seguir rastros planares.',gmHook:'Sua pesquisa sobre uma Saleta desaparecida o coloca em risco de comprometer uma investigação.'},
  {id:'talvek-aru',name:'Talvek Aru',organizationId:'dips',origin:'campaign',canonical:false,role:'agente de campo',regionId:'thurthur',placeId:'alberich',legacy:'Anuro',heritage:'Bufonin',characterClass:'Combatente',level:3,publicSummary:'Agente de campo paciente, encarregado de proteger perímetros e testemunhas.',gmHook:'Tem uma dívida com uma hansa local e tenta resolver o problema sem envolver a comissária.'},
  {id:'mara-dourac',name:'Mara Dourac',organizationId:'dips',origin:'campaign',canonical:false,role:'perita arcana',regionId:'thurthur',placeId:'alberich',legacy:'Urodelo',heritage:'Herança Elétrica',characterClass:'Especialista',level:3,publicSummary:'Perita que transforma vestígios mágicos em linhas de investigação.',gmHook:'Reconheceu a assinatura de uma antiga célula quimerizadora em um caso recente.'},
  {id:'yasmin-corvo',name:'Yasmin Corvo',organizationId:'dips',origin:'campaign',canonical:false,role:'informante',regionId:'thurthur',placeId:'alberich',legacy:'Kishin',heritage:'Corvo (Família)',characterClass:'Ocultista',level:2,publicSummary:'Informante com trânsito entre estudiosos, comerciantes e exploradores de Saletas.',gmHook:'Só entrega informação completa quando a DIPS protege uma pessoa que ela não pode nomear.'},
  {id:'adria-fenda',name:'Adria Fenda',organizationId:'copa',origin:'campaign',canonical:false,role:'coordenadora de operações',regionId:'thurthur',placeId:'alberich',legacy:'Tôra',heritage:'Törmundiano',characterClass:'Combatente',level:6,publicSummary:'Coordenadora da COPA, prática e direta ao planejar respostas para ameaças regionais.',gmHook:'A primeira derrota da COPA no Bosque da Passagem ainda guia suas decisões e a torna cautelosa demais.'},
  {id:'dandara-mbo',name:"Dandara M'bo",organizationId:'copa',origin:'campaign',canonical:false,role:'patrulheira',regionId:'thurthur',placeId:'bosque-passagem',legacy:'Humani',heritage:'Herança Mortalha',characterClass:'Especialista',level:4,publicSummary:'Patrulheira que conhece atalhos, vilas e marcas perigosas no Bosque da Passagem.',gmHook:'Encontrou sinais de uma criatura híbrida inteligente, mas ainda não decidiu a quem confiar o achado.'},
  {id:'noka-petala',name:'Noka Pétala',organizationId:'copa',origin:'campaign',canonical:false,role:'socorrista',regionId:'thurthur',placeId:'bosque-passagem',legacy:'Petalin',heritage:'Herança Gemni',characterClass:'Ocultista',level:3,publicSummary:'Socorrista e ocultista de apoio, especializada em tirar civis e agentes de áreas contaminadas.',gmHook:'Mantém amostras de alterações quiméricas para tentar descobrir um método de reversão.'},
  {id:'varrik-kesh',name:'Varrik Kesh',organizationId:'copa',origin:'campaign',canonical:false,role:'especialista em contenção',regionId:'thurthur',placeId:'bosque-passagem',legacy:'Sanguir',heritage:'Byotr',characterClass:'Combatente',level:4,publicSummary:'Especialista em contenção que prioriza rotas de fuga e proteção de vilas.',gmHook:'Defende que a COPA deve fechar a rota; Adria acredita que isso isolaria inocentes e perderia inteligência.'}
]);

export function organizationRoster(organizationId){
  return AMBIENT_NPCS.filter(npc=>npc.organizationId===organizationId);
}

export function ambientNpcById(id){
  return AMBIENT_NPCS.find(npc=>npc.id===id)??null;
}
