export const FQL_MODULE_ID='forien-quest-log';

export const QUEST_STATUSES=Object.freeze([
  ['all','Todas'],
  ['available','Disponíveis'],
  ['active','Ativas'],
  ['completed','Concluídas'],
  ['failed','Fracassadas'],
  ['inactive','Inativas']
]);

const STATUS_LABELS=Object.fromEntries(QUEST_STATUSES);
const list=value=>Array.isArray(value)?value:[];

export function forienQuestAPI(game){
  const module=game?.modules?.get?.(FQL_MODULE_ID);
  const api=module?.active?module.public?.QuestAPI:null;
  return api?.DB&&typeof api.DB.getAllQuests==='function'?api:null;
}

export function forienHiddenFromPlayers(game){
  if(game?.user?.isGM)return false;
  try{return Boolean(game?.settings?.get?.(FQL_MODULE_ID,'hideFQLFromPlayers'));}catch{return false;}
}

export function plainQuestText(value){
  return String(value??'')
    .replace(/<\s*br\s*\/?\s*>/gi,' ')
    .replace(/<\s*\/\s*(p|div|li|h[1-6])\s*>/gi,' ')
    .replace(/<[^>]*>/g,' ')
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&lt;/gi,'<')
    .replace(/&gt;/gi,'>')
    .replace(/&quot;/gi,'"')
    .replace(/&#(?:39|x27);/gi,"'")
    .replace(/\s+/g,' ')
    .trim();
}

export function questView(quest,{gm=false}={}){
  const tasks=list(quest?.tasks).filter(task=>gm||!task?.hidden).map(task=>({
    id:String(task?.uuidv4??''),name:String(task?.name??'Objetivo'),completed:Boolean(task?.completed),failed:Boolean(task?.failed)
  }));
  const rewards=list(quest?.rewards).filter(reward=>gm||!reward?.hidden);
  const completed=tasks.filter(task=>task.completed).length;
  const failed=tasks.filter(task=>task.failed).length;
  const description=plainQuestText(quest?.description);
  return {
    id:String(quest?.id??''),
    name:String(quest?.name??'Quest sem nome'),
    status:STATUS_LABELS[quest?.status]?quest.status:'inactive',
    statusLabel:STATUS_LABELS[quest?.status]??STATUS_LABELS.inactive,
    description:description.length>280?`${description.slice(0,277).trimEnd()}…`:description,
    giver:String(quest?.giverData?.name??quest?.giverName??''),
    location:String(quest?.location??''),
    image:String(quest?.splash||quest?.giverData?.img||''),
    priority:Number(quest?.priority)||0,
    personal:Boolean(quest?.isPersonal),
    primary:Boolean(quest?.isPrimary),
    tasks,completed,failed,rewardCount:rewards.length,
    subquestCount:list(quest?.subquests).length
  };
}

export function visibleForienQuests(game){
  const api=forienQuestAPI(game);if(!api)return [];
  try{
    return list(api.DB.getAllQuests()).map(quest=>questView(quest,{gm:Boolean(game?.user?.isGM)})).filter(quest=>quest.id);
  }catch{return [];}
}

export function questCounts(quests){
  const counts={all:quests.length,available:0,active:0,completed:0,failed:0,inactive:0};
  for(const quest of quests)if(Object.hasOwn(counts,quest.status))counts[quest.status]++;
  return counts;
}

export class ForienQuestIntegration {
  constructor(game){this.game=game;}
  get api(){return forienQuestAPI(this.game);}
  get available(){return Boolean(this.api);}
  get hiddenFromPlayers(){return forienHiddenFromPlayers(this.game);}
  quests(){return visibleForienQuests(this.game).sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name,'pt-BR'));}
  open(questId){if(!this.api)throw Error("Forien's Quest Log não está ativo ou ainda não terminou de carregar.");return this.api.open({questId});}
  async create(){
    if(!this.game?.user?.isGM)throw Error('Somente o mestre pode criar quests por este painel.');
    if(!this.api)throw Error("Forien's Quest Log não está ativo ou ainda não terminou de carregar.");
    const quest=await this.api.DB.createQuest({});
    if(!quest?.id)throw Error('O Forien não criou a quest. Confira as configurações do módulo.');
    this.api.open({questId:quest.id});return quest;
  }
}

export function bindForienQuestHooks(game,callback,hooks=globalThis.Hooks){
  const api=forienQuestAPI(game),names=new Set(Object.values(api?.DB?.hooks??{}).filter(name=>typeof name==='string'&&name));
  names.add('ForienQuestLog.Lifecycle.ready');
  return Array.from(names,name=>hooks?.on?.(name,callback)).filter(id=>id!==undefined);
}
