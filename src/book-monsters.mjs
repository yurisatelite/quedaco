// Índice de blocos de ameaça, não fichas de Actor nem encontros regionais.
const rows=[
 ['Árvore pregoeira',11,'Planta','Complexo · Bruto, Defensor',449,'walk','Árvore ameaçadora; consulte o bloco de combate e suas ações na página indicada.'],
 ['Assassino',5,'Humanoide','Complexo · Flanqueador, Sentinela',450,'walk','Oponente especializado em emboscadas e eliminação de alvos.'],
 ['Bando de Atobás Cuspidores',1,'Fera','Complexo · Coletivo',451,'walk flight','Bloco coletivo de aves cuspidoras; não equivale a uma ave individual.'],
 ['Bandido',2,'Humanoide','Simples · Flanqueador',451,'walk','Combatente de um grupo de bandidos.'],
 ['Líder dos bandidos',3,'Humanoide','Complexo · Líder, Flanqueador',452,'walk','Liderança de bandidos com bloco próprio.'],
 ['Besouro de aetherium',4,'Monstro','Simples · Bruto',453,'walk flight','Besouro individual; a nuvem usa outro bloco.'],
 ['Nuvem de besouros de aetherium',5,'Monstro','Complexo · Coletivo',454,'walk flight','Conjunto de besouros tratado como uma ameaça coletiva.'],
 ['Bicho papão',12,'Feérico','Chefão · Sentinela',456,'walk flight','Ameaça feérica associada ao pesadelo. Descrição na p. 455.'],
 ['Braço do pesadelo',9,'Feérico','Simples · Sentinela',457,'walk flight','Manifestação com bloco independente do Bicho papão.'],
 ['Binossauro rex',12,'Fera','Chefão · Bruto',458,'walk','Grande predador; descrição na p. 457.'],
 ['Bunyip Afogador',5,'Monstro · Quimera','Complexo · Bruto, Flanqueador',459,'walk swim','Quimera com natação e deslocamento terrestre.'],
 ['Bysen',3,'Humanoide','Simples · Defensor',460,'walk','Forma de bysen com bloco distinto de sua versão desperta.'],
 ['Bysen desperto (Elétrico)',3,'Elemental','Complexo · Atirador, Bruto',461,'walk flight','Variante elemental elétrica, capaz de voar.'],
 ['Corifeu',16,'Celestial','Chefão · Líder, Sentinela',463,'walk flight','Ameaça celestial; descrição na p. 462.'],
 ['Corpo Reanimado',4,'Morto-vivo','Simples · Defensor',464,'walk','Cadáver reanimado apresentado como ameaça.'],
 ['Diabo',9,'Ínfero','Complexo · Flanqueador',466,'walk','Ínfero com bloco próprio, distinto do Demônio. Descrição na p. 465.'],
 ['Demônio',9,'Ínfero','Complexo · Bruto',466,'walk','Ínfero com bloco próprio, distinto do Diabo. Descrição na p. 465.'],
 ['Eco das Sombras',6,'Morto-vivo','Complexo · Flanqueador',468,'walk','Ameaça das sombras; descrição na p. 467.'],
 ['Espírito da floresta',8,'Feérico','Complexo · Líder',470,'walk flight','Espírito feérico; descrição na p. 469.'],
 ['Cordão necrópode',7,'Monstro','Complexo · Coletivo',471,'walk','Bloco coletivo de necrópodes.'],
 ['Soldado necrópode',8,'Monstro','Complexo · Bruto, Líder',472,'walk','Necrópode com funções de combate e liderança.'],
 ['Autômato Menor',5,'Constructo','Simples · Cavalaria',473,'walk','Constructo capaz de escalar e escavar.'],
 ['Golem mecânico',7,'Constructo','Chefão · Bruto',474,'walk','Constructo mecânico com bloco de chefão.'],
 ['Grupo de juwins',3,'Elemental','Complexo · Coletivo',475,'walk','Grupo de elementais tratado como uma ameaça coletiva.'],
 ['Kraken',9,'Monstro','Chefão · Bruto',477,'swim','Monstro com natação, sem deslocamento terrestre. Descrição na p. 476.'],
 ['Lacraia Devoradora',10,'Monstro','Complexo · Cavalaria',478,'walk','Ameaça de grande mobilidade terrestre.'],
 ['Profundo Disparador',15,'Monstro','Chefão · Atirador, Bruto',480,'walk swim','Profundo com natação e ataques à distância.'],
 ['Ratazana Gigante',4,'Monstro','Simples · Bruto',481,'walk','Ratazana individual, distinta da Rataria de Aetherium.'],
 ['Rataria de Aetherium',2,'Monstro','Complexo · Coletivo',481,'walk','Ameaça coletiva de ratos.'],
 ['Serpe Silvestre',14,'Dragão','Chefão · Bruto, Flanqueador',483,'walk flight','Dragão capaz de voar. Descrição na p. 482.'],
 ['Siri titã',14,'Monstro','Chefão · Bruto',485,'walk swim','Ameaça com deslocamento terrestre e natação. Descrição na p. 484.'],
 ['Víbora sorrateira',10,'Planta','Complexo · Bruto, Flanqueador',486,'walk','Apesar do nome, seu tipo no bloco é Planta.'],
 ['Alpaca',1,'Fera','Complexo · Atirador',488,'walk','Também possui orientações de montaria e companheiro feral.'],
 ['Aranha gigante',3,'Fera','Complexo · Flanqueador',489,'walk','Fera com escalada e opções de montaria e companheiro.'],
 ['Cavalo',1,'Fera','Complexo · Bruto, Cavalaria',489,'walk','Fera com opções de montaria e companheiro feral.'],
 ['Capivara',1,'Fera','Complexo · Bruto',490,'walk','Fera com opções de montaria e companheiro feral.'],
 ['Gavião gigante',2,'Fera','Complexo · Flanqueador',490,'walk flight','Fera voadora com opções de montaria e companheiro.'],
 ['Jacaré salgado',1,'Fera','Complexo · Flanqueador',491,'walk swim','Predador de águas rasas, doces ou salgadas; inclui opções de montaria e companheiro.'],
 ['Libélula gigante',2,'Fera','Complexo · Cavalaria',491,'walk flight','Ligada aos anuros de Blurgh’ta; inclui opções de montaria e companheiro.'],
 ['Lhabrito',3,'Fera','Complexo · Bruto',492,'walk','Fera com escalada e opções de montaria e companheiro.'],
 ['Lobo',3,'Fera','Complexo · Bruto, Flanqueador',493,'walk','Predador de alcateia; inclui opções de montaria e companheiro.'],
 ['Mariposa gigante',4,'Fera','Complexo · Bruto',493,'walk flight','Inseto cujo pó é usado em soníferos; inclui opções de montaria e companheiro.'],
 ['Onça',2,'Fera','Complexo · Bruto, Flanqueador',494,'walk','Fera com escalada e opções de montaria e companheiro.'],
 ['Velossauro',4,'Fera','Complexo · Bruto, Flanqueador',494,'walk','Fera com opções de montaria e companheiro feral.']
];
// Índice de habitat do bestiário: mesmos locais da macro de distribuição. Não cria
// encontros nem altera fichas; a tela deriva a região a partir do local.
const habitats={
 'Árvore pregoeira':{placeId:'tres-bosques'},'Assassino':{placeId:'alberich'},'Bando de Atobás Cuspidores':{placeId:'queda-mare'},'Bandido':{placeId:'alberich'},'Líder dos bandidos':{placeId:'alberich'},'Besouro de aetherium':{placeId:'queda-tempo'},'Nuvem de besouros de aetherium':{placeId:'queda-tempo'},'Bicho papão':{regionId:'forah'},'Braço do pesadelo':{regionId:'forah'},'Binossauro rex':{placeId:'queda-tormund'},'Bunyip Afogador':{placeId:'armacao'},'Bysen':{placeId:'imensidao'},'Bysen desperto (Elétrico)':{placeId:'imensidao'},'Corifeu':{beyondId:'lapis'},'Corpo Reanimado':{placeId:'salgado-fim'},'Diabo':{beyondId:'varmah'},'Demônio':{beyondId:'varmah'},'Eco das Sombras':{placeId:'salgado-fim'},'Espírito da floresta':{regionId:'forah'},'Cordão necrópode':{placeId:'queda-viboras'},'Soldado necrópode':{placeId:'queda-viboras'},'Autômato Menor':{placeId:'kravokia'},'Golem mecânico':{placeId:'kravokia'},'Grupo de juwins':{placeId:'atoleiro'},'Kraken':{placeId:'gungii'},'Lacraia Devoradora':{placeId:'queda-tormund'},'Profundo Disparador':{placeId:'armacao'},'Ratazana Gigante':{placeId:'alberich'},'Rataria de Aetherium':{placeId:'alberich'},'Serpe Silvestre':{placeId:'queda-tormund'},'Siri titã':{placeId:'queda-mare'},'Víbora sorrateira':{placeId:'queda-viboras'},'Alpaca':{beyondId:'walsh'},'Aranha gigante':{regionId:'wammawina'},'Cavalo':{placeId:'lado-fora'},'Capivara':{placeId:'lado-fora'},'Gavião gigante':{regionId:'mirmir'},'Jacaré salgado':{placeId:'lagoa-garras'},'Libélula gigante':{placeId:'lagoa-garras'},'Lhabrito':{placeId:'lado-fora'},'Lobo':{placeId:'onze-berrantes'},'Mariposa gigante':{placeId:'lado-fora'},'Onça':{placeId:'queda-tormund'},'Velossauro':{placeId:'queda-tormund'}
};
export const MONSTERS=rows.map(([name,nd,creatureType,role,page,movement,summary],i)=>({id:`book-monster-${i+1}`,name,nd,creatureType,role,page,movement:movement.split(' '),summary,...(habitats[name]??{})}));
