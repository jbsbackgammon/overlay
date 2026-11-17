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

for (const id of ['openOutput', 'createThumbnail', 'topMember', 'bottomMember', 'titlePreset', 'right1Mode', 'right2Mode', 'right3Mode', 'right4Mode', 'right5Mode']) {
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
assert.ok(!editor.includes('大会名パネル'), 'Use 大会パネル consistently in editor labels');
assert.ok(editor.includes('大会パネルカラー'), 'Tournament panel color label is missing');
const styles = read('styles.css');
assert.ok(editor.includes('common/ui.css?v=6'), 'Shared JBS UI stylesheet missing');
assert.ok(styles.includes('border-radius: var(--jbs-ui-radius-control);')
  && styles.includes('border-radius: var(--jbs-ui-radius-button);')
  && styles.includes('border-radius: var(--jbs-ui-radius-dialog);'),
  'Overlay editor must use brand management corner radius tokens');
assert.ok(!styles.includes('var(--jbs-ui-radius-preview)')
  && !styles.includes('var(--jbs-ui-radius)'),
  'Retired UI corner radius tokens must not remain');

assert.ok(!styles.includes('var(--jbs-ui-font-13)') && !styles.includes('var(--jbs-ui-weight-label)'),
  'Editor must not reference retired typography tokens');
assert.ok(styles.includes('height: var(--jbs-ui-input-height);') && styles.includes('width: var(--jbs-ui-swatch-size);'),
  'Inputs and previews must use shared 36px tokens');
assert.ok(styles.includes('background: var(--jbs-ui-page-bg, hsl(215 25% 95%));'),
  'Editor and preview page backgrounds must use the seven-tone palette');
assert.ok(styles.includes('color: var(--jbs-ui-text, hsl(215 25% 20%));'),
  'Editor base text must use the twenty-percent tone');
assert.ok(!styles.includes('\n.preset-input {') && !styles.includes('\n.preset-input select {'),
  'Shared preset select must not be redefined in overlay styles');
for (const field of ['topMember', 'bottomMember', 'titlePreset', 'roundPreset']) {
  assert.ok(editor.includes('id="' + field + '"'),
    'Existing preset selector must be kept: ' + field);
}
assert.ok(editor.includes('class="control-panel jbs-ui"'), 'Missing JBS editor scope');
for (const name of ['jbs-ui-button', 'jbs-ui-divider', 'jbs-ui-check']) {
  assert.ok(editor.includes(name), 'Missing shared UI component: ' + name);
}
for (const duplicate of ['.settings-action {', '.action-separator {', '.sponsor-toggle {', '.field { display: grid;', '.field input, .field select {']) {
  assert.ok(!styles.includes(duplicate), 'Duplicated local style: ' + duplicate);
}

assert.ok(styles.includes('grid-template-rows: var(--jbs-ui-label-height) var(--jbs-ui-input-height);'),
  'Editor fields must align their label and control rows in bilingual mode');
assert.ok(styles.includes('.title-fields > .field > .preset-input > select'),
  'Preset selects need the same height as Japanese and English inputs');
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
assert.ok(editor.includes('id="createThumbnail" type="button">サムネ作成</button>'),
  'Thumbnail button is missing');
assert.ok(js.includes('jbs-thumbnail-ready') && js.includes('jbs-overlay-thumbnail-data'),
  'Cross-window thumbnail handshake is incomplete');
assert.ok(js.includes('event.source !== handoff.popup') && js.includes('event.origin !== handoff.origin'),
  'Thumbnail handoff must verify the requesting window and origin');
assert.ok(js.includes('leftPhoto: state.topPhoto') && js.includes('rightPhoto: state.bottomPhoto'),
  'Uploaded player photos must be transferred');
assert.ok(js.includes('window.open(url.href, "_blank")'),
  'Thumbnail editor must open in a fresh window to keep opener linkage reliable');
const version = editor.match(/overlay\.js\?v=([^"']+)/)?.[1];
assert.ok(version && output.includes('overlay.js?v=' + version), 'Editor/output script version mismatch');
console.log('Overlay initialization checks passed.');
