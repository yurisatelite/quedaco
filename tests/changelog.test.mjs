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
  assert.deepEqual(entriesSince(CHANGELOG,'0.4.8').map(entry=>entry.version),['0.5.0','0.4.33','0.4.32','0.4.31','0.4.30','0.4.29','0.4.28','0.4.27','0.4.26','0.4.25','0.4.24','0.4.23','0.4.22','0.4.21','0.4.20','0.4.19','0.4.18','0.4.17','0.4.16','0.4.15','0.4.13','0.4.12','0.4.11','0.4.10','0.4.9']);
  assert.deepEqual(entriesSince(CHANGELOG,'0.4.9').map(entry=>entry.version),['0.5.0','0.4.33','0.4.32','0.4.31','0.4.30','0.4.29','0.4.28','0.4.27','0.4.26','0.4.25','0.4.24','0.4.23','0.4.22','0.4.21','0.4.20','0.4.19','0.4.18','0.4.17','0.4.16','0.4.15','0.4.13','0.4.12','0.4.11','0.4.10']);
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
