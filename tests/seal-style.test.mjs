import test from 'node:test';
import assert from 'node:assert/strict';
import {sealStyle,SILVER_DRAGON_SEAL} from '../src/seal-style.mjs';

test('dragões e Cortes compartilham ícone, mas cada cor e o selo caseiro ficam identificados',()=>{
  const azul=sealStyle('Dragão Azul.'),verde=sealStyle('Dragão Verde'),prata=sealStyle(SILVER_DRAGON_SEAL);
  assert.equal(azul.icon,verde.icon);
  assert.notEqual(azul.color,verde.color);
  assert.equal(prata.icon,azul.icon);
  assert.equal(prata.homebrew,true);
  assert.equal(verde.homebrew,false);
  assert.equal(sealStyle('Corte de Inverno').icon,sealStyle('Corte do Outono.').icon);
  assert.notEqual(sealStyle('Corte de Inverno').color,sealStyle('Corte do Outono.').color);
  assert.equal(sealStyle('Necárianos de Opath (APENO)').icon,'fa-gem');
});
