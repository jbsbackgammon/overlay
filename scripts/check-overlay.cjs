'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');
const js = read('overlay.js');
const editor = read('index.html');
const output = read('output.html');
const stage = read('stage.html');

// A single-element querySelector result has no forEach method.
// This mistake previously halted all editor initialization.
const badLoops = [...js.matchAll(/(?<!\$)\$\(\s*(?:"[^"\n]*"|'[^'\n]*')\s*\)\s*\.forEach\s*\(/g)];
assert.equal(badLoops.length, 0, 'Use $$() instead of $() when iterating over matched elements');

for (const id of ['openOutput', 'topMember', 'bottomMember', 'titlePreset', 'right1Mode', 'right2Mode', 'right3Mode', 'right4Mode', 'right5Mode']) {
  assert.ok(editor.includes('id="' + id + '"'), 'Missing editor control: ' + id);
}
for (const number of [3, 4, 5]) {
  assert.ok(stage.includes('slot-reference-' + number), 'Missing preview slot: right' + number);
}
for (const call of ['render();', 'bindEditor();', 'loadCommonBrand();', 'loadMembers();', 'loadMediaLibrary();', 'fitStage();']) {
  assert.ok(js.includes(call), 'Missing initializer: ' + call);
}
assert.ok(js.includes('"right5Mode", mediaLibrary.ads'), 'Missing right5 image options');
assert.ok(js.includes('modes.right3 === "rules34"'), 'Missing rules for right3 and right4');
assert.ok(js.includes('modes.right4 === "rules45"'), 'Missing rules for right4 and right5');
assert.ok(editor.includes('common/brand.js'), 'Missing shared brand library');
assert.ok(js.includes('brand.getEdition(name)'), 'Official editions must come from JBS common');
assert.ok(editor.includes('class="panel-color-swatch"'), 'Panel color preview container is required');
assert.ok(editor.includes('class="field board-color-field"') && editor.includes('<label for="boardPreset">ボードカラー</label>'),
  'Board color field label or divider anchor is missing');
assert.ok(read('styles.css').includes('.board-color-field::before'),
  'Missing vertical divider between panel and board colors');
assert.ok(js.includes('"--panel-swatch-background", metallicBackground || state.panelColor'),
  'Panel preview must use the same metallic gradient or solid color as the broadcast panel');
assert.ok(js.includes('panelField.classList.toggle("is-gradient", Boolean(metallicBackground))'),
  'Gradient selection must activate the swatch display');
assert.ok(read('styles.css').includes('.panel-color-field.is-gradient .panel-color-swatch > input[type="color"]'),
  'Native solid-color input must not obscure metallic gradient previews');
assert.ok(js.includes('state.editionSource === state.title'), 'Linked editions must refresh on common load');
assert.ok(js.includes('state.editionSource = "";'), 'Manual editions must detach from common');
assert.ok(js.includes('state.edition === defaults.edition'), 'Initial placeholder should use common edition');
// Channels 1–3 must each have their own persisted state, live-sync
// channel and live-output window, while preserving channel 1's legacy key.
for (const channel of ['1', '2', '3']) {
  assert.ok(editor.includes('<option value="' + channel + '">配信' + channel + '</option>'),
    'Missing stream option: ' + channel);
}
const channelExpression = js.match(/^const channel = (.+);$/m)?.[1];
assert.ok(channelExpression, 'Missing stream selector logic');
const resolveChannel = value => {
  const query = new URLSearchParams('channel=' + value);
  return Function('query', 'return ' + channelExpression)(query);
};
assert.deepEqual(['1', '2', '3', 'unknown'].map(resolveChannel), ['1', '2', '3', '1'],
  'Stream selection must accept all three channels and default to 1');
assert.ok(js.includes('const storageKey = channel === "1" ? "jbs-overlay-state" : `jbs-overlay-state-${channel}`;'),
  'Per-stream storage key must remain unique and backwards compatible');
assert.ok(js.includes('const stateChannelName = `jbs-overlay-live-${channel}`;'),
  'Each stream needs a separate live BroadcastChannel');
assert.ok(js.includes('outputUrl.searchParams.set("channel", channel);'),
  'Output page must use the selected stream');
assert.ok(js.includes('jbs-overlay-output-${channel}'),
  'Output tabs must remain separate for each stream');
const version = editor.match(/overlay\.js\?v=([^"']+)/)?.[1];
assert.ok(version && output.includes('overlay.js?v=' + version), 'Editor/output script version mismatch');
console.log('Overlay initialization checks passed.');
