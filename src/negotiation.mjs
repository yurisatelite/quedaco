// Negociação de preço. Tudo aqui sai de docs/T-NEGOCIACAO.md, que por sua vez
// cita o Livro Básico 1.25. Nada de percentual inventado: o único número sem
// tabela no livro é o da atitude, e ele fica configurável por loja.

/** Escala oficial de atitude do coadjuvante (Cap. 1, Cenas de Interação Social).
 *  O livro afirma que a atitude mexe no preço mas não tabela quanto — estes são
 *  valores SUGERIDOS, que a Mestra ajusta por loja. */
export const ATTITUDES={
  hostil:{label:'Hostil',modifier:.25,color:'#c0392b',hint:'Não quer negociar. Preço punitivo, se é que atende.'},
  negativo:{label:'Negativo',modifier:.10,color:'#d4772c',hint:'Atende contrariado e cobra mais caro.'},
  indiferente:{label:'Indiferente',modifier:0,color:'#8a99a8',hint:'Preço de tabela. É o padrão.'},
  prestativo:{label:'Prestativo',modifier:-.05,color:'#4fa3c7',hint:'Simpatiza com o grupo e alivia um pouco.'},
  aliado:{label:'Aliado',modifier:-.15,color:'#4fca8f',hint:'"Pode conceder uma série de descontos", nas palavras do livro.'},
};
export const DEFAULT_ATTITUDE='indiferente';
export const attitudeModifier=(id,override)=>{
  const num=Number(override);
  if(Number.isFinite(num))return num;
  return ATTITUDES[id]?.modifier??0;
};

const chave=value=>String(value??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

/** Condições do livro que mexem em preço, identificadas pelo nome do item na ficha.
 *  `roll` marca as que dependem de um teste na cena — essas não se aplicam sozinhas. */
export const CONDITIONS=[
  {
    id:'diplomacia',
    match:['artimanha de diplomacia'],
    label:'Artimanha de Diplomacia',
    buy:-.10,sell:.10,roll:true,
    note:'Teste de CAR contra a Proteção de CAR do vendedor, no início da cena. Em sucesso, 10%.',
  },
  {
    id:'ambulante',
    match:['na minha mao e mais barato','na minha mao e mais barato!'],
    label:'Na minha mão é mais barato!',
    buy:-.20,sell:.10,roll:true,advantage:true,
    note:'Vantagem no teste de barganha. Em sucesso, até 20% de desconto.',
  },
  {
    id:'crime',
    match:['crime que compensa'],
    label:'Crime que Compensa',
    buy:-.25,sellFull:true,roll:false,
    only:['weapon','armor','shield'],
    brittle:true,
    note:'Nos cantos sombrios: −25% em armas, armaduras e escudos, mas eles vêm QUEBRADIÇO. Vende pelo preço cheio.',
  },
  {
    id:'contatinhos',
    match:['contatinhos'],
    label:'Contatinhos',
    buy:-.50,roll:false,manual:true,
    note:'Um item comum por metade do preço ao chegar na cidade. Vale uma vez, então não entra sozinho na conta.',
  },
];

/** Lê a ficha de quem está comprando e devolve as condições do livro que ela tem. */
export function buyerConditions(actor){
  const nomes=Array.from(actor?.items??[]).map(item=>chave(item.name));
  return CONDITIONS.filter(cond=>cond.match.some(alvo=>nomes.includes(chave(alvo))));
}

/** Tipo do item pro recorte do Crime que Compensa (só arma, armadura e escudo). */
export function itemKind(document){
  const type=String(document?.type??'');
  if(type==='weapon')return 'weapon';
  if(type==='armor')return String(document?.system?.slot??'')==='shield'?'shield':'armor';
  return type;
}

/**
 * Preço final de uma compra, com a conta aberta pra mostrar na tela.
 * `haggleWon` diz se o teste de pechincha da cena passou; sem isso as condições
 * que dependem de teste não entram.
 */
export function quote({unitBase,attitude=DEFAULT_ATTITUDE,attitudeOverride,conditions=[],kind='',haggleWon=false,qty=1}){
  const linhas=[];
  const modAtitude=attitudeModifier(attitude,attitudeOverride);
  if(modAtitude)linhas.push({id:'atitude',label:`Atitude: ${ATTITUDES[attitude]?.label??attitude}`,percent:modAtitude});

  // só a melhor condição de compra vale — não se empilha desconto sobre desconto
  const aplicaveis=conditions.filter(cond=>{
    if(cond.manual)return false;
    if(cond.buy==null)return false;
    if(cond.roll&&!haggleWon)return false;
    if(cond.only&&!cond.only.includes(kind))return false;
    return true;
  });
  const melhor=aplicaveis.reduce((a,b)=>(a==null||b.buy<a.buy?b:a),null);
  if(melhor)linhas.push({id:melhor.id,label:melhor.label,percent:melhor.buy,brittle:Boolean(melhor.brittle)});

  const fator=linhas.reduce((total,linha)=>total+linha.percent,0);
  const unit=Math.max(0,Math.round(unitBase*(1+fator)));
  return {
    unitBase,unit,total:unit*qty,
    linhas,
    brittle:linhas.some(linha=>linha.brittle),
    ignoradas:conditions.filter(cond=>!aplicaveis.includes(cond)&&!cond.manual&&cond.buy!=null),
  };
}

/** Preço que o mercador paga pelo que o grupo vende.
 *  Regra base: metade do preço, porque o equipamento conta como danificado. */
export function sellQuote({unitBase,conditions=[],haggleWon=false,qty=1}){
  const linhas=[];
  const temPrecoCheio=conditions.some(cond=>cond.sellFull);
  let fator=temPrecoCheio?1:.5;
  linhas.push({id:'base',label:temPrecoCheio?'Crime que Compensa: preço cheio':'Revenda: metade do preço',percent:fator-1});
  const bonus=conditions.filter(cond=>cond.sell!=null&&(!cond.roll||haggleWon));
  const melhor=bonus.reduce((a,b)=>(a==null||b.sell>a.sell?b:a),null);
  if(melhor){fator+=melhor.sell;linhas.push({id:melhor.id,label:melhor.label,percent:melhor.sell});}
  const unit=Math.max(0,Math.round(unitBase*fator));
  return {unitBase,unit,total:unit*qty,linhas};
}
