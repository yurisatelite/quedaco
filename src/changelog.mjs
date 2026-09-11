export const CHANGELOG = [
  {
    version:'0.4.27',
    date:'2026-09-10',
    title:'Região vira painel, monstros com localidade e importador de itens D&D',
    notes:[
      'Nova visão de Região: clique em "Abrir região" no Mapa e a região assume a tela — foto grande fixa (com lápis pra trocar), carrossel dos mapas vinculados (com "Todos"/"Sem cena" e busca por papel), lista de NPCs com imagem e tags como na aba NPCs (cada linha escolhe o mapa do NPC na hora), abas de Rumores (com "Sortear 1d4" e edição) e Mapas e cenas (vincular, ver as cenas por pasta do Foundry, anotação por mapa).',
      'Conserta o importador de D&D 5e: colar um JSON com vírgula sobrando antes de "]" (como o statblock do Aboleth copiado do 5e.tools) fazia a importação não criar nada. Agora também aceita blocos ```json colados com a cerca.',
      'Monstros ganham localidade: cada carta tem "Onde aparece" — regiões e locais específicos, ou um toggle "aparece em qualquer lugar" pra bandidos e animais comuns, que entram automaticamente no dossiê de toda região.',
      'Aba Itens ganha o mesmo importador de D&D 5e da aba Monstros — cria o Item de Mundo (nome, categoria, imagem); preço e mecânica de dano ficam para revisão manual porque a economia do Skyfall não corresponde à de D&D.',
      'Tira a contagem "44 blocos do livro..." do topo da aba Monstros.'
    ]
  },
  {
    version:'0.4.26',
    date:'2026-09-10',
    title:'Guildas com cor, taguear tudo e fim dos erros de imagem',
    notes:[
      'A aba Guildas ficou dinâmica: cartão com barra e rótulo na cor da relação com o grupo, ícone colorido por Guilda/Hansa, chips coloridos de campo de atuação e das quatro perícias. Os selos usam a arte do compêndio do Skyfall quando existe.',
      'O botão "Taguear tudo" no painel de NPCs preenche papel, região (pela pasta) e local (pela bio) de uma vez, não só o papel.',
      'Na cobertura regional, cada arquétipo tem um "✓" para marcar como feito; o "Criar N próximos" pula os marcados.',
      'Cartões de NPC e monstro mostram a imagem própria da ficha primeiro — acaba a chuva de "404 Not Found" no console ao abrir o painel.'
    ]
  },
  {
    version:'0.4.25',
    date:'2026-09-10',
    title:'Importar monstros em lote e conserto dos filtros de Guilda',
    notes:[
      'A aba Monstros importa D&D 5e em escala: cole a lista [ ... ] inteira (formato 5e.tools ou Open5e). Cria numa pasta própria, em blocos, pulando nomes que já existem, e puxa a imagem do bicho quando o JSON traz.',
      'Filtros das Guildas agora funcionam de verdade (faltava um atributo no checkbox). Selo de Aprovação e Mecenas viraram filtros separados; as facetas ficaram compactas e com ícones.',
      'Cartão de guilda usa ícone — bandeira para Hansa, marco para Guilda — no lugar da foto, com miniaturas de selo (o nome aparece ao passar o mouse). "Abrir ficha" da guilda funciona.',
      'Membro de guilda = ficha de personagem (jogador ou NPC); ficha de monstro não conta. A barra de abas do topo voltou a mostrar as caixas.',
      'Botão "Gerar NPCs" avulsos no painel de NPCs: gera N habitantes de uma vez para depois distribuir.'
    ]
  },
  {
    version:'0.4.24',
    date:'2026-09-10',
    title:'Estrutura das Guildas e auto-tag de NPCs',
    notes:[
      'Membro de guilda passa a ser só ficha de jogador — NPCs e monstros não contam mais. O nível da guilda é o do jogador-membro de maior nível (mínimo 2), calculado na hora e mantido em sincronia com a ficha do sistema.',
      'Novo botão "Taguear pela bio" no painel de NPCs: deduz o papel (Diplomata, Guarda, Clero, Ferreiro, Mercador, Espião…) do texto da biografia. "Re-taguear todos" força a reclassificação.'
    ]
  },
  {
    version:'0.4.23',
    date:'2026-09-10',
    title:'Filtros das Guildas e barra de abas com ícones',
    notes:[
      'A aba Guildas ganhou filtros: Tipo (Guilda/Hansa), Selo de Aprovação / Mecenas, Campo de atuação (Comércio, Contrabando, Informação, Militar, Arcano, Marítimo), Relação com o grupo e Liberada aos jogadores, além de busca por nome, criador e descrição. A relação (Aliada, Neutra, Rival, Hostil, Desconhecida) é escolhida no próprio cartão.',
      'A barra de abas do topo agora tem ícones e divisórias, e "Criação de Personagens" foi para o fim.',
      'O sorteio de nível dos NPCs agora grava de verdade (era feito em paralelo e às vezes não salvava) e alcança quem estava no nível 0 ou 1. Botão extra "Sortear todos" para re-sortear.'
    ]
  },
  {
    version:'0.4.22',
    date:'2026-09-10',
    title:'Guildas, imbuir na própria ficha, mapa de Quedas e imagens sem piscar',
    notes:[
      'Nova aba Guildas e Hansas: lista as fichas nativas do Skyfall (tipo guild), importa as do Apêndice B colando o JSON, e cada NPC pode ser vinculado a uma guilda da mesa. O dossiê da região mostra "Guildas presentes".',
      'A aba Imbuir agora tem uma bancada de verdade: escolhe um equipamento da sua ficha, os sigilos e clica em "Imbuir por T$ N" — sem precisar de um NPC Ferreiro. O custo é explicado: paga-se por sigilo e cada sigilo a mais no mesmo item custa mais caro.',
      'A camada "Quedas" do mapa agora mostra os sítios das Grandes Quedas (antes ficavam sempre ocultos). Os dois botõezinhos de cada local no Atlas viraram ícones claros: olho = liberar no mapa, alfinete = mostrar/ocultar o pino.',
      'As miniaturas dos itens voltaram e as imagens de monstro não "piscam" mais: menos tentativas de arquivo e memória dos caminhos que já falharam.',
      'Botão para sortear um nível aleatório aos NPCs que estão sem nível (nunca mexe em fichas de jogador).',
      'Editor de NPC: retrato grande da ficha, lista de locais em ordem alfabética e a região trava no valor do local escolhido.'
    ]
  },
  {
    version:'0.4.21',
    date:'2026-09-10',
    title:'Cartão de NPC mínimo e sobrecarga arcana automática',
    notes:[
      'O cartão de NPC agora tem só o essencial: tipo, local, nível e "Editar". "Liberar aos jogadores" virou o ícone de olho no canto superior. PV, PE, Pontos de Sombra e as fichas de Legado, Herança, Classe, Trilha, Maldição e Antecedente foram para dentro de "Editar".',
      'Sobrecarga arcana: ao equipar um item cujos sigilos passam do limite de Fragmentos Arcanos do portador, o QUEDAÇO rola Nd6 de dano Energético e aplica na ficha — o sistema base só exibia um aviso. Dá para desligar em Configurações do Módulo.',
      '"Liberar tudo deste local" e "Liberar tudo da região": um clique libera o ponto no mapa, os NPCs de lá e as ameaças marcadas na região.',
      'Cada região aceita várias cenas vinculadas: no dossiê da região, escolha quantas cenas quiser; os jogadores ganham um botão "Abrir" para cada uma quando a região está liberada.',
      'Importar criatura de D&D 5e: na aba Monstros, cole o JSON do Open5e / 5e.tools ou o texto do bloco de status e o QUEDAÇO cria uma ficha npc do Skyfall na escala de ND (máx. 12 ≈ CR 20). Atributos e deslocamento saem convertidos; PV, RD e ataques ficam estimados e anotados na biografia para revisar.',
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
