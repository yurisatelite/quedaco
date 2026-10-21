import test from 'node:test';
import assert from 'node:assert/strict';
import {CHANGELOG,entriesSince,isNewer} from '../src/changelog.mjs';

test('comparação semver identifica somente versões posteriores',()=>{
  assert.equal(isNewer('0.4.9','0.4.8'),true);
  assert.equal(isNewer('0.4.10','0.4.9'),true);
  assert.equal(isNewer('0.4.9','0.4.9'),false);
  assert.equal(isNewer('0.5.0','0.4.9'),true);
});

test('changelog retorna a faixa nova e limita primeira instalação à mais recente',()=>{
  const after408=entriesSince(CHANGELOG,'0.4.8').map(entry=>entry.version);
  const after409=entriesSince(CHANGELOG,'0.4.9').map(entry=>entry.version);
  assert.deepEqual(after408.slice(0,6),['0.20.1','0.20.0','0.19.0','0.18.6','0.18.5','0.18.4']);
  assert.equal(after408.at(-1),'0.4.9');
  assert.deepEqual(after409,after408.slice(0,-1));
  assert.equal(entriesSince(CHANGELOG,'').length,1);
  assert.equal(entriesSince(CHANGELOG,'')[0],CHANGELOG[0]);
});

test('todas as entradas do changelog têm os campos publicados',()=>{
  for(const entry of CHANGELOG){
    assert.match(entry.version,/^\d+\.\d+\.\d+$/);
    assert.match(entry.date,/^\d{4}-\d{2}-\d{2}$/);
    assert.ok(entry.title.trim());
    assert.ok(Array.isArray(entry.notes)&&entry.notes.length>0);
    assert.ok(entry.notes.every(note=>typeof note==='string'&&note.trim()));
  }
});
