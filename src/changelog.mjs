export const CHANGELOG = [
  {
    version:'0.4.21',
    date:'2026-09-10',
    title:'Cartão de NPC mínimo e sobrecarga arcana automática',
    notes:[
      'O cartão de NPC agora tem só o essencial: tipo, local, nível e "Editar". "Liberar aos jogadores" virou o ícone de olho no canto superior. PV, PE, Pontos de Sombra e as fichas de Legado, Herança, Classe, Trilha, Maldição e Antecedente foram para dentro de "Editar".',
      'Sobrecarga arcana: ao equipar um item cujos sigilos passam do limite de Fragmentos Arcanos do portador, o QUEDAÇO rola Nd6 de dano Energético e aplica na ficha — o sistema base só exibia um aviso. Dá para desligar em Configurações do Módulo.',
      '"Liberar tudo deste local" e "Liberar tudo da região": um clique libera o ponto no mapa, os NPCs de lá e as ameaças marcadas na região.',
      'Cada região aceita várias cenas vinculadas: no dossiê da região, escolha quantas cenas quiser; os jogadores ganham um botão "Abrir" para cada uma quando a região está liberada.',
      'Um lápis sobre a imagem de região ou local troca a arte direto pela figura. As caixinhas de filtro de monstro não puxam mais a cor amarela do tema.'
    ]
  },
  {
    version:'0.4.20',
    date:'2026-09-10',
    title:'Cartão de NPC enxuto e editor reorganizado',
    notes:[
      'O cartão de NPC agora mostra nível, PV, PE e Pontos de Sombra em destaque, além de fichas de Legado, Herança, Classe, Trilha, Maldição, Antecedente e da guilda/hansa com miniatura.',
      'O cartão deixou de ter o seletor de papel e o botão "Abrir ficha": ficam só "Liberar aos jogadores" e "Editar". A lixeira foi para o canto inferior direito e a liberação virou uma bolinha verde no canto.',
      'O editor ganhou "Abrir ficha" no cabeçalho; Vínculos, Estoque e Criar item ficam recolhidos; os campos de loja aparecem só para Mercador e os de forja só para Ferreiro; a região acompanha o local automaticamente.',
      'Novos papéis: Diplomata, Guarda, Clero, Erudito, Nobre, Espião, Curandeiro, Artesão, Autoridade, Agiota, Mercenário e Informante. As listas de papel, região e local agora vêm em ordem alfabética.'
    ]
  },
  {
    version:'0.4.19',
    date:'2026-09-10',
    title:'Retratos de NPC pela pasta da mesa',
    notes:[
      'Os cartões de NPC e monstro agora tentam .webp, .png, .jpg e .svg da pasta de imagens — não ficam mais no boneco cinza quando o arquivo é .png.',
      'A "Pasta de imagens do QUEDAÇO" passa a ter o padrão "assets"; ajuste em Configurações do Módulo se a sua for outra.'
    ]
  },
  {
    version:'0.4.18',
    date:'2026-09-10',
    title:'Layout da forja corrigido',
    notes:[
      'A bancada de forja do Ferreiro agora ocupa a largura toda em vez de ficar espremida na coluna do cartão.',
      'Os nomes de equipamento no painel da forja não quebram mais letra a letra.',
      '"Ataque desarmado" e armas naturais saíram da lista "Seu equipamento" da forja.'
    ]
  },
  {
    version:'0.4.17',
    date:'2026-09-10',
    title:'Botão do menu lateral liberado para os jogadores',
    notes:[
      'O botão do QUEDAÇO no menu lateral de controles de cena agora aparece para todos: o mestre abre o painel de campanha, o jogador vai direto para a criação de personagens.',
      'O botão na aba de Atores continua indo direto para a criação de personagens.'
    ]
  },
  {
    version:'0.4.16',
    date:'2026-09-10',
    title:'A forja do Ferreiro cria o item',
    notes:[
      'O mestre passa a ver e usar a bancada de forja no cartão de um NPC Ferreiro (antes só o jogador via).',
      'Sem personagem no usuário, a forja usa o ator do token selecionado na cena.',
      'A aba Imbuir continua sendo a calculadora de referência; a criação do item acontece na forja do Ferreiro, sobre um equipamento real da ficha.'
    ]
  },
  {
    version:'0.4.15',
    date:'2026-09-09',
    title:'Atlas do mapa, Dossiê da Região e ajustes de interface',
    notes:[
      'O mapa separa os pinos por tipo: Cidades (assentamentos), Marcos (ruínas, vulcões, bosques, pontos de interesse) e Quedas (os sítios das Grandes Quedas), que nascem ocultos; cada lugar tem "Ocultar / Mostrar no mapa".',
      'Painel Atlas à direita do mapa: árvore de regiões e locais, liberação em massa e atalhos para focar, liberar e ocultar.',
      'O detalhe da região virou um Dossiê: cidades por camada, fauna, ameaças por habitat, missões abertas, NPCs conhecidos, NPCs pelo território e rumores liberáveis um a um.',
      'Cartão de NPC não quebra mais o texto na vertical e o papel pode ser trocado direto no cartão.',
      'O selo "!" das etapas de criação só aparece depois de visitar a etapa pelo menu.',
      'Clicar num pino do mapa mostra a descrição ao lado do mapa.',
      'A forja lista o equipamento do personagem para escolher o item base sem arrastar, com botão para remover o base.'
    ]
  },
  {
    version:'0.4.13',
    date:'2026-09-09',
    title:'Geração contextual, cartões de NPC e bancada de forja',
    notes:[
      'A auditoria regional envia região, local, arquétipo e prompt completos para a macro configurada, com ações para gerar cinco ou todas as lacunas.',
      'Monstros também recebem um escopo de geração baseado nos filtros ativos, sem incluir macro ou chave no módulo.',
      'NPCs ganharam cartões reorganizados, contorno por cidade ou região, indicação de errante e controle de visibilidade limitada do token.',
      'NPCs, monstros, itens de compêndio, estoques e contratantes de quests compatíveis podem ser arrastados para cenas, fichas e diálogos.',
      'A bancada de forja separa dois prefixos e dois sufixos, mostra o nome mágico em tempo real, efeitos, fragmentos, saldo e a quebra do custo.'
    ]
  },
  {
    version:'0.4.12',
    date:'2026-09-09',
    title:'Mapa vivo, NPCs regionais, tokens e forja',
    notes:[
      'NPCs ficaram mais compactos, arrastáveis e fáceis de editar, com papéis coloridos, região, vínculos sugeridos pela biografia e cobertura regional.',
      'O mapa ganhou pinos reposicionáveis, camadas de regiões e cidades, cores das pastas do Foundry e liberação em massa.',
      'Imagens agora podem vir de uma pasta da mesa, por convenção de nomes ou por um arquivo quedaco-imagens.json, sem incluir artes do livro no módulo.',
      'A ferramenta local de tokens casa fichas com o índice do pacote sem publicar os arquivos de imagem.',
      'Mercadores típicos recebem estoque de compêndio conforme a localidade.',
      'Ferreiros liberados oferecem uma forja completa: equipamento próprio, sigilos nativos do Skyfall, material, imbuência, fragmentos, preço e pagamento.',
      'A interface usa a nova logo horizontal do QUEDAÇO e corrige checkboxes de monstro e enquadramento das imagens de quests.'
    ]
  },
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
