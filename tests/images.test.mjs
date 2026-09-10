import test from 'node:test';
import assert from 'node:assert/strict';
import {imageCandidates,imageSlug,resolveImage} from '../src/images.mjs';
test('slug de imagem remove acento, pontuação e espaços',()=>{
 assert.equal(imageSlug('Bicho-papão  Azul'),'bicho-papao-azul');
 assert.equal(imageCandidates('worlds/x/quedaco/','place','Praça da Sé')[0],'worlds/x/quedaco/locais/praca-da-se.webp');
});
test('imagem respeita exceção, convenção, documento e ícone',()=>{
 const manifest={monstros:{kraken:'custom/kraken.png'}};
 let result=resolveImage('monster','Kraken',{root:'worlds/x',manifest,documentImg:'doc.webp',fallback:'fallback.svg'});
 assert.equal(result.src,'custom/kraken.png');assert.equal(result.sources.at(-2),'doc.webp');assert.equal(result.sources.at(-1),'fallback.svg');
 result=resolveImage('npc','Ária',{documentImg:'actor.webp',fallback:'fallback.svg'});assert.equal(result.src,'actor.webp');
});
test('sem exceção, monstro/item mostram a imagem do documento antes da pasta (evita piscar)',()=>{
 const monster=resolveImage('monster','Kraken',{root:'worlds/x',documentImg:'tokens/kraken.webp',fallback:'f.svg'});
 assert.equal(monster.src,'tokens/kraken.webp');
 assert.ok(monster.fallbacks.includes('worlds/x/monstros/kraken.webp'));
 // NPC mantém a pasta na frente (fluxo de upload de tokens)
 const npc=resolveImage('npc','Kraken',{root:'worlds/x',documentImg:'tokens/kraken.webp',fallback:'f.svg'});
 assert.equal(npc.src,'worlds/x/npcs/kraken.webp');
});
