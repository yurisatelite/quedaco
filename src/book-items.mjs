// Catálogo de consulta, sem criar nem modificar Items do Foundry.
// Valores transcritos das tabelas; descrições resumidas para consulta rápida.
const rows=[];
function add(category,page,entries){for(const [name,price,volume,summary,extra={}] of entries)rows.push({name,category,page,price,volume,summary,...extra});}
const w=(damage,descriptors,range=null)=>({damage,descriptors,range});
add('Armas simples',222,[
 ['Adaga',2,1,'Lâmina pequena para combate próximo e arremesso.',w('1d4','Perfurante, arremessável, leve',9)],
 ['Ataque desarmado',null,null,'Referência de golpes sem arma; não é um item de compra.',{...w('1d3','Contundente, leve'),referenceOnly:true}],
 ['Clava',null,2,'Bastão pesado de impacto.',w('1d6','Contundente')],
 ['Bastão curto',null,1,'Vara curta para golpes e defesa.',w('1d4','Contundente, leve')],
 ['Besta leve',35,2,'Besta portátil com recarga por ação bônus.',w('1d6','Perfurante, disparável, recarregável (1 B)',18)],
 ['Foice',4,1,'Lâmina agrícola curva adaptada ao combate.',w('1d6','Cortante, leve')],
 ['Funda',null,0,'Tira usada para lançar munição.',w('1d4','Contundente, disparável, composto, recarregável (1 L)',18)],
 ['Lança',2,2,'Haste pontiaguda que também pode ser arremessada.',w('1d6','Perfurante, arremessável',6)],
 ['Maça',12,2,'Arma de impacto com cabeça pesada.',w('1d6','Contundente')],
 ['Arco curto',30,2,'Arco de duas mãos para disparos.',w('1d6','Perfurante, disparável, recarregável (1 L)',18)],
 ['Bastão longo',null,2,'Bastão de duas extremidades utilizáveis.',w('1d6/1d8','Contundente, dupla')],
 ['Lança longa',15,2,'Lança de duas mãos.',w('1d8','Perfurante')],
 ['Tacape',null,3,'Clava grande, empunhada com duas mãos.',w('1d10','Contundente, pesada')]
]);
add('Armas marciais',224,[
 ['Espada curta',10,2,'Espada de uma mão para cortes rápidos.',w('1d6','Cortante, leve')],
 ['Espada longa',15,2,'Espada utilizável com uma ou duas mãos.',w('1d8','Cortante, versátil (1d10)')],
 ['Florete',20,2,'Lâmina fina voltada a estocadas.',w('1d6','Perfurante, leve')],
 ['Machadinha',6,1,'Machado compacto que pode ser lançado.',w('1d6','Arremessável, cortante',9)],
 ['Machado de batalha',10,3,'Machado versátil de combate.',w('1d8','Cortante, versátil (1d10)')],
 ['Mangual',8,2,'Arma de impacto articulada por corrente.',w('1d8','Contundente, superior')],
 ['Martelo de batalha',12,3,'Martelo que pode ser usado com duas mãos.',w('1d8','Contundente, versátil (1d10)')],
 ['Picareta',8,2,'Arma pontiaguda derivada de ferramenta.',w('1d6','Perfurante')],
 ['Tridente',15,2,'Lança com três pontas.',w('1d8','Perfurante, superior')],
 ['Alabarda',10,3,'Haste longa combinando corte e estocada.',w('1d10','Cortante, alongada, pesada')],
 ['Arco longo',100,3,'Arco de duas mãos com aplicação de força no dano.',w('1d8','Perfurante, composto, disparável, recarregável (1 L)',18)],
 ['Besta pesada',50,2,'Besta de duas mãos com recarga por ação.',w('1d10','Perfurante, disparável, recarregável (1 A)',18)],
 ['Gadanho',18,3,'Grande lâmina curva de duas mãos.',w('2d4','Cortante, letal, pesada')],
 ['Lança de montaria',10,3,'Lança destinada a combatentes montados.',w('1d8','Perfurante, montada')],
 ['Machado de guerra',20,3,'Machado pesado de duas mãos.',w('1d12','Cortante, pesada')],
 ['Martelo de guerra',22,3,'Martelo pesado de duas mãos.',w('1d12','Contundente, pesada')],
 ['Montante',50,3,'Espada grande para uso com duas mãos.',w('2d6','Cortante, pesada')]
]);
add('Armas de fogo',225,[
 ['Pistola de duelo',90,1,'Arma de fogo de uma mão.',w('2d4','Perfurante, disparável, recarregável (1 A)',9)],
 ['Revólver',250,1,'Arma de uma mão com quatro disparos antes da recarga.',w('2d6','Perfurante, disparável, recarregável (4 A+B)',18)],
 ['Canhão de chão',450,4,'Arma de grande calibre de duas mãos.',w('2d10','Perfurante, disparável, letal, recarregável (1 A+B)',18)],
 ['Escopeta',600,3,'Arma de duas mãos que pode atingir alvos adjacentes.',w('2d8','Perfurante, disparável, espalhafatosa, recarregável (1 A)',9)],
 ['Rifle',750,3,'Arma longa para tiros de precisão.',w('2d8','Perfurante, disparável, preciso, recarregável (1 A)',18)]
]);
add('Armas regionais',226,[
 ['Bumerangue',10,1,'Arma de arremesso que retorna ao portador.',w('1d8','Contundente, arremessável, leve, retornável',18)],
 ['Chicote',2,1,'Arma flexível com alcance ampliado.',w('1d6','Cortante, alongada, leve')],
 ['Leque',100,1,'Leque com lâminas ocultas.',w('1d4','Cortante, eficiente (Manipulação e Malandragem), leve')],
 ['Lâmina retrátil',35,1,'Lâmina escondida para ataques discretos.',w('1d6','Cortante, leve, letal')],
 ['Piolet',100,1,'Ferramenta de escalada utilizada como arma.',w('1d6','Perfurante, eficiente (Preparo Físico), leve')],
 ['Sabre flexível',60,2,'Espada flexível para estocadas.',w('1d8','Perfurante, leve, superior')],
 ['Yedo',100,2,'Espada tradicional de Tatsumari.',w('1d8','Cortante, leve, versátil (1d10)')],
 ['Foice e corrente',25,3,'Arma dupla com foice ligada a corrente.',w('1d6/1d8','Cortante, arremessável, dupla, leve, retornável, superior',6)],
 ['Wol-do',150,4,'Haste de duas mãos com lâmina curva.',w('2d6','Cortante, alongada, letal, leve')]
]);
add('Armaduras e escudos',228,[
 ['Armadura acolchoada',5,1,'Proteção leve de enchimento.',{reduction:1,descriptors:'Leve, barulhenta'}],
 ['Armadura de couro',20,2,'Proteção leve com reforços de couro.',{reduction:1,descriptors:'Leve'}],
 ['Armadura de couro batido',45,3,'Proteção leve com reforços metálicos.',{reduction:2,descriptors:'Leve'}],
 ['Cota de malha',40,3,'Proteção pesada de anéis metálicos.',{reduction:3,descriptors:'Pesada, barulhenta'}],
 ['Armadura lamelar',100,4,'Proteção pesada de placas pequenas sobrepostas.',{reduction:3,descriptors:'Pesada'}],
 ['Armadura de talas',350,7,'Proteção pesada com talas metálicas.',{reduction:4,descriptors:'Pesada, barulhenta'}],
 ['Armadura de placas',1500,9,'Proteção pesada que cobre o corpo com placas.',{reduction:5,descriptors:'Pesada, barulhenta'}],
 ['Escudo leve',10,2,'Proteção empunhada de couro reforçado; também pode funcionar como arma.',{reduction:1,damage:'1d4',descriptors:'Contundente, leve (como arma)',note:'A tabela de armas (p. 224) indica T$ 5; a tabela de escudos (p. 228), T$ 10. Conferir com a mestre antes de comprar.'}],
 ['Escudo pesado',20,3,'Proteção empunhada metálica; também pode funcionar como arma.',{reduction:2,damage:'1d6',descriptors:'Contundente, pesado (como arma)',note:'A tabela de armas (p. 224) indica T$ 15; a tabela de escudos (p. 228), T$ 20. Conferir com a mestre antes de comprar.'}]
]);
add('Equipamentos',231,[
 ['Aríete portátil',4,3,'Concede vantagem em FOR ao arrombar portas.'],
 ['Armadilha de caça',5,3,'Armadilha de pressão presa a uma corrente; preparo com ação, ataque +3 contra DES e dano 1d4 perfurante. Libertação: ação e FOR 13; falhar causa 1d4 perfurante.',{page:232}],
 ['Bolsa para componentes',25,1,'Guarda componentes de magia, exceto os que tenham custo indicado na própria magia.'],
 ['Cadeado',10,1,'Inclui chave; abrir sem ela exige DES 15.'],
 ['Caixa para fogo',1,1,'Acende tocha com uma ação; preparar outros fogos leva um minuto.'],
 ['Corda de cânhamo (15 m)',1,2,'Corda com 2 PV, rompida com FOR 17.'],
 ['Corda de seda (15 m)',10,1,'Corda mais leve, com 2 PV e teste de FOR 17 para romper.'],
 ['Corrente (3 m)',5,2,'Corrente com 10 PV, rompida com FOR 20.'],
 ['Kit de curandeiro',5,1,'Dez aplicações; uma ação e um uso estabilizam uma criatura a 0 PV, sem teste.'],
 ['Lanterna',5,1,'Ilumina 4,5 m com luz plena e mais 9 m com meia-luz. Consome 500 mL de óleo em seis horas.'],
 ['Mochila',2,1,'Recipiente com capacidade de 8 de volume.'],
 ['Pá',2,1,'Ferramenta de escavação.'],
 ['Pé-de-cabra',2,1,'Concede vantagem em FOR quando pode funcionar como alavanca.'],
 ['Pedra de amolar',1,1,'Ferramenta para manutenção de lâminas.'],
 ['Rações (1 dia)',1,1,'Alimentos secos preparados para viagem.'],
 ['Roupas (comuns)',2,1,'Vestuário cotidiano.'],
 ['Roupas (fantasia)',5,1,'Vestuário de caracterização.'],
 ['Roupas (finas)',15,1,'Vestuário para ocasiões formais.'],
 ['Roupas (viagem)',2,1,'Vestuário de estrada.'],
 ['Saco de dormir',1,1,'Equipamento portátil para dormir.'],
 ['Tenda (para duas pessoas)',2,3,'Abrigo portátil de lona para duas pessoas.'],
 ['Tocha',2,1,'Dura uma hora: 6 m de luz plena e mais 6 m de meia-luz. Um acerto corpo a corpo com a tocha acesa causa 1 de dano ígneo.']
]);
add('Munição',231,[
 ['Flechas (20)',1,1,'Lote de munição para arcos.'],['Dardos de zarabatana (50)',1,1,'Lote de dardos para zarabatana.'],['Virotes de besta (20)',1,1,'Lote de munição para bestas.'],['Balas de funda (20)',1,1,'Lote de munição para fundas.'],['Cápsulas de Disparo (20)',10,1,'Lote de munição para armas de fogo.']
]);
add('Consumíveis',233,[
 ['Ácido',150,1,'Frasco para ataque à distância contra alvo adjacente ou a até 6 m; acerto causa 2d6 ácido.'],
 ['Antitoxina',150,1,'Protege contra efeitos venenosos e Envenenado até o final do próximo descanso.'],
 ['Antídoto',50,1,'Remove uma doença quando consumido durante um descanso.'],
 ['Fogo Kishi',100,1,'Frasco arremessado a até 6 m: DES contra DES, 1d4 ígneo e Em Chamas.'],
 ['Poção de Cura',250,1,'Recupera 2d4+2 PV.'],['Poção de Cura Maior',500,1,'Recupera 4d4+4 PV.'],['Poção de Cura Superior',1000,1,'Recupera 8d4+8 PV.'],['Poção de Cura Suprema',2500,1,'Recupera 10d4+20 PV.'],
 ['Poção de Escalada',50,1,'Concede deslocamento de escalada igual ao terrestre até o final da cena.'],
 ['Poção de Força de Gigante',900,1,'Altera FOR para +5 até o final da cena.',{aliases:['Poção de Força']}],
 ['Poção de Invisibilidade',250,1,'Torna usuário e seus pertences invisíveis até o final da cena; termina ao atacar ou conjurar.'],
 ['Poção de Resistência a Dano',250,1,'Resistência até o final da cena; tipo escolhido pela mestre ou sorteado pela tabela 3-12.'],
 ['Poção de Respirar na Água',50,1,'Permite respirar submerso até o final do próximo descanso longo.'],
 ['Poção de Simpatia Animal',50,1,'Permite conjurar Simpatia Animal sem custo de ênfase até o próximo descanso longo.'],
 ['Poção de Velocidade',900,1,'Uma ação bônus adicional até o final da cena; não acumula com Velocidade de Enoch.'],
 ['Veneno Básico',100,1,'Uma ação aplica em uma arma ou três munições. Ataque recebe Potente e 1d4 venenoso; dura até acertar ou terminar a cena.'],
 ['Veneno de Serpente',2000,1,'Segue o veneno básico, com 3d6 de dano venenoso.'],
 ['Veneno de Serpe Silvestre',12000,1,'Segue o veneno básico, com 7d6 de dano venenoso.'],
 ['Veneno de Lótus Selvagem',20000,1,'Segue o veneno básico, com 12d6 de dano venenoso.']
]);
add('Serviços e transporte',235,[
 ['Hospedagem Simples',10,null,'Noite com refeição matutina e descanso longo normal.'],
 ['Hospedagem Modesta',25,null,'Descanso longo que recupera o dobro dos dados de vida.'],
 ['Hospedagem Luxuosa',100,null,'Benefícios da modesta e um ponto de catarse ao final do descanso.'],
 ['Refeição Simples',5,null,'Alimenta uma pessoa por um dia.'],['Refeição Modesta',15,null,'Refeição elaborada que alimenta uma pessoa por um dia.'],['Refeição Luxuosa',35,null,'Refeição de destaque que alimenta uma pessoa por um dia.'],
 ['Caneco de Cerveja',2,null,'Preço médio por caneco; receita e preço variam entre tavernas.'],['Drink Regional',20,null,'Preço médio de bebida típica regional.'],['Vinho (Garrafa)',100,null,'Garrafa de vinho.'],
 ['Carroça',15,null,'Capacidade de 25 de volume e duas pessoas Médias por animal de tração.'],['Cavalo',200,null,'Montaria para criaturas Médias ou menores.'],['Alpaca',150,null,'Montaria para criaturas Pequenas ou menores.'],
 ['Mensageiro',20,null,'Preço por quilômetro; leva mensagem ou até 5 de volume.'],['Passagem de Portal',20,null,'Viagem entre uma capital e Alberich.']
]);
add('Engenhocas magitec',237,[
 ['Águalin',100,1,'Purifica 2 litros por operação, até 10 litros antes da recarga em água salgada.',{aliases:['Filtro de Água de Purificação Elemental']}],
 ['Bolsão',300,2,'Dimensão portátil: capacidade de 20 de volume, com até 5 por item. Não descarrega.',{aliases:['Dimensão para Armazenamento Variável']}],
 ['Carteira',150,1,'Bolsa dimensional para moedas e gemas, com limite de K$ 10. Não descarrega.',{aliases:['Dimensão para Armazenamento de Riquezas'],note:'O exemplo da p. 237 converte K$ 10 para T$ 100.000, divergindo da conversão monetária da p. 219. Conferir antes de automatizar.'}],
 ['Lampadinha',100,2,'Iluminação fixa ajustável ao ambiente; cristal de T$ 5 ou mais recarrega por seis horas.',{aliases:['Lanterna de Cristais Reluzentes']}],
 ['Lunax',150,1,'Relógio de dias e horas, inclusive no subterrâneo. Uma hora de sol recarrega para um dia.',{aliases:['Marcador de Tempo Lunar']}],
 ['Precision T',50,1,'Termômetro para ambientes e líquidos: três medições, recarga em água gelada.',{aliases:['Termômetro de Cristal Volátil']}],
 ['Salva-Sono',50,2,'Capacete que acorda o usuário diante de um sonho ruim; um sonho muito agradável o recarrega.',{aliases:['Despertador de Sono Profundo Desagradável']}],
 ['Tá-ali!',300,1,'Bússola ligada a uma pirâmide; reunião das peças recarrega por dez dias. Permite Magitec nos testes de Navegador.',{aliases:['Ta-ali!','Bússola de Rastreamento Único']}]
]);
add('Sinapses',239,[
 ['Magia em Área (Esfera)',null,null,'Transforma a área em esfera de 3 m de raio centrada no alcance original.',{rarity:'Rara',priceFormula:'T$ 900 × limite de PE'}],
 ['Magia em Área (Cone)',null,null,'Transforma a área em cone de 9 m a partir da sinapse.',{rarity:'Rara',priceFormula:'T$ 900 × limite de PE'}],
 ['Magia em Área (Linha)',null,null,'Transforma a área em linha de 18 m a partir da sinapse.',{rarity:'Rara',priceFormula:'T$ 900 × limite de PE'}],
 ['Magia com Gatilho',null,null,'Armazena a magia até ocorrer o gatilho vocal definido na ativação.',{rarity:'Comum',priceFormula:'T$ 300 × limite de PE'}],
 ['Magia com Novo Alvo',null,null,'Redireciona a magia conforme comando vocal, mantendo o alcance.',{rarity:'Incomum',priceFormula:'T$ 600 × limite de PE'}],
 ['Magia Distante',null,null,'Dobra o alcance da magia.',{rarity:'Comum',priceFormula:'T$ 300 × limite de PE'}],
 ['Magia Permanente',null,null,'Mantém a magia enquanto a sinapse estiver ativa.',{rarity:'Muito rara',priceFormula:'T$ 1.200 × limite de PE'}],
 ['Magia Potente',null,null,'Acrescenta 3 de dano do mesmo tipo por dado de dano da magia.',{rarity:'Incomum',priceFormula:'T$ 600 × limite de PE'}]
]);
add('Materiais especiais',240,[
 ['Aço Índigo',300,null,'Sigilos aplicados ao equipamento recebem duas cargas adicionais.',{priceKind:'Acréscimo ao item base'}],
 ['Bronze Celestial',300,null,'Armas, armaduras e escudos passam a ocupar zero de volume.',{priceKind:'Acréscimo ao item base'}],
 ['Ferro Varmaniano',300,null,'Enquanto Machucado: arma recebe +1 em ataques; armadura ou escudo concede resistência necrótica.',{priceKind:'Acréscimo ao item base'}],
 ['Nácar',300,null,'Armas contam como mágicas para resistências; armaduras e escudos não penalizam a conjuração.',{priceKind:'Acréscimo ao item base'}],
 ['Obsidiana Caliginosa',300,null,'Sem pontos de sombra: arma ignora redução; armadura ou escudo concede resistência ígnea e radiante.',{priceKind:'Acréscimo ao item base'}],
 ['Ossada de Sauros',300,null,'Arma sobe uma categoria de dano; armadura ou escudo ganha +1 de redução. Volume +4, ou +2 para itens Leves e armaduras leves.',{priceKind:'Acréscimo ao item base'}],
 ['Sangue Bruto',null,null,'Enquanto Machucado: arma acrescenta o maior dado de vida ao dano; armaduras e escudos ignoram críticos.',{page:422,setting:'Sangue Macabro'}]
]);
add('Vestimentas',229,[
 ['Cabeça',null,null,'Espaço para chapéus e capacetes; não acumula benefícios de duas peças no mesmo espaço.',{referenceOnly:true}],
 ['Torso e costas',null,null,'Espaço para capas, sobretudos e tabardos.',{referenceOnly:true}],
 ['Mãos e braços',null,null,'Espaço para luvas e braceletes.',{referenceOnly:true}],
 ['Pés e pernas',null,null,'Espaço para botas, sapatos e calças.',{referenceOnly:true}],
 ['Joias',null,null,'Permite benefícios de até duas joias, como anéis, colares e brincos.',{referenceOnly:true}]
]);
add('Artefatos do Sangue Macabro',421,[
 ['Bumerangue da Dragonesa Preta (Nadja)',null,null,'Bumerangue Marcador +2; escolhe dano ácido, necrótico ou contundente ao atacar. Imbuído, três cargas recarregáveis e oito fragmentos.'],
 ['Cachimbo do Detetive (Kwame)',null,null,'Expert em investigação e interrogatório; uma carga conjura Revelar Motivação Oculta sem PE ou modificações. Duas cargas recarregáveis, seis fragmentos.'],
 ['Capa do Assassino Solitário (Echo)',null,null,'+2 em ataques; ação bônus e uma carga concedem invisibilidade até o final da cena ou terminar turno adjacente a outra criatura. Duas cargas recarregáveis, sete fragmentos.'],
 ['Disparador de Kona (Mawar)',null,null,'Chicote de Explosão de Fogo +3 que ignora redução, resistência e imunidade de dragões. Imbuído permanente, dez fragmentos.'],
 ['Escudo do Esquecido (?)',null,null,'Escudo pesado de Ossada de Sauro da Repulsão +3. Imbuído, duas cargas recarregáveis, sete fragmentos.'],
 ['Frigideira do Cozinheiro Arcano (Bufô)',null,null,'Clava de Nácar Conjuradora Ofensiva (Tufão) da Retaliação Mágica. Expert em Culinária e –2 PE para Tufão; seis cargas recarregáveis, dez fragmentos.']
]);
add('Artefatos do Sangue Macabro',422,[
 ['Kazu do Amigo Distante (Kain)',null,null,'Ação bônus e uma carga concedem um ponto de sombra temporário para a cena. Três cargas sem recarga, dez fragmentos.'],
 ['Kimono da Protetora de Sodori (Piedade)',null,null,'Armadura Completa de Bronze Celestial Protetora +2. Modifica os dados de Golpe Divino para d8 e d10; imbuído permanente, sete fragmentos.'],
 ['Lâmina de Sangue Bruto (Sylvaria)',null,null,'Espada longa de Sangue Bruto Elemental (Ácido) +3; pode ser equipada com ação livre se estiver ao alcance. Permanente, sete fragmentos.']
]);
add('Artefatos do Sangue Macabro',423,[
 ['Leque de Lâminas (Liesel)',null,null,'Leque Arremessável Retornável +2; expert em Furtividade. Alvos feridos têm desvantagem em SAB para procurar até o fim da cena. Permanente, seis fragmentos.'],
 ['Livro d’A Vida (Rainor)',null,null,'Meditação no descanso longo concede +2 CON, SAB e CAR, podendo exceder +5, até o próximo descanso longo. Permanente, dez fragmentos.'],
 ['Livro da Sombra (Temor)',null,null,'Meditação no descanso longo concede dois pontos de sombra temporários até o próximo descanso longo. Permanente, dez fragmentos.'],
 ['Máscara do Dançarino da Lua (Entsu-o)',null,null,'Veste com ação bônus; imunidade a medo e +2 às Proteções mentais. Permanente, cinco fragmentos.'],
 ['Pena Nunca-Seca (Jack)',null,null,'Uma ação e uma carga transferem um sigilo entre itens de mesma categoria. Três cargas recarregáveis, três fragmentos.'],
 ['Piolet da Exploradora Intrépida (Oriana)',null,null,'Piolet de Bronze Celestial Saltador +2; expert em Preparo Físico. Três cargas recarregáveis, sete fragmentos.']
]);
export const BASE_ITEMS=rows.map((row,i)=>({id:`book-item-${i+1}`,...row}));
export const MODIFICATION_GUIDES=[
 {id:'materials',name:'Materiais especiais',page:239,summary:'Escolha o material antes dos encantamentos. Não se aplica material a equipamento que já tenha material especial, sigilo ou fragmentos. Os seis materiais da tabela 3-16 acrescentam T$ 300 ao preço base.'},
 {id:'sigils',name:'Encantar com sigilos',page:242,summary:'Até quatro sigilos por item: no máximo dois prefixos e dois sufixos. O preço de cada aplicação depende do grau e da quantidade de sigilos já presentes. Escudos também aceitam sigilos de armas. O item precisa estar vestido ou empunhado para uso.'},
 {id:'fragments',name:'Imbuir e sintonizar',page:241,summary:'Limite de fragmentação: CAR + 2 × bônus de proficiência. A sintonia muda ao descansar. Imbuir torna o efeito permanente ou recarregável conforme cada sigilo. Itens imbuídos continuam consumindo fragmentação mesmo sem cargas.'},
 {id:'synapses',name:'Sinapses e recarga magitec',page:238,summary:'Sinapse altera a magia que a afeta e se torna sua nova origem. Custa T$ 300 × limite de PE × multiplicador de raridade (1, 2, 3 ou 4). Exceder a capacidade ou movê-la ativa é perigoso. Engenhocas recarregam por sua condição própria ou quando o portador recebe magia superficial ou superior.'}
];
export const SIGIL_COSTS=[[50,250,900,3500],[75,375,1350,5250],[115,550,2050,7900],[170,850,3050,11900]];
export const IMBUE_COSTS=[250,1000,5000,null];
