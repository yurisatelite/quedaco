export const CHANGELOG = [
  {
    version:'0.4.11',
    date:'2026-09-09',
    title:'Quests públicas integradas ao Forien',
    notes:[
      'A aba Quests agora está disponível para todos os jogadores. Cada usuário vê somente as quests permitidas pelo Forien.',
      'Cartões mostram estado, local, contratante, objetivos visíveis, recompensas, prioridade e subquests.',
      'Busca, filtros por estado e contadores ajudam a acompanhar a campanha.',
      'Quests abrem na ficha oficial do Forien, e o mestre pode criar uma nova quest pelo QUEDAÇO.',
      'Alterações feitas no Forien atualizam automaticamente o painel aberto.'
    ]
  },
  {
    version:'0.4.10',
    date:'2026-09-09',
    title:'Novidades, mapa e controle do painel',
    notes:[
      'Caixinha de novidades exibida uma vez por versão para cada usuário.',
      'Mapa de Opath com pan, zoom, pinos de região e cidade e detalhes ligados às cenas.',
      'NPCs da macro podem ser editados, ativados e excluídos diretamente, com local inferido e filtro.',
      'Monstros mostram a imagem inteira e filtros ficam recolhidos até serem abertos.',
      'Itens voltam a usar miniaturas compactas.',
      'Imbuir agora é uma área própria do painel, separada do catálogo de itens.'
    ]
  },
  {
    version:'0.4.9',
    date:'2026-09-09',
    title:'Painel de campanha, filtros e macro',
    notes:[
      'Filtros de monstro por tipo, papel, porte, deslocamento e ND combináveis.',
      'Botão “Gerar um monstro assim” quando nenhum monstro do livro combina.',
      'Painel de NPCs lê as pastas criadas pela macro de geração.',
      'Vínculos entre NPCs e montador de item modificado.'
    ]
  }
];

const versionParts=value=>String(value??'').replace(/^v/i,'').split('.').map(part=>Number.parseInt(part,10)||0);

export function isNewer(a,b){
  if(!String(a??'').trim())return false;
  if(!String(b??'').trim())return true;
  const left=versionParts(a),right=versionParts(b),length=Math.max(left.length,right.length);
  for(let index=0;index<length;index++){
    const difference=(left[index]??0)-(right[index]??0);
    if(difference)return difference>0;
  }
  return false;
}

export function entriesSince(entries,seenVersion){
  if(!Array.isArray(entries)||!entries.length)return [];
  if(!String(seenVersion??'').trim())return entries.slice(0,1);
  return entries.filter(entry=>isNewer(entry.version,seenVersion));
}
