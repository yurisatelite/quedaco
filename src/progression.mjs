import {normalize} from './rules.mjs';

const shared={2:'Escolha de trilha',4:'Talento adquirido',6:'Talento adquirido',7:'Trilha avançada ou segunda trilha',8:'Talento adquirido',10:'Talento adquirido',12:'Talento adquirido'};
export const CLASS_PROGRESSIONS={
  combatente:{die:10,fixed:6,levels:{1:'Ataque Poderoso, Estilo e Façanhas de Combate',...shared,3:'Só um Arranhão',5:'Ataque em Sequência',9:'Estilo de Combate Avançado',11:'Ataque em Sequência (2)'}},
  especialista:{die:8,fixed:5,levels:{1:'Ataque Especializado, Especialidade e Artimanhas',...shared,3:'Ação Ardilosa',5:'Talento Especializado e Cambalhota!',7:'Trilha avançada, segunda trilha e Evasão Especializada',9:'Talento Especializado',11:'Talento Especializado'}},
  ocultista:{die:6,fixed:4,levels:{1:'Ocultismo, Conexão Superficial e Tradição Ocultista',...shared,3:'Vislumbre Arcano (1 uso)',5:'Conexão Rasa',7:'Trilha avançada, segunda trilha e Vislumbre Arcano (2 usos)',9:'Conexão Profunda',11:'Vislumbre Arcano (3 usos)'}}
};

export function classProgression(className,targetLevel=1){
  const definition=CLASS_PROGRESSIONS[normalize(className)],level=Math.max(1,Math.min(12,Number(targetLevel)||1));
  if(!definition)return [];
  return Array.from({length:level},(_,index)=>{const current=index+1;return {level:current,proficiency:current>=9?4:current>=5?3:2,emphasis:current*3,feature:definition.levels[current]??'Progressão automática da classe',hitPoints:current===1?`Máximo do d${definition.die} + CON`:`1d${definition.die} ou ${definition.fixed} + CON`};});
}

export function requiresSpellcasting(className,plan){return normalize(className)==='ocultista'||Boolean(plan?.groups.some(group=>group.granting==='spell')||plan?.included.some(item=>item.entry.type==='spell'));}
