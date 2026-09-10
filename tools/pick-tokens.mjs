#!/usr/bin/env node
// Casa cada NPC (fichas-para-casar.json) com um token do pacote local e COPIA o
// arquivo escolhido para .local/tokens-escolhidos/npcs/<slug>.png
// Uso:  node tools/pick-tokens.mjs ["<caminho do fichas-para-casar.json>"]
// Requer: .local/tokens-skyfall-index.json  (gere com tools/tokens-index-gen.mjs)
// Nada disto vai para o repositório. Depois: suba a pasta npcs/ para <assetRoot>.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const FICHAS = process.argv[2] || 'E:/CODEX-RPG/CLAUDE INSTRUÇÕES/fichas-para-casar.json';
const INDEX = 'E:/CODEX-RPG/.local/tokens-skyfall-index.json';
const OUT = 'E:/CODEX-RPG/.local/tokens-escolhidos';

const idx = JSON.parse(readFileSync(INDEX, 'utf8'));
const PACK = idx.root;
const pool = idx.tokens.filter(t => t.h === 1 && t.n !== 1); // humanoides, sem nome próprio

const RACE = { gnomo: 'gnome', gnoma: 'gnome', humano: 'human', humana: 'human', humani: 'human', humane: 'human', anão: 'dwarf', anao: 'dwarf', anã: 'dwarf', ana: 'dwarf', elfo: 'elf', elfa: 'elf', 'meio-elfo': 'halfelf', kobold: 'kobold', draconato: 'dragonborn', draconiano: 'dragonborn', draconiana: 'dragonborn', halfling: 'halfling', pequenino: 'halfling', tiefling: 'tiefling', orc: 'orc', 'meio-orc': 'halforc', goblin: 'goblin', tabaxi: 'tabaxi', aarakocra: 'aarakocra', tortle: 'tortle', triton: 'triton', merfolk: 'merfolk', centauro: 'centaur', minotauro: 'minotaur', sombrio: 'dwarf', sombria: 'dwarf', walshie: 'gnome', walsh: 'gnome', necriano: 'human', necriana: 'human' };
const VOCAB = {
  acadêmico: 'scholar', academico: 'scholar', acadêmica: 'scholar', erudito: 'scholar', erudita: 'scholar', estudioso: 'scholar', estudiosa: 'scholar', sábio: 'sage', sabio: 'sage', escriba: 'scribe', bibliotecário: 'librarian', cartógrafo: 'cartographer', cartografo: 'cartographer', poeta: 'poet', pesquisador: 'scholar', genealogista: 'scholar',
  mercador: 'merchant', mercadora: 'merchant', comerciante: 'merchant', vendedor: 'vendor', vendedora: 'vendor', negociante: 'trader', mascate: 'peddler', lojista: 'shopkeeper',
  ferreiro: 'blacksmith', ferreira: 'blacksmith', forjador: 'smith', armeiro: 'armorer',
  guarda: 'guard', sentinela: 'guard', soldado: 'soldier', guerreiro: 'warrior', guerreira: 'warrior', veterano: 'veteran', capitão: 'captain', capitao: 'captain', general: 'general', mercenário: 'mercenary', mercenaria: 'mercenary', arqueiro: 'archer', arqueira: 'archer', besteiro: 'archer', lanceiro: 'soldier', paladino: 'paladin', cavaleiro: 'knight',
  mago: 'mage', maga: 'mage', feiticeiro: 'sorcerer', feiticeira: 'sorceress', bruxo: 'warlock', bruxa: 'witch', arcanista: 'arcanist', conjurador: 'conjurer', invocador: 'conjurer', pactista: 'warlock', artífice: 'artificer', artifice: 'artificer', alquimista: 'alchemist', ilusionista: 'mage',
  sacerdote: 'priest', sacerdotisa: 'priestess', clérigo: 'cleric', clerigo: 'cleric', acólito: 'acolyte', acolito: 'acolyte', monge: 'monk', druida: 'druid', xamã: 'shaman', xama: 'shaman', oráculo: 'oracle', oraculo: 'oracle', vidente: 'seer', profeta: 'prophet', místico: 'mystic', mistico: 'mystic', cultista: 'cultist', ritualista: 'ritualist',
  curandeiro: 'healer', curandeira: 'healer', médico: 'physician', medico: 'physician', boticário: 'apothecary', boticario: 'apothecary', herbalista: 'herbalist', enfermeiro: 'medic',
  pescador: 'fisher', pescadora: 'fisher', marinheiro: 'sailor', nauta: 'sailor', navegante: 'mariner', pirata: 'pirate', corsário: 'pirate', corsario: 'pirate', contrabandista: 'smuggler', estivador: 'dockworker', recife: 'sailor', arquipelago: 'sailor', ilha: 'sailor', barco: 'sailor', navio: 'sailor', vela: 'sailor', capita: 'captain', timoneiro: 'sailor', naufrago: 'sailor',
  picareta: 'miner', mina: 'miner', mineracao: 'miner', geologo: 'miner', domador: 'hunter', domadora: 'hunter', farejador: 'tracker', farejadora: 'tracker', guardia: 'guard', guardiao: 'guard', governador: 'noble', conselheiro: 'diplomat', conselheira: 'diplomat', capataz: 'worker', eremita: 'hermit', herdeira: 'noble', herdeiro: 'noble',
  agricultor: 'farmer', fazendeiro: 'farmer', camponês: 'peasant', campones: 'peasant', pastor: 'shepherd', lenhador: 'lumberjack', minerador: 'miner', mineiro: 'miner', pedreiro: 'bricklayer', carpinteiro: 'carpenter', padeiro: 'baker', cozinheiro: 'cook', açougueiro: 'butcher', cervejeiro: 'brewer', taverneiro: 'innkeeper', taberneiro: 'innkeeper', estalajadeiro: 'innkeeper', criado: 'servant', criada: 'maid', mordomo: 'butler',
  mendigo: 'beggar', vagabundo: 'vagrant', órfão: 'urchin', orfao: 'urchin', ladrão: 'thief', ladra: 'thief', gatuno: 'rogue', trapaceiro: 'scoundrel', bandido: 'bandit', salteador: 'brigand', assassino: 'assassin', assassina: 'assassin', espião: 'spy', espia: 'spy', informante: 'spy', batedor: 'scout', explorador: 'scout', exploradora: 'scout', guia: 'scout', caçador: 'hunter', caçadora: 'hunter', rastreador: 'tracker', trapper: 'trapper',
  nobre: 'noble', nobreza: 'noble', aristocrata: 'noble', lorde: 'lord', dama: 'lady', barão: 'baron', baronesa: 'baron', duque: 'duke', conde: 'count', rei: 'king', rainha: 'queen', príncipe: 'prince', princesa: 'princess', cortesão: 'courtier', diplomata: 'diplomat', emissário: 'emissary', emissaria: 'emissary', embaixador: 'diplomat', mensageiro: 'messenger', arauto: 'herald', pregoeiro: 'crier',
  padre: 'priest', sacerdotisa: 'priestess', vigia: 'guard', presidente: 'noble', prefeito: 'noble', penitente: 'monk', irma: 'nun', frei: 'monk',
  bobo: 'jester', bardo: 'bard', menestrel: 'minstrel', músico: 'musician', musico: 'musician', dançarina: 'dancer', gladiador: 'gladiator', lutador: 'brawler', pugilista: 'brawler', carrasco: 'executioner', carcereiro: 'jailer', coveiro: 'gravekeeper',
  velho: 'elder', velha: 'elder', idoso: 'elder', idosa: 'elder', ancião: 'elder', anciã: 'elder', jovem: 'young', criança: 'child', menino: 'child', menina: 'child',
  barbudo: 'bearded', barba: 'bearded', encapuzado: 'hooded', encapuzada: 'hooded', capuz: 'hooded', manto: 'cloaked', capa: 'cloaked', armadura: 'armored', blindado: 'armored', robe: 'robed', túnica: 'robed', tunica: 'robed', mascarado: 'masked', máscara: 'masked', mascara: 'masked', cicatriz: 'scarred', tatuado: 'tattooed', tatuagem: 'tattooed', cego: 'blind', selvagem: 'wild', grisalho: 'grizzled', severo: 'stern', bravo: 'angry', irritado: 'angry', sorridente: 'smiling', sorrindo: 'smiling', misterioso: 'mysterious', bêbado: 'drunk', bebado: 'drunk',
  aldeão: 'villager', aldea: 'villager', cidadão: 'citizen', cidada: 'citizen', plebeu: 'commoner', plebeia: 'commoner', trabalhador: 'worker', operário: 'worker', operario: 'worker', nômade: 'nomad', nomade: 'nomad', andarilho: 'wanderer', errante: 'wanderer', peregrino: 'pilgrim', viajante: 'traveller', refugiado: 'refugee', bárbaro: 'barbarian', barbaro: 'barbarian', tribal: 'tribal', desertor: 'soldier', fugitivo: 'rogue', maltrapilho: 'beggar',
  corvo: 'raven', lobo: 'wolf', urso: 'bear', raposa: 'fox', gato: 'feline', serpente: 'snake',
};
const stripTags = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); };

function keywords(npc) {
  const bio = stripTags(npc.biography || '');
  const apar = (bio.match(/Aparência([\s\S]{0,400}?)(Animal Base|Personalidade|Motiva|Segredo|Local|Ganchos|$)/i) || [, ''])[1];
  const text = norm(`${apar} ${npc.name} ${npc.role || ''}`);
  const words = text.split(/[^a-z0-9]+/).filter(w => w.length > 2);
  let race = '';
  const kw = new Set();
  for (const w of words) {
    if (RACE[w] && !race) race = RACE[w];
    if (VOCAB[w]) kw.add(VOCAB[w]);
  }
  // pistas de raça no nome/bio completo também
  for (const [pt, en] of Object.entries(RACE)) if (!race && norm(bio).includes(pt)) race = en;
  let sex = '';
  if (/\bela\b|feminin|mulher|senhora|dama/.test(text)) sex = 'f';
  else if (/\bele\b|masculin|homem|senhor|rapaz/.test(text)) sex = 'm';
  return { race, sex, kw: [...kw] };
}

function pick({ race, sex, kw }, seed) {
  let best = null, bestScore = 0;
  for (const t of pool) {
    let s = 0;
    if (race && t.r === race) s += 6;
    else if (race && t.r && t.r !== race) s -= 2;
    for (const k of kw) if (t.k.includes(k)) s += 3;
    if (sex && t.s === sex) s += 1;
    if (sex && t.s && t.s !== sex && t.s !== 'child') s -= 1;
    if (s > bestScore || (s === bestScore && s > 0 && best && hash(seed + t.p) < hash(seed + best.p))) { best = t; bestScore = s; }
  }
  return { token: best, score: bestScore };
}

const fichas = JSON.parse(readFileSync(FICHAS, 'utf8'));
const npcs = (fichas.documents || fichas).filter(n => n && n.name);
mkdirSync(join(OUT, 'npcs'), { recursive: true });

const report = [];
let copied = 0, missed = 0;
for (const npc of npcs) {
  const kw = keywords(npc);
  const { token, score } = pick(kw, npc.uuid || npc.name);
  if (!token || score <= 0) { missed++; report.push(`- ⚠ **${npc.name}** — sem correspondência (fica com mystery-man). kw: ${kw.race || '?'} ${kw.kw.join(',')}`); continue; }
  const src = join(PACK, token.p);
  const dst = join(OUT, 'npcs', `${slug(npc.name)}${extname(token.p) || '.png'}`);
  if (existsSync(src)) { copyFileSync(src, dst); copied++; }
  report.push(`- **${npc.name}** ← \`${token.p}\` (score ${score}; ${kw.race || '?'} / ${kw.kw.join(', ') || '—'})`);
}

writeFileSync(join(OUT, 'RELATORIO.md'),
  `# Tokens escolhidos para os NPCs\n\n${copied} copiados para \`.local/tokens-escolhidos/npcs/\`, ${missed} sem match.\n\n` +
  `Suba a pasta \`npcs\` para o armazenamento da mesa, dentro do caminho de \`quedaco.assetRoot\` ` +
  `(fica \`<assetRoot>/npcs/<slug>.png\`). O QUEDAÇO acha pelo nome do NPC.\n\n## Lista\n\n` + report.join('\n') + '\n');

console.log(`${npcs.length} NPCs — ${copied} com token, ${missed} sem match.`);
console.log(`Pasta: ${join(OUT, 'npcs')}`);
console.log(`Relatório: ${join(OUT, 'RELATORIO.md')}`);
