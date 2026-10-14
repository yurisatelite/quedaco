// Registro da família QUEDAÇO (Protocolo de Integração, contractVersion 1).
// Os módulos satélites publicam `game.modules.get(ID).api` com `family:'quedaco'` e emitem
// `Hooks.callAll('quedaco:register', descriptor)`. Aqui o QUEDAÇO principal só RECONHECE e
// abre a interface de cada um — nunca importa arquivo de outro módulo nem escreve em dado dele.
// Qualquer descritor fora do contrato é ignorado, nunca vira erro.

export const FAMILY='quedaco';
export const CONTRACT_VERSION=1;

/** Módulos conhecidos da família: rótulo/ícone de reserva para quando o descritor vier pobre. */
export const KNOWN_MODULES=Object.freeze({
  'quedaco-calendar':{icon:'fa-calendar-days',hint:'Calendário Skyfall (ID do pacote migrado)'},
  'quedaco-calendario':{icon:'fa-calendar-days',hint:'Calendário lunar/solar de Opath, integrado ao SmallTime'},
  'quedaco-explorador':{icon:'fa-compass',hint:'Exploração hexagonal e áreas do mapa'},
  'quedaco-tabelas':{icon:'fa-dice-d20',hint:'Criador visual de tabelas aleatórias'},
  'quedaco-npcs-de-venda':{icon:'fa-store',hint:'Mercadores independentes em qualquer ficha'},
  'quedaco-personagens-skyfall-rpg':{icon:'fa-user-plus',hint:'Criador de personagens'},
  'quedaco-jornal-da-queda':{icon:'fa-newspaper',hint:'Jornal da Queda'}
});

/** O objeto cumpre o contrato v1? (puro; não executa nada do módulo.) */
export function isFamilyDescriptor(api){
  return Boolean(api)&&typeof api==='object'
    &&api.family===FAMILY&&api.contractVersion===CONTRACT_VERSION
    &&typeof api.id==='string'&&api.id.startsWith('quedaco-')
    &&typeof api.open==='function'&&typeof api.getStatus==='function'
    &&Boolean(api.capabilities)&&typeof api.capabilities==='object';
}

/** Só as capabilities booleanas verdadeiras — o protocolo proíbe outro tipo de valor. */
export function activeCapabilities(api){
  return Object.entries(api?.capabilities??{}).filter(([,value])=>value===true).map(([key])=>key).sort();
}

/** `getStatus()` é somente-leitura por contrato; falha vira "não pronto". */
export function safeStatus(api){
  try{const status=api.getStatus();return {ready:status?.ready!==false,...(status&&typeof status==='object'?{detail:typeof status.detail==='string'?status.detail:undefined}:{})};}
  catch{return {ready:false};}
}

/**
 * Cria o registro. `hooks` = Hooks do Foundry; `game` = game. Retorna a API que o painel usa.
 * `scan()` varre módulos ativos (cobre quem registrou antes do QUEDAÇO ficar pronto);
 * `quedaco:register` cobre quem registrar depois.
 */
export function createFamilyRegistry({game,hooks,onChange=()=>{}}){
  const found=new Map();
  const add=api=>{if(!isFamilyDescriptor(api)||api.id==='quedaco')return false;const before=found.get(api.id);found.set(api.id,api);if(before!==api)onChange();return true;};
  const scan=()=>{
    try{for(const module of game?.modules??[]){const entry=Array.isArray(module)?module[1]:module;if(entry?.active)add(entry.api);}}catch{}
    return registry;
  };
  const registry={
    scan,
    register:add,
    has:id=>found.has(id),
    /** Lista segura para a interface (nada de objetos do módulo, só dado simples). */
    list(){
      return [...found.values()].map(api=>{
        const known=KNOWN_MODULES[api.id]??{};
        return {id:api.id,title:String(api.title??api.id),version:String(api.version??''),icon:known.icon??'fa-puzzle-piece',hint:known.hint??'',capabilities:activeCapabilities(api),...safeStatus(api)};
      }).sort((a,b)=>a.title.localeCompare(b.title,'pt-BR'));
    },
    /** Módulos que oferecem uma função (ex.: `calendar`, `npcDatabase`). */
    withCapability:capability=>[...found.values()].filter(api=>api.capabilities?.[capability]===true).map(api=>api.id),
    /** Abre a interface principal do módulo. Devolve false se ele não está registrado. */
    async open(id){const api=found.get(id);if(!api)return false;await api.open();return true;},
    /** Descritor bruto, para o QUEDAÇO consumir a API pública de outro módulo (nunca importar arquivo dele). */
    get:id=>found.get(id)
  };
  hooks?.on?.('quedaco:register',descriptor=>{add(descriptor);});
  return registry;
}

/** Ausentes na mesa: os da lista conhecida que ainda não se registraram (para a Mestra saber o que falta instalar/ativar). */
export function missingKnownModules(registry,game){
  return Object.keys(KNOWN_MODULES).filter(id=>!registry.has(id)).map(id=>{
    let installed=false,active=false;
    try{const module=game?.modules?.get?.(id);installed=Boolean(module);active=Boolean(module?.active);}catch{}
    return {id,installed,active,hint:KNOWN_MODULES[id].hint,icon:KNOWN_MODULES[id].icon};
  });
}
