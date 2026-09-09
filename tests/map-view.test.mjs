import test from 'node:test';
import assert from 'node:assert/strict';
import {clampPan,focusRegion,zoomToPoint} from '../src/map-view.mjs';

const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} deveria ser ${expected}`);

test('clampPan mantém uma borda da imagem além do centro do visor',()=>{
  const state=clampPan({scale:2,tx:900,ty:-900},400,300,500,400);
  assert.equal(state.tx,250);
  assert.equal(state.ty,-400);
  const small=clampPan({scale:1,tx:90,ty:90},200,100,500,400);
  assert.deepEqual({tx:small.tx,ty:small.ty},{tx:150,ty:150});
});

test('zoomToPoint mantém o ponto do mapa sob o cursor',()=>{
  const before={scale:2,tx:-120,ty:35},point={x:210,y:140};
  const worldBefore={x:(point.x-before.tx)/before.scale,y:(point.y-before.ty)/before.scale};
  const after=zoomToPoint(before,point,1.15);
  close((point.x-after.tx)/after.scale,worldBefore.x);
  close((point.y-after.ty)/after.scale,worldBefore.y);
});

test('focusRegion centraliza o hotspot e mantém escala dentro dos limites',()=>{
  const regions=[{id:'norte',hotspot:[25,75]}],state=focusRegion('norte',regions,800,600);
  close(state.tx+800*.25*state.scale,400);
  close(state.ty+600*.75*state.scale,300);
  assert.ok(state.scale>=1&&state.scale<=6);
  assert.equal(focusRegion('ausente',regions,800,600),null);
});
