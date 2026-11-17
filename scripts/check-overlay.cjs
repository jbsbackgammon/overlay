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
assert.ok(editor.includes('common/ui.css?v=25'), 'Shared CSS v25 must be loaded');
assert.ok(editor.includes('class="jbsui-preset-input"') || editor.includes('class="jbsui-preset-input player-input"'),
  'Preset selectors must use the shared input-group component');
assert.ok(!styles.includes('.jbsui-preset-input select:focus'),
  'The four-sided focus style belongs only in common UI CSS');
assert.ok(js.includes('event.key === "Tab"')
  && js.includes('setAttribute("data-jbsui-keyboard-focus"')
  && js.includes('removeAttribute("data-jbsui-keyboard-focus"')
  && js.includes('addEventListener("pointerdown"'),
  'Keyboard-only focus ring must be enabled by Tab and cleared on pointer/touch input');
assert.ok(!/--(?:opacity-muted|shadow-primary)/.test(styles),
  'Retired long-form opacity and shadow token names must not remain');

assert.ok(!/--(?:opacity-disabled|opacity-inactive|opacity-editor-swatch-inactive|shadow-dialog|shadow-editor-preview)/.test(styles),
  'Retired opacity and shadow tokens must not remain');
assert.ok(!styles.includes('.title-fields.jbsui-inactive label')
  && !styles.includes('.panel-color-field.jbsui-inactive label')
  && !styles.includes('.panel-color-field.jbsui-inactive .panel-color-swatch')
  && !styles.includes('.title-fields.jbsui-inactive input:disabled')
  && !styles.includes('.panel-color-field.jbsui-inactive input:disabled'),
  'Inactive editor states must be supplied by common UI');
assert.ok((styles.match(/box-shadow: var\(--shadow\);/g) || []).length === 1,
  'Editor preview uses the shared shadow; dialog uses common UI shadow');

assert.ok(/\.channel-picker\s*\{[^}]*font-weight:\s*var\(--font-weight-normal\)/s.test(styles),
  'Stream selector must use weight 400 from common CSS');
assert.ok(/\[data-board-preset\]\s*\{[^}]*font-weight:\s*var\(--font-weight-normal\)/s.test(styles),
  'Board color select must use weight 400 from common CSS');
assert.ok(!styles.includes('background: var(--color-100) !important;')
  && !styles.includes('color: var(--color-20) !important;'),
  'Board preset must inherit the shared background and text colors');
assert.ok((styles.match(/!important/g) || []).length === 2
  && styles.includes('transform: none !important;'),
  'Only the output scaling override may use important (plus its documentation)');
assert.ok(!/\.jbsui\s+\.jbsui-preset-input\s+select\s*\{/.test(styles),
  'Shared preset selector sizing must not be overridden by overlay CSS');
assert.ok(js.includes('round: "１回戦",') && js.includes('roundEn: "Round of 64",'),
  'New editor sessions should default to first round in both languages');
assert.ok(js.includes('migrateOldEmptyRound') && js.includes('roundMigrationKey'),
  'Old blank defaults should migrate only once without clobbering user settings');

const editingStyles = styles.slice(styles.indexOf('.control-panel {'), styles.indexOf('.output-page {'))
  .replace(/\/\*[\s\S]*?\*\//g, '');
const embeddedLiterals = editingStyles.split('\n').filter(line =>
  /\b\d+(?:\.\d+)?(?:px|em|rem|ms|s)\b|rgba\s*\(|#[0-9a-f]{3,8}\b/i.test(line)
  && !/^\s*@media\s*\(/.test(line)
);
assert.deepEqual(embeddedLiterals, [],
  'Editor CSS properties must use named tokens, not embedded pixel/color/timing values');
assert.ok(styles.includes('--width-editor-swap: 80px;')
  && styles.includes('--width-editor-color-budget: 357px;'),
  'Tool-specific layout constants must be centralized outside editor declarations');
assert.ok(!styles.includes('--duration-short') && !styles.includes('--width-focus-outline'),
  'Retired interaction tokens must not remain');
assert.ok(!styles.includes('.player-photo-picker:focus-visible { outline:'),
  'Photo focus must inherit the common keyboard-focus outline');
assert.ok(!styles.includes('transition: opacity'),
  'Photo label display must not retain unnecessary animation');

assert.ok(styles.includes('height: var(--height-input);'),
  'Editor input and divider heights must share the input-height variable');
assert.ok(editor.includes('id="swapPlayerNames" class="swap-colors player-name-swap">上下入替</button>'),
  'Player swap button must show a single-line label');
assert.ok(editor.includes('id="swapPlayerColors" class="swap-colors">上下入替</button>')
  && styles.includes('--width-editor-swap: 80px;')
  && styles.includes('height: var(--height-input);')
  && styles.includes('white-space: nowrap;'),
  'Both swap buttons must align to 36px inputs and stay on one line');
for (const retired of ["--border-width","--button-height","--dialog-shadow","--divider-height","--font-12","--font-14","--font-16","--font-20","--font-24","--input-height","--label-height","--preset-select-width","--primary-shadow","--swatch-size","--weight-action","--weight-normal"]) {
  assert.ok(!styles.includes(retired), 'Retired naming must not remain: ' + retired);
}

assert.ok(styles.includes('font-family: var(--font-family, "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", system-ui, sans-serif);'),
  'Editor must reference the shared font-family and preserve the output-page fallback order');
assert.ok(styles.includes('border-radius: var(--radius);'), 'Editor radius token missing');
assert.ok(!styles.includes('--jbsui-'), 'Retired prefixed style token remains');
assert.ok(styles.includes('height: var(--height-input);')
  && styles.includes('width: var(--size-swatch);'), 'Shared 36px sizes missing');
assert.ok(styles.includes('background: var(--color-95, hsl(215 25% 95%));')
  && styles.includes('color: var(--color-20, hsl(215 25% 20%));'), 'Base colors missing');
assert.ok(!js.includes('setProperty("--button-theme"'), 'Unused theme override remains');
assert.ok(!styles.includes('\n.jbsui-preset-input {') && !styles.includes('\n.jbsui-preset-input select {'),
  'Shared preset select must not be redefined in overlay styles');
for (const field of ['topMember', 'bottomMember', 'titlePreset', 'roundPreset']) {
  assert.ok(editor.includes('id="' + field + '"'),
    'Existing preset selector must be kept: ' + field);
}
assert.ok(editor.includes('class="control-panel jbsui"'), 'Missing JBS editor scope');
for (const component of ['jbsui-color-control', 'jbsui-color-swatch', 'jbsui-hex-input',
  'jbsui-dialog', 'jbsui-dialog-head', 'jbsui-dialog-close']) {
  assert.ok(editor.includes(component), 'Missing shared UI component: ' + component);
}
for (const retired of ['.color-control {', '.jbsui-field input[type="color"] {',
  '.jbsui-field input[type="color"]::-webkit', '.settings-dialog-head {', '.dialog-close {',
  '.settings-dialog::backdrop', '\n.panel-color-swatch > input[type="color"] {']) {
  assert.ok(!styles.includes(retired), 'Reusable UI style must not be duplicated: ' + retired);
}

for (const name of ['jbsui-button', 'jbsui-divider', 'jbsui-check']) {
  assert.ok(editor.includes(name), 'Missing shared UI component: ' + name);
}
for (const duplicate of ['.settings-action {', '.action-separator {', '.sponsor-toggle {', '.jbsui-field { display: grid;', '.jbsui-field input, .jbsui-field select {']) {
  assert.ok(!styles.includes(duplicate), 'Duplicated local style: ' + duplicate);
}

assert.ok(styles.includes('grid-template-rows: var(--height-label) var(--height-input);'),
  'Editor fields must align their label and control rows in bilingual mode');
assert.ok(styles.includes('.title-fields > .jbsui-field > .jbsui-preset-input > select'),
  'Preset selects need the same height as Japanese and English inputs');
assert.ok(js.includes('brand.getEdition(name)'), 'Official editions must come from JBS common');
assert.ok(editor.includes('class="panel-color-swatch jbsui-color-swatch"'), 'Panel color preview must use the shared swatch');
assert.ok(editor.includes('class="jbsui-field board-color-field"') && editor.includes('<label for="boardPreset">ボードカラー</label>'),
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
