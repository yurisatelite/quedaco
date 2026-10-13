import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=async path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('QUEDAÇO principal expõe somente o painel de campanha',async()=>{
  const [main,app]=await Promise.all([source('src/main.mjs'),source('src/app.mjs')]);
  assert.doesNotMatch(main,/renderActorDirectory|data-yuri-creator|Criar personagem/);
  assert.match(main,/module\.api=\{family:'quedaco'.*open:openCampaign,openCampaign\}/);
  assert.match(app,/this\.area='npcs'/);
  assert.doesNotMatch(app,/\['characters','Criação de Personagens'\]/);
});
