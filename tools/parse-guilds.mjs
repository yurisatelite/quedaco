#!/usr/bin/env node
// Lê o texto do Apêndice B (Guildas e Hansas) e gera dados estruturados.
// Pré-requisito (uma vez):
//   pdftotext -raw -enc UTF-8 "<pdf>" .local/guildas-raw-flow.txt
// Uso:  node tools/parse-guilds.mjs [.local/guildas-raw-flow.txt]
//
// Saída em .local/ (fora do git):
//   guildas.json          — [{name,creator,kind,symbol,seals[],patron,dogmas[],focus,legend,description,truths,plot}]
//   guildas-foundry.json  — Actors type "guild" prontos para importar num compêndio da mesa
// O texto completo NÃO entra no repositório.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { local } from './raiz.mjs';

const SRC = process.argv[2] || local('guildas-raw-flow.txt');
const GLUE = [
  [/deAlberich/g, 'de Alberich'], [/emAlberich/g, 'em Alberich'], [/aAlberich/g, 'a Alberich'],
  [/UniversidadeArcana/g, 'Universidade Arcana'], [/T'chuA'mala/g, "T'chu A'mala"],
  [/AArquiteta/g, 'A Arquiteta'], [/deOpath/g, 'de Opath'], [/comA Cifra/g, 'com A Cifra'],
  [/([a-zçãáéíóúâ])([A-ZÁÉÍÓÚÂÃ])/g, '$1 $2'],
];
const KEY = {
  'Selos de Aprovação': 'seals', 'Selos de Aprovaçao': 'seals',
  'Dogmas': 'dogmas', 'Descrição': 'description', 'Descriçao': 'description',
  'Verdades': 'truths', 'Plot': 'plot',
  'Campo de Atuação': 'focus', 'Campo de Atuaçao': 'focus',
  'Lenda': 'legend', 'Mecenas': 'patron',
  'Possibilidades de Aventura': 'plot',
};
const headRe = new RegExp('^\\s*(' + Object.keys(KEY).join('|') + ')\\s*:\\s*(.*)$');
const anchorRe = /^\s*(S[íi]mbolo|Tatuagem)\s*:\s*(.*)$/;
const BAD_NAME = new Set(['(sem nome)', 'Nome do Hansa', 'Nome do Autor', 'Nome da Guilda', 'Nome do Criador', 'Nome do Autor (Apoiador)']);

let text = readFileSync(SRC, 'utf8');
for (const [re, to] of GLUE) text = text.replace(re, to);
const lines = text.split(/\r?\n/).map(l => l.replace(/\s+$/, '').replace(/\f/g, ''));
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

const start = Math.max(0, lines.findIndex(l => /^Lista de Guildas\s*$/.test(l.trim())));
const hansaAt = lines.findIndex((l, i) => i > start && /^Hansas\s*$/.test(l.trim()));

const records = [];
let buf = [], cur = null, field = null;
const flush = () => { if (cur && !BAD_NAME.has(cur.name) && cur.symbol && !/^Descriç(ão|ao) d/.test(cur.symbol)) records.push(cur); };
const skip = l => !l || /^\d+\.\d+\s*:/.test(l) || /^Primeira versão pública/.test(l) || /^Lista de (Guildas|Hansas)\s*$/.test(l) || l === 'Guildas' || l === 'Hansas' || l === 'Estrutura' || l === 'A CIFRA';
const nextAnchor = i => { for (let k = i; k < Math.min(i + 6, lines.length); k++) if (anchorRe.test(lines[k])) return true; return false; };
const nameFrom = parts => {
  let p = parts.slice();
  while (p.length > 1 && /^[a-zçãáéíóúâ0-9("']/.test(p[0])) p.shift();
  return clean(p.join(' ')).replace(/^.*\.\s+(?=[A-ZÁ-Ú])/, '');
};

for (let i = start + 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (skip(line)) continue;

  const am = lines[i].match(anchorRe);
  if (am) {
    flush();
    const creator = buf.length ? buf[buf.length - 1] : '';
    const name = buf.length > 1 ? nameFrom(buf.slice(0, -1)) : (buf[0] || "(sem nome)");
    cur = {
      name: clean(name).replace(/^.*\.\s+(?=[A-ZÁ-Ú])/, ''), creator: clean(creator),
      kind: hansaAt >= 0 && i > hansaAt ? 'hansa' : 'guilda',
      symbol: clean(am[2]), seals: [], patron: '', dogmas: [],
      focus: '', legend: '', description: '', truths: '', plot: '', _seals: [],
    };
    buf = []; field = 'symbol';
    continue;
  }

  const hm = lines[i].match(headRe);
  if (hm && cur) {
    field = KEY[hm[1]];
    const rest = clean(hm[2]);
    if (field === 'seals') cur._seals = rest ? [rest] : [];
    else if (field === 'dogmas' || field === 'plot') { if (rest) cur[field === 'dogmas' ? 'dogmas' : 'plot'] = field === 'dogmas' ? [rest.replace(/^\d+\s*[-–.]\s*/, '')] : rest; }
    else cur[field] = rest;
    if (field === 'dogmas' && !Array.isArray(cur.dogmas)) cur.dogmas = cur.dogmas ? [cur.dogmas] : [];
    continue;
  }

  if (!cur) { buf.push(line); if (buf.length > 4) buf.shift(); continue; }
  if (nextAnchor(i)) { buf.push(line); if (buf.length > 4) buf.shift(); continue; }

  if (field === 'dogmas') {
    if (!Array.isArray(cur.dogmas)) cur.dogmas = [];
    const m = line.match(/^\d+\s*[-–.]\s*(.*)$/);
    if (m) cur.dogmas.push(m[1]);
    else if (cur.dogmas.length) cur.dogmas[cur.dogmas.length - 1] += ' ' + line;
  } else if (field === 'seals') {
    cur._seals.push(line);
  } else if (field === 'plot') {
    const m = line.match(/^\d+\s*[-–.]\s*(.*)$/);
    cur.plot = (cur.plot ? cur.plot + (m ? ' · ' : ' ') : '') + (m ? m[1] : line);
  } else if (field && field !== 'symbol') {
    cur[field] = (cur[field] ? cur[field] + ' ' : '') + line;
  }
}
flush();

for (const r of records) {
  r.seals = clean((r._seals || []).join(' ')).split(/\s*[,;]\s*|\s+e\s+/).map(clean).filter(s => s && s.length < 50).slice(0, 4);
  delete r._seals;
  r.dogmas = (Array.isArray(r.dogmas) ? r.dogmas : []).map(clean).filter(Boolean).slice(0, 5);
  for (const k of ['symbol', 'description', 'truths', 'plot', 'patron', 'name', 'creator', 'focus', 'legend']) r[k] = clean(r[k]);
  r.symbol = r.symbol.replace(/[,;]\s*$/, '.');
  if (r.kind === 'hansa') { r.description = r.description || r.focus; r.truths = r.truths || r.legend; }
}

mkdirSync(local(), { recursive: true });
writeFileSync(local('guildas.json'), JSON.stringify(records, null, 1));

const esc = s => String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const actors = records.map(r => ({
  name: r.name, type: 'guild', img: r.kind === 'hansa' ? 'icons/svg/skull.svg' : 'icons/svg/tower.svg',
  system: { motto: r.dogmas.length ? '<ol>' + r.dogmas.map(d => `<li>${esc(d)}</li>`).join('') + '</ol>' : (r.focus ? `<p>${esc(r.focus)}</p>` : ''), blueprints: '' },
  flags: { quedaco: { appendix: { kind: r.kind, creator: r.creator, symbol: r.symbol, seals: r.seals, patron: r.patron, focus: r.focus, legend: r.legend, description: r.description, truths: r.truths, plot: r.plot } } },
}));
writeFileSync(local('guildas-foundry.json'), JSON.stringify(actors, null, 1));

const g = records.filter(r => r.kind === 'guilda').length;
console.log(`${records.length} organizações — ${g} guildas, ${records.length - g} hansas`);
console.log('  .local/guildas.json  /  .local/guildas-foundry.json');
for (const r of [records[0], records[g - 1], records[g], records[records.length - 1]].filter(Boolean))
  console.log(`\n[${r.kind}] ${r.name}  — ${r.creator}\n  emblema: ${r.symbol.slice(0, 60)}\n  ${r.kind === 'hansa' ? 'mecenas: ' + r.patron.slice(0, 60) : 'selos: ' + r.seals.join(' · ')}\n  dogmas:${r.dogmas.length} descr:${r.description.length}c plot:${r.plot.length}c`);
