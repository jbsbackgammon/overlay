'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const js = fs.readFileSync('overlay.js','utf8');
const a = js.indexOf('const defaults = {'), b = js.indexOf('// Metallic panel presets.');
assert.ok(a >= 0 && b > a);
const api = Function(js.slice(a,b) + '\nreturn {sanitizeState, validMediaPath, safePhoto};')();
assert.equal(api.sanitizeState({round:'決勝',guideStart12:'500'},true).guideStart12,500);
assert.equal(api.sanitizeState({round:4,title:'日本選手権'}).round,undefined);
assert.throws(()=>api.sanitizeState({frameColor:'url(evil)'},true));
assert.throws(()=>api.sanitizeState({guideStart12:9000},true));
assert.throws(()=>api.sanitizeState({right1Mode:'thumbnail:assets/thumbnail/../x.png'},true));
assert.throws(()=>api.sanitizeState({topPhoto:'data:image/svg+xml;base64,AAAA'},true));
assert.equal(api.safePhoto('data:image/png;base64,AAAA'),true);
assert.equal(api.validMediaPath('assets/thumbnail/test.png','thumbnail'),true);
assert.equal(api.validMediaPath('assets/thumbnail/%2e%2e/test.png','thumbnail'),false);
const p = js.slice(js.indexOf('function persistState()'),js.indexOf('function applyExternalState('));
let sent=0;
const persist = Function('localStorage','stateChannel','state','storageKey','document','alert','console',
  'let lastStoredState=null, storageWarning=false;\n'+p+'\nreturn persistState;')(
  {setItem(){throw new Error('quota')}},{postMessage(){sent++}},{round:'決勝'},'key',{body:{classList:{contains:()=>true}}},()=>{}, {warn(){}});
persist();
assert.equal(sent,1);
console.log('Overlay validation and storage-failure continuity passed.');
