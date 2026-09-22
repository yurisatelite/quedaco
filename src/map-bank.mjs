// Curadoria de fontes públicas para a mesa. URLs apontam para a página do criador,
// nunca para uma imagem presumida. O fundo jogável é escolhido no FilePicker do mundo.
export const MAP_BANK_SOURCES=Object.freeze({
  town:{title:'Town Center',url:'https://2minutetabletop.com/product/town-center/',author:'Ross McConnell / 2-Minute Tabletop',license:'CC BY-NC 4.0',use:'Praça e ruas de cidade'},
  coastal:{title:'Coastal Town',url:'https://2minutetabletop.com/product/coastal-town/',author:'Ross McConnell / 2-Minute Tabletop',license:'CC BY-NC 4.0',use:'Cidade ou vila costeira'},
  castle:{title:'Castle Town',url:'https://2minutetabletop.com/product/castle-town/',author:'Ross McConnell / 2-Minute Tabletop',license:'CC BY-NC 4.0',use:'Fortaleza e cidade costeira'},
  forest:{title:'Forest Camp',url:'https://2minutetabletop.com/product/forest-camp/',author:'Ross McConnell / 2-Minute Tabletop',license:'CC BY-NC 4.0',use:'Bosque e acampamento'},
  wetland:{title:'Jungle Wetland',url:'https://2minutetabletop.com/product/jungle-wetland/',author:'Ross McConnell / 2-Minute Tabletop',license:'CC BY-NC 4.0',use:'Pântano e lagoa'},
  desert:{title:'Desert Ruins',url:'https://2minutetabletop.com/product/desert-ruins/',author:'Ross McConnell / 2-Minute Tabletop',license:'CC BY-NC 4.0',use:'Ruínas, deserto e versão alagada'},
  snow:{title:'Snowy Summit',url:'https://2minutetabletop.com/product/snowy-summit/',author:'Ross McConnell / 2-Minute Tabletop',license:'CC BY-NC 4.0',use:'Gelo e montanha'},
  island:{title:'Desert Island',url:'https://2minutetabletop.com/product/desert-island/',author:'Ross McConnell / 2-Minute Tabletop',license:'CC BY-NC 4.0',use:'Ilha tropical e praia'},
  lava:{title:'Dragon’s Lair Bridge',url:'https://2minutetabletop.com/product/dragons-lair-bridge/',author:'Ross McConnell / 2-Minute Tabletop',license:'CC BY-NC 4.0',use:'Lava, vulcão e ponte'},
  market:{title:'Market Festival',url:'https://2minutetabletop.com/product/market-festival/',author:'Ross McConnell / 2-Minute Tabletop',license:'CC BY-NC 4.0',use:'Mercado e barracas'},
  highland:{title:'Highland Pass',url:'https://2minutetabletop.com/product/highland-pass/',author:'Ross McConnell / 2-Minute Tabletop',license:'CC BY-NC 4.0',use:'Trilha e cordilheira'},
  ruinedKeep:{title:'Ruined Keep',url:'https://2minutetabletop.com/product/ruined-keep/',author:'Ross McConnell / 2-Minute Tabletop',license:'CC BY-NC 4.0',use:'Fortaleza em ruínas'},
  shipyard:{title:'Shipyard Warehouse',url:'https://2minutetabletop.com/product/shipyard-warehouse/',author:'Ross McConnell / 2-Minute Tabletop',license:'CC BY-NC 4.0',use:'Porto e armazém'}
});

// Uma recomendação por nó do livro. Mesmo que duas localidades usem a mesma fonte,
// cada uma poderá receber um arquivo e uma Scene próprios no mundo.
export const MAP_BANK_SELECTION=Object.freeze({
  foice:'coastal',pacuma:'island',kiki:'coastal',mahuku:'coastal',lapuko:'coastal',papuama:'island',tief:'lava',
  salim:'desert',travessia:'town','tres-bosques':'forest',eshel:'ruinedKeep',
  kravokia:'town',atoleiro:'wetland',
  atui:'snow','bosque-cordas':'forest','fosso-vazio':'ruinedKeep',imensidao:'snow','onze-berrantes':'castle',
  sarfo:'town',recanto:'forest','chegada-inverno':'castle',
  maruma:'coastal','foz-encontro':'shipyard',castelete:'castle','lagoa-garras':'wetland','vila-lompta':'wetland',armacao:'coastal',
  nambowa:'town',pomares:'forest','fazenda-lumb':'forest',
  sodori:'town',espinha:'highland',gungii:'island',
  alberich:'town','lado-fora':'town',casebres:'town','velha-alberich':'ruinedKeep','mercado-repentino':'market','bosque-passagem':'forest','salgado-fim':'highland',
  'cidade-tormund':'desert','torres-marfim':'ruinedKeep',toratora:'desert',
  'queda-salim':'desert','queda-tempo':'ruinedKeep','queda-tormund':'desert','queda-mare':'coastal','queda-viboras':'wetland'
});

export function mapSourceFor(placeId){return MAP_BANK_SOURCES[MAP_BANK_SELECTION[placeId]]??null;}

// Só relações de continência confirmadas pelo índice geográfico. A posição de cada
// passagem jogável continua vazia até a Mestra marcar entrada e saída nas cenas.
export function mapPortalDrafts(places){return places.filter(place=>place.parentId).map(place=>({fromPlaceId:place.parentId,toPlaceId:place.id,label:`Entrada para ${place.name}`,section:'Mapa Imersivo',bidirectional:true,status:'aguarda cenas e posições'}));}
