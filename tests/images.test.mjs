import test from 'node:test';
import assert from 'node:assert/strict';
import {buildImageIndex,imageCandidates,imageSlug,resolveImage} from '../src/images.mjs';
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
 // NPC também: imagem do documento primeiro; a pasta fica só como fallback
 const npc=resolveImage('npc','Kraken',{root:'worlds/x',documentImg:'tokens/kraken.webp',fallback:'f.svg'});
 assert.equal(npc.src,'tokens/kraken.webp');
 assert.ok(npc.fallbacks.includes('worlds/x/npcs/kraken.webp'));
 // sem documentImg, aí sim a pasta lidera
 const npc2=resolveImage('npc','Kraken',{root:'worlds/x',fallback:'f.svg'});
 assert.equal(npc2.src,'worlds/x/npcs/kraken.webp');
 // exceção do manifesto continua tendo prioridade máxima
 const ex=resolveImage('npc','Kraken',{root:'worlds/x',manifest:{npcs:{kraken:'custom.png'}},documentImg:'tokens/kraken.webp'});
 assert.equal(ex.src,'custom.png');
});
test('índice usa somente imagens existentes e sem índice conserva as tentativas atuais',async()=>{
 const index=await buildImageIndex('worlds/x',async path=>({files:path.endsWith('/itens')?['worlds/x/itens/espada.png']:[]}));
 assert.deepEqual(index,{root:'worlds/x',files:['worlds/x/itens/espada.png']});
 const indexed=resolveImage('item','Espada',{root:'worlds/x',index,fallback:'f.svg'});
 assert.deepEqual(indexed.sources,['worlds/x/itens/espada.png','f.svg']);
 const legacy=resolveImage('item','Espada',{root:'worlds/x',fallback:'f.svg'});
 assert.ok(legacy.sources.includes('worlds/x/itens/espada.webp'));
 assert.ok(legacy.sources.includes('worlds/x/itens/espada.png'));
});
