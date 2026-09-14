#!/usr/bin/env node
// Casa cada monstro de um lote D&D 5e (formato do gist/5e.tools) com um token
// do pacote local, priorizando por TIPO de criatura (dragão, morto-vivo, fera...)
// e depois por palavra-chave do nome. Copia pra .local/tokens-escolhidos/monstros/<slug>.png
// Uso:  node tools/pick-monster-tokens.mjs <lote.json> [mais-lotes.json ...]
// Requer: .local/tokens-skyfall-index.json (mesmo índice usado pros NPCs).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { skyfallCreatureType } from '../src/monster-convert.mjs';
import { local } from './raiz.mjs';

const INDEX = local('tokens-skyfall-index.json');
const OUT = local('tokens-escolhidos');

const idx = JSON.parse(readFileSync(INDEX, 'utf8'));
const PACK = idx.root;
const pool = idx.tokens; // monstro pode casar com humanoide ou não; sem filtro de h/n aqui

// tipo do Skyfall (ou palavra crua do "meta"/"type" do D&D) -> tag "t" do índice
const TYPE_TAG = {
  dragon: 'dragao', aberration: 'aberracao', undead: 'morto-vivo', beast: 'fera',
  monstrosity: 'monstruosidade', giant: 'gigante', elemental: 'elemental', plant: 'planta',
  construct: 'constructo', humanoid: 'humanoide',
  celestial: 'espirito', fey: 'espirito', fiend: 'espirito',
};

const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); };
const STOP = new Set(['the', 'of', 'and', 'a', 'an', 'medium', 'large', 'small', 'tiny', 'huge', 'gargantuan']);

function monsterType(mob) {
  const raw = norm(mob.meta || mob.type || '');
  for (const key of Object.keys(TYPE_TAG)) if (raw.includes(key)) return { key, tag: TYPE_TAG[key] };
  const sk = skyfallCreatureType(mob.meta || mob.type || '');
  return { key: sk, tag: TYPE_TAG[sk] || null };
}
function nameKeywords(name) {
  return norm(name).split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOP.has(w));
}

function pick(mob, seed) {
  const { tag } = monsterType(mob);
  const kw = nameKeywords(mob.name);
  let best = null, bestScore = -Infinity;
  for (const t of pool) {
    let s = 0;
    if (tag && t.t === tag) s += 8;
    else if (tag) s -= 3; // penaliza tipo errado, mas não descarta (pode ganhar por nome)
    for (const k of kw) if (t.k.includes(k)) s += 4;
    if (t.n === 1) s -= 2; // evita tokens de personagem nomeado pra monstro genérico
    if (s > bestScore || (s === bestScore && best && hash(seed + t.p) < hash(seed + best.p))) { best = t; bestScore = s; }
  }
  return { token: best, score: bestScore, tag };
}

const files = process.argv.slice(2);
if (!files.length) { console.error('Uso: node tools/pick-monster-tokens.mjs <lote.json> [...]'); process.exit(1); }

mkdirSync(join(OUT, 'monstros'), { recursive: true });
const report = [];
let total = 0, copied = 0, missed = 0;
const usados = new Set(); // slug já escolhido nesta rodada, pra não sobrescrever

for (const file of files) {
  const list = JSON.parse(readFileSync(file, 'utf8'));
  const mobs = Array.isArray(list) ? list : [list];
  for (const mob of mobs) {
    if (!mob?.name) continue;
    total++;
    const s = slug(mob.name);
    if (usados.has(s)) continue;
    usados.add(s);
    const { token, score, tag } = pick(mob, mob.name);
    if (!token || score <= 0) { missed++; report.push(`- ⚠ **${mob.name}** (${tag || '?'}) — sem correspondência (fica com ícone padrão).`); continue; }
    const src = join(PACK, token.p);
    const dst = join(OUT, 'monstros', `${s}${extname(token.p) || '.png'}`);
    if (existsSync(src)) { copyFileSync(src, dst); copied++; }
    report.push(`- **${mob.name}** (${tag || '?'}) ← \`${token.p}\` (score ${score})`);
  }
}

writeFileSync(join(OUT, 'RELATORIO-MONSTROS.md'),
  `# Tokens escolhidos para os monstros de D&D\n\n${copied} copiados para \`.local/tokens-escolhidos/monstros/\`, ${missed} sem match, de ${total} lidos.\n\n` +
  `Suba a pasta \`monstros\` pro armazenamento da mesa e troque o token de cada Actor manualmente, ou use a macro de upload em massa.\n\n## Lista\n\n` + report.join('\n') + '\n');

console.log(`${total} monstros — ${copied} com token, ${missed} sem match.`);
console.log(`Pasta: ${join(OUT, 'monstros')}`);
console.log(`Relatório: ${join(OUT, 'RELATORIO-MONSTROS.md')}`);
