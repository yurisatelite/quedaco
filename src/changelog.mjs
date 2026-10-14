export const CHANGELOG = [
  {version:'0.18.0',date:'2026-10-14',title:'Cadastros compartilhados do mundo',notes:[
    'A Mestra pode cadastrar e editar regiões, localidades, tags e perfis de clima na aba Módulos, preservando IDs e vínculos ao inativar entradas.',
    'API pública de catálogo com aliases, hierarquia validada, revisão e eventos de sincronização. Os cadastros alimentam NPCs e Mapa Imersivo.',
    'Integrações opcionais para Jornal, Tabelas e Explorador; climas são perfis configuráveis, sem efeitos mecânicos automáticos.',
    'Corrigida a identidade do protocolo: family permanece a string quedaco e o registro passa a se chamar familyRegistry.'
  ]},
  {
    version:'0.17.0',
    date:'2026-10-13',
    title:'Protocolo de Integração QUEDAÇO v1 completo',
    notes:[
      'ID do módulo: quedaco. contractVersion: 1.',
      'Capabilities publicadas: npcDatabase, regionDatabase, campaignPanel, familyRegistry, explorerCatalog e npcLocation.',
      'Métodos públicos: open, getStatus, openCampaign, listNpcs, listRegions, getExplorerCatalog, setNpcExplorerLocation e family (list, open, withCapability).',
      'Integrações opcionais são reconhecidas por quedaco:register. O painel de campanha, mapas, localidades e NPCs continuam disponíveis sem módulos satélites.'
    ]
  },
  {
    version:'0.16.0',
    date:'2026-10-13',
    title:'Módulos QUEDAÇO independentes e teia de integrações',
    notes:[
      'O QUEDAÇO principal não pede mais os módulos satélites como recomendações de instalação: Calendário, Explorador, Tabelas, Jornal, Personagens e outros podem funcionar sozinhos.',
      'A documentação ganhou a Teia de Módulos QUEDAÇO, um cadastro visual para acompanhar os módulos, capacidades e integrações opcionais.',
      'O reconhecimento continua sendo feito somente pela API pública do Protocolo de Integração QUEDAÇO, sem importar arquivos de outro módulo.'
    ]
  },
  {
    version:'0.15.0',
    date:'2026-10-13',
    title:'Família QUEDAÇO: o painel reconhece os módulos satélites',
    notes:[
      'Nova aba Módulos (só da Mestra): mostra quais módulos da família QUEDAÇO estão ativos (Calendário, Explorador, Tabelas, NPCs de venda, Personagens, Jornal da Queda), o que cada um oferece e abre a interface deles.',
      'O QUEDAÇO passa a seguir o Protocolo de Integração (contrato v1) e oferece aos satélites o catálogo de regiões/locais e a atribuição de NPCs a áreas do Explorador (checada pela Mestra).',
      'Cada módulo continua funcionando sozinho; nada é importado de outro módulo.'
    ]
  },
  {
    version:'0.14.0',
    date:'2026-10-13',
    title:'Integração regional de NPCs com o Quedaço - Tabelas',
    notes:[
      'O QUEDAÇO agora oferece aos módulos satélites uma consulta somente-leitura dos NPCs e das regiões registrados.',
      'O Quedaço - Tabelas pode montar tabelas regionais vinculadas às fichas originais, sem duplicar Actors nem alterar NPCs.'
    ]
  },
  {
    version:'0.13.0',
    date:'2026-10-11',
    title:'Criador de personagens passa a ser um módulo separado',
    notes:[
      'O QUEDAÇO principal agora cuida somente da campanha: Mapa Imersivo, Cena Atual, NPCs, guildas, monstros, itens, imbuir e quests.',
      'A criação de personagens saiu do Diretório de Atores e das abas do painel. Ela passa a ser oferecida exclusivamente pelo módulo “QUEDAÇO - Personagens Skyfall RPG”, no topo do Chat.',
      'O botão de controle de cena continua abrindo o painel de campanha; para jogadores, ele abre a parte compartilhada do mapa.'
    ]
  },
  {
    version:'0.12.0',
    date:'2026-10-04',
    title:'Banco de mapas reaproveita os fundos já vinculados',
    notes:[
      'O Banco de mapas ganhou o botão “Registrar fundos das cenas vinculadas”. Ele encontra, por localidade, o fundo que uma cena já vinculada ao Mapa Imersivo usa de verdade e mostra uma prévia antes de gravar.',
      'Você pode desmarcar qualquer localidade antes de aplicar. A operação registra somente os caminhos marcados no Banco de mapas, em uma única gravação; não cria, move ou edita cenas.',
      'Uma escolha de arquivo feita manualmente continua protegida: o registro automático não a substitui. Isso facilita completar Thur Thur com os sete mapas que já existem no mundo.'
    ]
  },
  {
    version:'0.11.0',
    date:'2026-10-03',
    title:'Thur Thur vira o foco ativo da campanha',
    notes:[
      'O QUEDAÇO passa a abrir concentrado em Thur Thur: NPCs, regiões e localidades das demais partes de Opath ficam ocultos, mas nenhuma ficha, cena ou vínculo é apagado.',
      'A P.I.P.I. continua protegida. Dez guildas sorteadas permanecem visíveis, e a criação de personagem mostra quatro legados: Walshie, Tôra, Gnomo e Urodelo.',
      'O Mapa Imersivo, o mapa geográfico e o banco de mapas passam a trabalhar com as sete localidades de Thur Thur. Mapas internos continuam aparecendo, e o botão Mostrar tudo temporariamente restaura a visão completa.'
    ]
  },
  {
    version:'0.10.0',
    date:'2026-09-22',
    title:'Mapa Imersivo montado como quebra-cabeça, aba Cena Atual e monstros com ficha de campo',
    notes:[
      'O Mapa Imersivo agora abre num quebra-cabeça por região: cada local e cada cena é uma caixa, ligada à região e ao local onde fica; teletransporte aparece como linha tracejada. Arraste as caixas pra onde quiser — a posição fica guardada. Solte uma cena "sem local" em cima de uma caixa pra colocá-la ali dentro, ou crie uma caixa nova direto no quadro. "Reorganizar caixas" volta ao arranjo inicial. A lista de antes continua, na sub-aba Lista.',
      'Nova aba Cena Atual, fora do Mapa: a cena ativa no centro de um diagrama com as cenas ligadas a ela (portais, o mapa onde ela fica e os mapas internos), clicáveis; os NPCs da região organizados por local, com o local atual marcado; e, como antes, guildas presentes, mercadores com atitude, rumor da região e o botão de liberar a localidade.',
      'Mapa Imersivo mais calmo: as regiões e locais começam fechados e lembram o que você abriu; a cena com o mesmo nome do local aparece como "Mapa: <nome>"; cena apagada no Foundry sai do mapa sozinha (e uma entrada antiga quebrada ganha o botão "Remover esta entrada"); miniaturas já vêm ligadas; Mapa Imersivo é a primeira aba.',
      'Quem usa o módulo World Explorer ganha um botão "Mapa de exploração" no Mapa Imersivo e na Cena Atual, com quantos hexágonos já foram revelados. Sem o módulo ativo, o botão não aparece.',
      'Monstros convertidos de D&D ganham biografia em ficha de campo: habitat em Opath, temperamento (tirado da tendência da criatura, sem nomes do cenário de origem), táticas montadas a partir dos próprios ataques e traços, e espaço para aparência, comportamento, o que quer e ganchos. O texto original fica recolhido no fim, só pra consulta.'
    ]
  },
  {
    version:'0.9.0',
    date:'2026-09-17',
    title:'Mapa Imersivo, monstros de outros jogos chegando completos, e um mestre com menos ruído na tela',
    notes:[
      'O antigo "Atlas de cenas" virou o Mapa Imersivo. Quando uma cena está ativa, um painel no topo da aba Mapa junta tudo daquele lugar: os NPCs, as guildas presentes, os mercadores com a atitude de cada um (trocável na hora), um botão pra rolar um rumor da região, e um botão pra liberar a localidade aos jogadores.',
      'Ao ativar uma cena cuja localidade ainda não foi liberada, o módulo pergunta antes de liberar. Uma opção nas configurações desliga essa pergunta.',
      'Monstros importados de D&D chegam muito mais completos: tamanho certo, os testes de resistência da própria ficha (não mais um palpite), perícias, idiomas quando existe equivalente, resistências e imunidades, os traços da criatura, a magia inata com limite de uso, o Ataque Múltiplo, e a hierarquia/arquétipo (Chefão, Bruto, Líder...) do jeito que uma ficha nativa do Skyfall mostra. O alcance dos ataques corpo a corpo também estava saindo errado — corrigido.',
      'Nova aba "Conferência da região" no painel da Mestra: lista quem ainda falta pra uma região servir de modelo — NPC sem legado, herança, local ou guilda, retrato provisório, mercador sem estoque, localidade sem cena, cena fora do Mapa Imersivo, ou localidade sem gancho de rumor. Cada item tem um atalho pra resolver.',
      'A aba Monstros ganhou filtro por região de Opath (e "Além de Opath"), com a localização marcada no cartão e na ficha de cada ameaça do livro.',
      'Telas de NPCs, Guildas, Monstros e Itens ficaram mais limpas: pesquisa e filtro agora têm rótulo próprio e ordem clara, e sumiram os avisos que só faziam sentido durante a criação da mesa (cobertura regional de NPCs, importação de guildas já concluída, instrução de onde colocar imagem no mapa).',
      'Corrigido: o console enchia de erros 404 ao abrir a aba Itens, procurando imagem que não existia. A Mestra agora pode reindexar as imagens da mesa com um botão, e o módulo só oferece o que realmente está lá.'
    ]
  },
  {
    version:'0.8.0',
    date:'2026-09-17',
    title:'Guildas em jogo, NPC conhecido que não some e um cartão de NPC só em todo lugar',
    notes:[
      'A aba Guildas ganhou duas abas: Em jogo e Guardadas. As guardadas saem do caminho com ficha, lema e selos intactos, e um clique em "Pôr em jogo" traz de volta. A guilda da mesa — a que tem ficha de jogador entre os membros — ganha o selo ★ da mesa e não tem botão de guardar, pra não ir embora por engano.',
      'Liberar uma região agora só conta aos jogadores que ela existe. As localidades, os NPCs, as cenas, o governo e o dossiê continuam fechados até você liberar cada um.',
      'NPC que o grupo já conheceu não some mais quando você fecha a localidade dele: fica na aba dos jogadores em cinza, sem loja, venda nem botões. Reabrir o lugar devolve o cartão completo.',
      'A aba Mapas passou a usar o mesmo cartão de NPC das outras abas, com retrato, nível, papel, classe, legado e herança. Antes era uma lista menor, com menos informação e outro tamanho.',
      'Todo NPC mostra legado e herança em selos separados. Quando a ficha não tem um dos dois, o selo diz "sem herança" — pra você enxergar o buraco e corrigir.',
      'A classe do NPC aparece como a imagem do próprio item de classe do Skyfall, e não mais como uma segunda etiqueta de texto que parecia outro papel.',
      'A tag secundária que os jogadores dão aos NPCs passa a valer pela última marcação feita, aparece para todo o grupo e entra no editor do mestre.',
      'Nova opção de filtro por guilda na aba NPCs, com "Sem guilda" para achar quem ainda não foi distribuído.',
      'A lista de NPCs de cada região e localidade ganhou filtro por papel e por legado, e a imagem da localidade ficou grande de verdade.',
      'O editor de NPC mostra o selo da região, o dinheiro da ficha nas três moedas dentro do inventário, e o seletor de mapa oferece só as cenas de localidades daquela região.',
      'O filtro de selos das guildas usa ícone colorido: o mesmo dragão para as Dragonesas, com cor por Corte; gema para os Necários. O Dragão Prateado aparece marcado como caseiro, pra não ser confundido com conteúdo do livro.',
      'A aba Monstros virou uma lista alfabética só, com um selo dizendo se a criatura é Oficial do livro ou Adaptada — antes os convertidos ficavam todos no fim.',
      'Cada monstro e item tem um único botão "Abrir no Foundry", no documento principal. Antes o mesmo monstro aparecia duas vezes, uma no Mundo e outra no compêndio.',
      'As caixas de importar não esticam mais até a borda da tela, e nas abas Monstros e Itens os botões ficam todos na mesma linha.',
      'O regulador de miniaturas encolheu, foi para a direita e parou de mostrar o número em pixels.',
      'Corrigido: o regulador de miniaturas não funcionava na aba Guildas.'
    ]
  },
  {
    version:'0.7.0',
    date:'2026-09-14',
    title:'Preço em três moedas, carrinho de compras, venda pra qualquer NPC e atitude editável na hora',
    notes:[
      'Preço agora aparece nas três moedas do livro em vez de um número gigante: uma armadura de placas deixa de ser "T$ 5.000" e vira "K$ 5". Vale no cartão de item, na loja, na forja, na bancada de imbuir e no inventário do NPC.',
      'O cartão de item ficou legível de longe: cada categoria tem cor e ícone próprios numa faixa lateral, as propriedades (dano, RD, alcance, volume, cargas…) viraram uma gradinha só com o que o item realmente tem, e o preço subiu pro cabeçalho.',
      'Os descritores viraram selos coloridos — QUEBRADIÇO em vermelho, pesada e barulhenta em âmbar — pra o jogador ver o problema antes de comprar, não depois.',
      'A loja ganhou carrinho: "Adicionar" no lugar de "Comprar", com o total da visita inteira à vista antes de pagar e a bolsa do personagem do lado. O botão de fechar só acende se o dinheiro cobre.',
      'O preço de cada linha já aparece cotado, com o valor de tabela riscado ao lado quando a atitude do mercador ou uma condição da ficha mudaram a conta.',
      'A pechincha continua valendo uma vez por visita e agora cobre o carrinho inteiro — é a mesma conversa, não uma por item.',
      'Fechar o carrinho é tudo ou nada: se faltar dinheiro ou sumir estoque no meio, a moeda volta, os itens já entregues são recolhidos e o estoque do mercador volta ao que era. Nada de meia compra.',
      'Qualquer NPC liberado passa a comprar do grupo, tenha ou não loja montada: um botão "Vender pra ele" abre a lista dos seus itens com o que ele paga por cada um. Continua valendo a metade do preço do livro, e o preço cheio com Crime que Compensa.',
      'A atitude do mercador virou um seletor do tamanho de um selo dentro do "Ver como jogador": você troca de hostil pra aliado vendo a mesma tela que o grupo vê, e o preço muda na hora, sem abrir a ficha.',
      'Do lado da atitude, só pro mestre, aparece a biografia do NPC — pra lembrar o porquê da hostilidade na hora da cena.',
      'Cada moeda ganhou a cara da região, como o livro descreve: em Thur Thur o Trocado traz uma luva, a Pila uma águia e o Kurmac um urso. O valor é igual em toda Opath; muda só o desenho.',
      'Corrigido: comprar numa loja liberada por localidade era recusado com "Esta loja não está disponível" — o cartão aparecia e o botão não funcionava.',
      'Corrigido: o regulador de tamanho das miniaturas só mexia na primeira grade da tela, então a aba de NPCs agrupada por local ficava pela metade.',
      'Corrigido: encolher o cartão de NPC só o estreitava, e o texto quebrava letra por letra. O retrato passa a acompanhar o tamanho do cartão.',
      'Corrigido: os filtros de Monstros usavam nomes inventados de deslocamento (Terrestre/Aquático/Aéreo) em vez dos do sistema — Escalada e Escavação nem apareciam. O filtro chamado "Porte" na verdade mostrava a Hierarquia, e "Gosma" aparecia como "Monstro".',
      'Corrigido: liberar um NPC pelo olho do cartão não soltava a permissão de leitura da ficha, então o jogador não recebia nada mesmo com o módulo dizendo "liberado".',
      'Corrigido (importante): como "Militar" não tinha mais campo visível no editor, salvar um NPC apagava a marca de Militar dele, em silêncio, toda vez.'
    ]
  },
  {
    version:'0.6.0',
    date:'2026-09-12',
    title:'Vendinhas com negociação, cartão de NPC repaginado e rumores que usam a sua gente',
    notes:[
      'O cartão de NPC foi repaginado: o retrato agora ocupa a altura toda do cartão, em pé, recortado no rosto — e nome, nível, localidade, tags e botões ficam todos à direita.',
      'A classe do NPC ganhou ícone e cor próprios, no cartão e na tela de edição: escudo pro Combatente, olho pro Especialista, chapéu pro Ocultista.',
      'Humani agora mostra a melancolia — M\'bo ou Kia — no lugar do nome comprido da herança.',
      'Os jogadores podem marcar a segunda tag de cada NPC ("o que essa pessoa é?") conforme vão conhecendo gente. O que você marcar vale mais que o deles.',
      'Dá pra esconder um NPC específico da visão dos jogadores sem precisar fechar a região inteira: é o olho no cartão, dentro do "Ver como jogador".',
      'A tela de edição passou a mostrar o inventário do NPC lido direto da ficha, com os itens e o dinheiro somado.',
      'Trilha, Antecedente, Legado e Classe mostram a descrição ao passar o mouse, sem precisar abrir a ficha.',
      'A busca passou a achar nome com pontuação: digitar "pipi" encontra a P.I.P.I. As guildas também saem em ordem alfabética.',
      'O seletor de mapa/cena some quando a região não tem cena nenhuma vinculada, e passou a oferecer também a cena da cidade do próprio NPC.',
      'A imagem da região ou cidade ficou grande de verdade, em vez de uma faixa fina com a tela vazia embaixo.',
      'Negociação de preço entrou no módulo, seguindo o livro: cada mercador tem uma atitude com o grupo (hostil, negativo, indiferente, prestativo ou aliado) que mexe no preço, e você ajusta o quanto ela pesa.',
      'O módulo lê a ficha de quem está comprando e aplica sozinho o que o livro concede — Artimanha de Diplomacia, "Na minha mão é mais barato!" e Crime que Compensa — sempre avisando na tela o que entrou na conta e o que ficou de fora.',
      'Pechinchar virou um botão na loja: rola CAR contra a Proteção de CAR do vendedor uma vez por visita, como o livro descreve, e o desconto vale enquanto o grupo estiver ali.',
      'Arma, armadura ou escudo comprado pelo Crime que Compensa já nasce com o descritor QUEBRADIÇO do próprio sistema Skyfall, sem precisar marcar na mão.',
      'A loja do NPC ganhou controle de verdade: preço, quanto tem, capacidade e quanto está faltando, com botões de mais e menos por item, repor tudo e sugerir estoque pela localidade.',
      'A tabela de rumores voltou a funcionar: além dos que você escreve, o 1d4 sorteia entre doze ganchos montados na hora com os nomes e lugares reais daquela região. Gostou de um? Dá pra guardar como rumor de verdade.'
    ]
  },
  {
    version:'0.5.0',
    date:'2026-09-12',
    title:'Aba de NPCs dos jogadores, monstros importados na lista e acabamento dos cartões',
    notes:[
      'A aba NPCs dos jogadores deixou de ser uma lista corrida: agora abre por região, mostrando só onde o grupo já conheceu alguém, e dentro dela os NPCs ficam agrupados por cidade ou local.',
      'Liberar NPC virou coisa de localidade: você abre a região (ou só um local) e todo mundo que mora lá aparece pro grupo de uma vez, com a permissão de leitura concedida junto. Liberar um NPC específico continua funcionando por cima disso.',
      'Cada jogador ganhou um espaço de anotação por NPC e escolhe se divide com o grupo. O mestre lê todas, inclusive as que não foram divididas.',
      'A guilda do grupo aparece num banner no topo da aba, com a logo e um atalho que abre a ficha direto.',
      'O mestre ganhou um "Ver como jogador" pra conferir a aba sem trocar de conta.',
      'Monstros importados de D&D 5e (ou criados por você) agora aparecem na aba Monstros junto dos do livro e podem ser tagueados por região e local, entrando no dossiê de ameaças de cada região.',
      'Legado e herança aparecem no cartão do NPC e viraram filtro — dá pra procurar, por exemplo, só os elfes da Corte do Outono.',
      'Cartão de NPC: o botão de liberar não fica mais por cima do selo de localidade, o contorno serrilhado virou sólido e a altura fixa que deixava espaço sobrando saiu. Mercadores e ferreiros não esticam mais a linha inteira da grade.',
      'O editor de NPC abre logo abaixo do cartão em vez de no fim da lista inteira, e o campo Nome voltou a funcionar (a edição era descartada ao sair do campo).',
      'O seletor de Local passou a mostrar só os locais da região escolhida, separados entre cidades principais e outros locais.',
      'Régua nova pra aumentar e diminuir as miniaturas nas abas Monstros, Itens, Guildas e NPCs.',
      'Os botões de exportar voltaram a baixar arquivo: o Foundry 13 removeu a função que eles usavam e eles falhavam calados.'
    ]
  },
  {
    version:'0.4.33',
    date:'2026-09-11',
    title:'Monstro de D&D não herda mais a arte de referência como token',
    notes:[
      'A imagem do JSON (img_url) virava retrato e token ao mesmo tempo — como geralmente é uma arte de referência com fundo próprio (não recortada), ficava com um quadrado feio de fundo no token. Agora só vira retrato; o token nasce com o ícone padrão do Skyfall até você trocar por um token de verdade.'
    ]
  },
  {
    version:'0.4.32',
    date:'2026-09-11',
    title:'Corrige a caixa de importar D&D 5e ficar vazia bem na hora do clique',
    notes:[
      'Achado o bug de verdade por trás do "nada acontece" ao converter monstro/item de D&D: clicar no botão tira o foco da caixa de texto primeiro, o que disparava uma re-renderização geral da tela — e como o texto colado nunca ficava guardado em lugar nenhum, a caixa voltava vazia bem antes do clique processar. Agora as caixas de colar/texto livre (importar monstro, item, guilda; adicionar rumor; anotação de mapa) não re-renderizam ao perder o foco.'
    ]
  },
  {
    version:'0.4.31',
    date:'2026-09-11',
    title:'Log de diagnóstico visível por padrão',
    notes:[
      'A 0.4.30 usava console.debug — o Chrome esconde esse nível por padrão no Console, então o log de diagnóstico não aparecia mesmo funcionando. Troca pra console.log, que sempre aparece.'
    ]
  },
  {
    version:'0.4.30',
    date:'2026-09-11',
    title:'Log de diagnóstico no clique dos botões',
    notes:[
      'Sem mudança visível. Adiciona console.debug em cada clique de botão do QUEDAÇO e no caminho do importador de D&D 5e, pra localizar um travamento silencioso que alguns mestres relataram (nenhum erro aparecia nem no console).'
    ]
  },
  {
    version:'0.4.29',
    date:'2026-09-11',
    title:'Corrige travamento com compêndio lento ou fora do ar',
    notes:[
      'A aba Monstros (e a leitura de selos das Guildas) varria os compêndios instalados sem limite de tempo. Se um único compêndio de outro módulo não respondesse, o painel travava por completo — nenhum botão do QUEDAÇO reagia, sem erro nenhum no console. Agora cada compêndio tem 8s de prazo; se estourar, ele entra na lista de falhas e o resto continua normal.'
    ]
  },
  {
    version:'0.4.28',
    date:'2026-09-11',
    title:'Republicação da 0.4.27',
    notes:[
      'A 0.4.27 não apareceu como atualização disponível pra alguns mestres. Sem mudança de código — só nova versão e novo pacote pra forçar o Foundry a detectar a atualização.'
    ]
  },
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
