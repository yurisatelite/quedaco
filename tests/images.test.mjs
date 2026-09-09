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
