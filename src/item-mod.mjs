import {IMBUE_COSTS,SIGIL_COSTS} from './book-items.mjs';

export function modifiedItemCost({basePrice=0,material=null,sigils=[]}={}){
  if(!Number.isFinite(Number(basePrice))||Number(basePrice)<0)throw Error('Preço base inválido.');
  if(!Array.isArray(sigils)||sigils.length>4)throw Error('Um item aceita no máximo quatro sigilos.');
  const prefix=sigils.filter(s=>String(s.slot).toLowerCase()==='prefixo').length,suffix=sigils.filter(s=>String(s.slot).toLowerCase()==='sufixo').length;
  if(prefix>2)throw Error('Um item aceita no máximo dois prefixos.');if(suffix>2)throw Error('Um item aceita no máximo dois sufixos.');
  let total=Math.floor(Number(basePrice)),unknown=false;const lines=[{kind:'base',label:'Item base',cost:total}],warnings=[];
  if(material){total+=300;lines.push({kind:'material',label:String(material),cost:300});}
  sigils.forEach((sigil,index)=>{
    const grade=Number(sigil.grade);if(!Number.isInteger(grade)||grade<1||grade>4)throw Error('Grau de sigilo inválido.');
    const cost=SIGIL_COSTS[index][grade-1];total+=cost;lines.push({kind:'sigil',label:String(sigil.name??'Sigilo'),cost,row:index,column:grade});
    if(sigil.imbue){const imbue=IMBUE_COSTS[grade-1];if(imbue==null){unknown=true;warnings.push(`Imbuir ${sigil.name??'sigilo'} de 4º grau: custo a conferir.`);lines.push({kind:'imbue',label:`Imbuir ${sigil.name??'sigilo'}`,cost:null});}else{total+=imbue;lines.push({kind:'imbue',label:`Imbuir ${sigil.name??'sigilo'}`,cost:imbue});}}
  });
  return {total,lines,warnings,unknown};
}

export function modifiedItemSheet(base,material,sigils){
  const result=modifiedItemCost({basePrice:base?.price??0,material:material?.name??null,sigils});
  const money=value=>value==null?'a conferir':`T$ ${Number(value).toLocaleString('pt-BR')}`;
  const rows=result.lines.map(line=>`${line.label}${line.kind==='sigil'?` (linha ${line.row}, coluna ${line.column})`:''}: ${money(line.cost)}`);
  rows.push(`TOTAL: ${money(result.total)}${result.unknown?' + custo a conferir':''}`,...result.warnings);
  return {result,text:rows.join('\n')};
}
