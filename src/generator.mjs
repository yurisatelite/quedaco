const clean=value=>String(value??'').trim();
const key=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

export const ARCHETYPE_HINT=Object.freeze({
  'agricultor':'Mostre a produção local, as ferramentas e um problema que afeta a colheita.',
  'alquimista':'Explique a especialidade alquímica, os reagentes locais e o serviço que oferece.',
  'artesão':'Defina o ofício, os materiais da região e uma encomenda ou dificuldade atual.',
  'artista':'Defina a arte, o público local e um rumor ou evento ligado às apresentações.',
  'barqueiro':'Descreva a embarcação, as rotas conhecidas e um perigo recente das águas.',
  'caravaneiro':'Descreva a rota, a carga, os companheiros e um risco da próxima viagem.',
  'caçador':'Indique as presas, o terreno conhecido e um sinal de ameaça encontrado recentemente.',
  'cavaleiro':'Defina a ordem ou juramento, a montaria e a responsabilidade na região.',
  'druida':'Indique o círculo, o aspecto natural protegido e um desequilíbrio que exige atenção.',
  'explorador':'Descreva as rotas, ruínas ou perigos conhecidos e um achado ainda não investigado.',
  'fazendeiro':'Mostre a produção local, as ferramentas e um problema que afeta a propriedade.',
  'feerico':'Defina a corte ou refúgio, uma regra feérica e o motivo para tratar com aventureiros.',
  'ferreiro':'Descreva a oficina, a especialidade, os materiais e os serviços de forja e sigilos.',
  'guarda':'Defina o posto, a autoridade a que responde e um problema de segurança atual.',
  'guerreiro':'Defina a tradição de combate, o dever local e uma rivalidade ou ameaça.',
  'guia':'Indique os caminhos dominados, os perigos evitados e o preço ou favor cobrado.',
  'historiador':'Defina o tema estudado, uma fonte rara e uma descoberta que pode mudar uma narrativa local.',
  'investigador':'Apresente a jurisdição, o método e um caso aberto ligado ao lugar.',
  'mago':'Defina a escola ou tradição arcana, a especialidade e um estudo em andamento.',
  'marinheiro':'Descreva a embarcação, a função a bordo, as rotas e um rumor vindo do mar.',
  'mercador':'Monte um estoque típico e útil para o lugar, além de preço, interesse e rumor comercial.',
  'ocultista':'Defina a tradição, a manifestação sobrenatural e um presságio ou investigação atual.',
  'politico':'Defina o cargo, a facção, um aliado, um rival e a pauta que tenta aprovar.',
  'professor':'Defina a área ensinada, a instituição ou alunos e um problema acadêmico recente.',
  'sacerdote':'Defina a fé, o templo ou rito local e uma necessidade da comunidade.',
  'soldado':'Defina patente, unidade, posto atual e uma tensão militar da região.'
});

export function generatorPrompt(archetype,region=null,place=null,kind='npc'){
  const role=clean(archetype)||(kind==='monster'?'ameaça':'habitante'),regionName=clean(region?.name??region),placeName=clean(place?.name??place);
  const where=placeName&&regionName?`${placeName}, na região ${regionName}`:placeName||regionName||'Opath';
  const context=clean(region?.government??region?.faction),local=clean(place?.summary),hint=ARCHETYPE_HINT[key(role)];
  if(kind==='monster')return `Uma criatura ou ameaça do tipo ${role} encontrada em ${where}. Defina aparência, comportamento, nível de desafio, papel em cena, deslocamento, ataques, defesas e um gancho de encontro.${local?` Contexto do local: ${local}`:''}`;
  return `Um(a) ${role} de ${where}. Habitante comum, ND baixo. Descreva ocupação, aparência, personalidade, um gancho de história e o que vende ou oferece quando aplicável.${hint?` ${hint}`:' Defina uma ocupação coerente com o lugar e uma forma útil de interação com aventureiros.'}${context?` Contexto político ou facção local: ${context}`:''}${local?` Contexto do local: ${local}`:''}`;
}

export function generatorScope({kind='npc',region=null,place=null,archetype='',count=1}={}){
  const normalizedKind=kind==='monster'?'monster':'npc',amount=Math.max(1,Math.floor(Number(count)||1));
  return {
    kind:normalizedKind,
    regionId:clean(region?.id),regionName:clean(region?.name),
    placeId:clean(place?.id),placeName:clean(place?.name),
    archetype:clean(archetype)||(normalizedKind==='monster'?'ameaça':'habitante'),
    count:amount,
    prompt:generatorPrompt(archetype,region,place,normalizedKind)
  };
}
