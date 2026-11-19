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
const editorRowClasses = ['top-actions', 'right-selects', 'title-fields', 'event-fields', 'color-row'];
const editorRowOffsets = editorRowClasses.map(name =>
  editor.search(new RegExp('<div class="[^"]*\\b' + name + '\\b[^"]*">'))
);
assert.ok(editorRowOffsets.every((offset, index) => offset >= 0 && (index === 0 || offset > editorRowOffsets[index - 1])),
  'Editor rows must be ordered: actions, right slots, tournament, players, colors');
assert.ok(!editor.includes('大会名パネル'), 'Use 大会パネル consistently in editor labels');
assert.ok(editor.includes('大会パネルカラー'), 'Tournament panel color label is missing');
const styles = read('styles.css');
const retiredColors = /--color-(?:20|40|80|90)\b/;
assert.ok(!retiredColors.test(styles), 'Overlay CSS must use the six-color palette only');
const usedColors = [...styles.matchAll(/var\(--color-(\d+)\b/g)].map((match) => Number(match[1]));
assert.ok(usedColors.every((level) => [25,45,60,85,95,100].includes(level)),
  'Overlay CSS must not reference undefined palette values');
assert.ok(editor.includes('common/ui.css?v=53'), 'Shared CSS v53 must be loaded');
assert.ok(editor.includes('https://jbsbackgammon.github.io/common/ui.js?v=1')
  && !editor.includes('id="saveCompleteDialog"')
  && !editor.includes('jbsui-save-complete-dialog'),
  'Save confirmation must use the common button-only helper, without any modal');
assert.ok(js.includes('localStorage.setItem(savedSettingsKey, JSON.stringify(entries.slice(0, 100)));')
  && js.includes('JBSUI.showButtonFeedback(event.currentTarget);')
  && !js.includes('saveCompleteTimer')
  && !js.includes('saveCompleteDialog'),
  'Successful settings saves must trigger shared button-only feedback');
assert.ok(editor.includes('https://jbsbackgammon.github.io/common/naming.js?v=1'),
  'Overlay must load the shared JBS naming library');
assert.ok(js.includes('JBSNaming.formatSavedLabel({ savedAt: entry.savedAt, ...entry.state })')
  && js.includes('JBSNaming.makeFileName({ prefix: "配信盤面", ...state })'),
  'Saved settings list and JSON export must both use JBS common naming rules');
assert.ok(!js.includes('function settingLabel(')
  && !js.includes('function formatSavedAt(')
  && !js.includes('配信盤面設定-'),
  'Local naming rules and timestamp-based JSON filenames must be retired');
assert.ok(editor.includes('class="open-output jbsui-button jbsui-button--primary jbsui-button--primary-action"')
  && !/\.open-output\s*\{[^}]*font-size\s*:/s.test(styles),
  'Broadcast button must inherit the same 14px type size as all shared buttons');
assert.ok(!styles.includes('select option {') && !styles.includes('select > option {'),
  'Dropdown list colors belong to common CSS, not per-tool CSS');
assert.ok(!js.includes('function padNativeSelectOptions(select)')
  && !js.includes('selectPopupGutter'),
  'Browser-specific option label mutation must not interfere with input layout');
assert.ok(styles.includes('grid-template-columns: repeat(2, minmax(var(--width-editor-player-min), 1fr)) var(--width-editor-swap) max-content;')
  && styles.includes('.display-toggles > .jbsui-check {')
  && styles.includes('white-space: nowrap;'),
  'Player input widths must adapt to the exact single-line width of display toggles');

assert.ok(editor.includes('jbsui-preset-picker') && editor.includes('jbsui-preset-button'),
  'Preset selectors must use the shared fixed-label picker component');
assert.ok(!styles.includes('.jbsui-preset-input select:focus'),
  'The four-sided focus style belongs only in common UI CSS');
assert.ok(js.includes('event.key === "Tab"')
  && js.includes('setAttribute("data-jbsui-keyboard-focus"')
  && js.includes('removeAttribute("data-jbsui-keyboard-focus"')
  && js.includes('addEventListener("pointerdown"'),
  'Keyboard-only focus ring must be enabled by Tab and cleared on pointer/touch input');
assert.ok(!/--(?:opacity-muted|shadow-primary)/.test(styles),
  'Retired long-form opacity and shadow token names must not remain');
for (const token of ['--charcoal', '--accent', '--tournament-sub-color', '--button-top', '--button-bottom', '--guide-color']) {
  assert.ok(!styles.includes(token + ':') && !js.includes('setProperty("' + token + '"'),
    'Unused design token must be removed: ' + token);
}
assert.ok(styles.includes('color: var(--round-text-color, #cf2933);')
  && js.includes('stage.style.setProperty("--round-text-color", isFinal')
  && !js.includes('roundOutput.style.color ='),
  'Tournament round color must be controlled by a shared CSS variable for both panels');
assert.ok(!styles.includes('display: flex;\n  display: block;')
  && !styles.includes('.event-fields, .color-row { grid-template-columns: 1fr; }')
  && !styles.includes('.event-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }'),
  'Conflicting legacy display and responsive column rules must be removed');
assert.ok(styles.includes('.right-selects { grid-template-columns: repeat(5, minmax(0, 1fr));')
  && styles.includes('.title-fields { grid-template-columns: repeat(3, minmax(0, 1fr)); }')
  && styles.includes('.event-fields { grid-template-columns: minmax(0, 1fr) var(--width-editor-swap); }'),
  'Effective desktop and mobile grid layouts must be preserved');

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
assert.ok(!/\[data-board-preset\]\s*\{[^}]*font-weight\s*:/s.test(styles),
  'Board color select typography must come from common CSS');
assert.ok(!styles.includes('background: var(--color-100) !important;')
  && !styles.includes('color: var(--color-25) !important;'),
  'Board preset must inherit the shared background and text colors');
assert.ok((styles.match(/!important/g) || []).length === 2
  && styles.includes('transform: none !important;'),
  'Only the output scaling override may use important (plus its documentation)');
assert.ok(!/\.jbsui\s+\.jbsui-preset-input\s+select\s*\{/.test(styles),
  'Shared preset selector sizing must not be overridden by overlay CSS');
assert.ok(js.includes('round: "決勝",') && js.includes('roundEn: "FINAL",'),
  'New editor sessions should default to the final in both languages');
assert.ok(js.includes('"決勝": "FINAL"'),
  'Japanese final must match the English preset label');
assert.ok(js.includes('migrateOldEmptyRound') && js.includes('roundMigrationKey'),
  'Old blank defaults should migrate only once without clobbering user settings');
assert.ok(!js.includes('savedState.round === "準決勝"'),
  'Valid saved semifinals must not be replaced with the default final');
assert.ok(js.includes('const STAGE_WIDTH = 1920;') && js.includes('const STAGE_HEIGHT = 1080;'),
  'OBS canvas and editor preview must share one resolution');
assert.ok(js.includes('design.getPropertyValue("--width-editor-preview-max")')
  && js.includes('design.getPropertyValue("--width-editor-preview")')
  && js.includes('design.getPropertyValue("--space-12")')
  && !js.includes('Math.min(1200,'),
  'Preview sizing must use the CSS design tokens, not duplicate numeric constants');
assert.equal((js.match(/Object\.hasOwn\(defaults, key\)/g) || []).length, 3,
  'Only owned state fields may be accepted from URL or imported JSON');
for (const unused of ['sponsor-shop', 'sponsor-kifu', 'sponsor-service', 'sponsor-wordmark',
  'dice-mark', 'thumbnail-picker']) {
  assert.ok(!styles.includes('.' + unused), 'Unused CSS selector remains: ' + unused);
}
assert.ok(styles.includes('.jbsui .swap-colors {')
  && !styles.includes('.swap-colors:hover')
  && !/\.jbsui\s+\.swap-colors\s*\{[^}]*(?:border:|background:|font-size:|font-weight:)/s.test(styles),
  'Player swap buttons must inherit common JBS button appearance');
for (const breakpoint of [1200, 960, 820, 680, 600]) {
  const count = styles.split('@media (max-width: ' + breakpoint + 'px)').length - 1;
  assert.equal(count, 1, 'Breakpoint rules must be grouped, one block per width: ' + breakpoint);
}


const editingStyles = styles.slice(styles.indexOf('.control-panel {'), styles.indexOf('.output-page {'))
  .replace(/\/\*[\s\S]*?\*\//g, '');
const embeddedLiterals = editingStyles.split('\n').filter(line =>
  /\b\d+(?:\.\d+)?(?:px|em|rem|ms|s)\b|rgba\s*\(|#[0-9a-f]{3,8}\b/i.test(line)
  && !/^\s*@media\s*\(/.test(line)
);
assert.deepEqual(embeddedLiterals, [],
  'Editor CSS properties must use named tokens, not embedded pixel/color/timing values');
assert.ok(styles.includes('--width-editor-swap: 80px;')
  && styles.includes('--width-editor-color-budget: 357px;')
  && !styles.includes('--width-editor-primary-min'),
  'Tool-specific layout constants must be centralized outside editor declarations');
assert.ok(!styles.includes('--duration-short') && !styles.includes('--width-focus-outline'),
  'Retired interaction tokens must not remain');
assert.ok(!styles.includes('.player-photo-picker:focus-visible { outline:'),
  'Photo focus must inherit the common keyboard-focus outline');
assert.ok(!styles.includes('transition: opacity'),
  'Photo label display must not retain unnecessary animation');

assert.ok(styles.includes('height: var(--height-input);'),
  'Editor input and divider heights must share the input-height variable');
assert.ok(editor.includes('id="swapPlayerNames" class="swap-colors player-name-swap jbsui-button">上下入替</button>'),
  'Player swap button must show a single-line label');
assert.ok(editor.includes('id="swapPlayerColors" class="swap-colors jbsui-button">上下入替</button>')
  && styles.includes('--width-editor-swap: 80px;')
  && styles.includes('height: var(--height-input);')
  && styles.includes('white-space: nowrap;'),
  'Both swap buttons must align to 36px inputs and stay on one line');
for (const retired of ["--border-width","--button-height","--dialog-shadow","--divider-height","--font-12","--font-14","--font-16","--font-20","--font-24","--input-height","--label-height","--preset-select-width","--primary-shadow","--swatch-size","--weight-action","--weight-normal"]) {
  assert.ok(!styles.includes(retired), 'Retired naming must not remain: ' + retired);
}

assert.ok(styles.includes('font-family: var(--font-family, "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", system-ui, sans-serif);'),
  'Editor must reference the shared font-family and preserve the output-page fallback order');
assert.ok(editor.includes('jbsui-panel') && editor.includes('jbsui-player-photo-picker'),
  'Shared panel radius and 36px player-photo sizing must come from common UI');
assert.ok(!styles.includes('--jbsui-'), 'Retired prefixed style token remains');
assert.ok(styles.includes('height: var(--height-input);'), 'Tool-specific editor alignment must use the shared input height');
assert.ok(styles.includes('background: var(--color-95, hsl(215 25% 95%));')
  && styles.includes('color: var(--color-25, hsl(215 25% 25%));'), 'Base colors missing');
assert.ok(!js.includes('setProperty("--button-theme"'), 'Unused theme override remains');
assert.ok(!styles.includes('\n.jbsui-preset-input {') && !styles.includes('\n.jbsui-preset-input select {'),
  'Shared preset select must not be redefined in overlay styles');
for (const field of ['topMember', 'bottomMember', 'titlePreset', 'roundPreset']) {
  assert.ok(editor.includes('id="' + field + '"'),
    'Existing preset selector must be kept: ' + field);
}
assert.ok(editor.includes('class="control-panel jbsui jbsui-panel"'), 'Missing shared JBS editor panel scope');
assert.ok(editor.includes('id="channelSelect" class="jbsui-select"'),
  'Stream selector must use the same common select state styles as right1–5');
assert.ok(!/\.channel-picker select\s*\{[^}]*(?:border:|border-color:|background-color:|color:|cursor:)/s.test(styles)
  && !styles.includes('.channel-picker select:not(:disabled):hover'),
  'Stream selector must not override common hover or focus styles');
for (const component of ['jbsui-color-control', 'jbsui-color-swatch', 'jbsui-hex-input',
  'jbsui-dialog', 'jbsui-dialog-head', 'jbsui-dialog-close',
  'jbsui-settings-dialog', 'jbsui-saved-settings',
  'jbsui-player-entry-row', 'jbsui-player-photo-picker', 'jbsui-player-photo-preview']) {
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
assert.ok(!styles.includes('.title-fields > .jbsui-field > .jbsui-preset-input > select')
  && !styles.includes('.title-fields > .jbsui-field > label {'),
  'Shared field heights and label line-height must come from common CSS');
assert.ok(js.includes('brand.getEdition(name)'), 'Official editions must come from JBS common');
assert.ok(editor.includes('class="panel-color-swatch jbsui-color-swatch"'), 'Panel color preview must use the shared swatch');
assert.ok(js.includes('gradient: "linear-gradient(') && js.includes('silver: "linear-gradient(')
  && js.includes('bronze: "linear-gradient('),
  'All three metallic choices must keep their preview gradients');
assert.ok(editor.includes('class="jbsui-field board-color-field"') && editor.includes('<label for="boardPreset">ボードカラー</label>'),
  'Board color field label or divider anchor is missing');
assert.ok(!editor.includes('<option value="">選択</option>\n              <option value="japan"'),
  'Board color selector must not offer an empty placeholder');
assert.ok(js.includes('boardPreset: "japan"') && js.includes('japan: defaultJapanBoardColors')
  && js.includes('if (!boardPresets[target.boardPreset]) target.boardPreset = defaults.boardPreset;'),
  'Japan must be the initial board preset, including legacy empty selections');
assert.ok(stage.includes('first"><span>13</span><span>14</span><span>15</span><span>16</span><span>17</span><span>18</span>')
  && stage.includes('second"><span>19</span><span>20</span><span>21</span><span>22</span><span>23</span><span>24</span>'),
  'Upper guide must display 13 through 24');
assert.ok(styles.includes('var(--guide-background) var(--guide-goal-left)')
  && styles.includes('var(--guide-goal-background) var(--guide-goal-left)')
  && js.includes('"--guide-goal-background", rgba(state.topColor, 0.7)')
  && js.includes('"--guide-background", rgba(state.bottomColor, 0.7)'),
  'Upper points use bottom color while upper goal uses top color without gaps');
assert.ok(read('styles.css').includes('.board-color-field::before'),
  'Missing vertical divider between panel and board colors');
assert.ok(styles.includes('.panel-color-control {') && styles.includes('align-items: end;'),
  'Panel color inputs must bottom-align with the board selector');
assert.ok(styles.includes('.panel-color-field { margin-right: var(--space-4); }')
  && styles.includes('padding-right: calc(var(--space-8) + var(--width-border));')
  && styles.includes('margin-left: calc(var(--space-4) + var(--width-border));')
  && styles.includes('left: calc(-1 * (var(--space-12) + var(--width-border)));')
  && styles.includes('bottom: 0;'),
  'Panel/board divider must match top-row 12px spacing and input control height');
assert.ok(js.includes('"--color-swatch-background", metallicBackground || state.panelColor'),
  'Panel preview must use the common swatch background variable for solid and metallic modes');
assert.ok(!styles.includes('--panel-swatch-background')
  && !js.includes('--panel-swatch-background'),
  'Retired overlay-only swatch variable must not override the common component');
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
const firstActionRow = editor.slice(editor.indexOf('<div class="top-actions'),
  editor.indexOf('</div>', editor.indexOf('<div class="top-actions')));
assert.ok(firstActionRow.indexOf('id="openOutput"') >= 0
  && firstActionRow.indexOf('id="openOutput"') < firstActionRow.indexOf('id="channelSelect"'),
  'Broadcast button must precede the stream selector');
const channelExpression = js.match(/^const channel = (.+);$/m)?.[1];
assert.ok(channelExpression, 'Missing stream selector logic');
const resolveChannel = value => {
  const query = new URLSearchParams('channel=' + value);
  return Function('query', 'return ' + channelExpression)(query);
};
assert.deepEqual(['1', '2', '3', 'unknown'].map(resolveChannel), ['1', '2', '3', '1'],
  'Stream selection must accept all three channels and default to 1');

assert.ok(js.includes('function isLatinName(value)') &&
  js.includes('if (isPlayerName && isLatinName(original)) return original;'),
  'Romanized player names must remain unchanged in English mode');
assert.ok(js.includes('if (input) input.disabled = Boolean(state.english && isLatinName(state[`${side}Name`]));')
  && js.includes('  updateEnglishFields();\n  stage.style.setProperty("--frame-color", state.frameColor);'),
  'Latin-script players must have disabled English name fields, refreshed on every render');
const isLatinSourceStart = js.indexOf('function isLatinName(value) {');
const isLatinSourceEnd = js.indexOf('\nfunction isForeignMember(member)', isLatinSourceStart);
assert.ok(isLatinSourceStart >= 0 && isLatinSourceEnd > isLatinSourceStart);
const testIsLatinName = Function(js.slice(isLatinSourceStart, isLatinSourceEnd) +
  '\nreturn isLatinName;')();
assert.equal(testIsLatinName('John Smith'), true);
assert.equal(testIsLatinName('François Dupont'), true);
assert.equal(testIsLatinName('柳 暢祐'), false);
assert.equal(testIsLatinName('柳 John'), false);

assert.ok(js.includes('const storageKey = channel === "1" ? "jbs-overlay-state" : `jbs-overlay-state-${channel}`;'),
  'Per-stream storage key must remain unique and backwards compatible');
assert.ok(js.includes('const stateChannelName = `jbs-overlay-live-${channel}`;'),
  'Each stream needs a separate live BroadcastChannel');
assert.ok(js.includes('if (channel !== "1") outputUrl.searchParams.set("channel", channel);')
  && js.includes('outputUrl.searchParams.set("z", await JBSOutputSnapshot.encode(snapshot, defaults));')
  && js.includes('outputUrl.searchParams.set("s", encodeOutputState(snapshot));')
  && !js.includes('outputUrl.searchParams.set("state",')
  && !js.includes('outputUrl.searchParams.set("v",'),
  'New OBS links must prefer compressed snapshots and retain a safe fallback');
assert.ok(js.includes('window.__jbsCompressedSnapshot')
  && js.includes('query.get("s") || query.get("state")')
  && output.includes("JBSOutputSnapshot.decode(packed)"),
  'Compressed output and older self-contained URLs must both load');
assert.ok(editor.includes('snapshot.js?v=1')
  && output.includes('snapshot.js?v=1')
  && output.includes('window.__jbsCompressedSnapshot = await JBSOutputSnapshot.decode(packed);'),
  'Both pages must load the local compression codec and decode before startup');
assert.ok(js.includes('JSON.stringify(item) !== JSON.stringify(defaults[key])')
  && read('snapshot.js').includes('JSON.stringify(state[key]) === JSON.stringify(defaults[key])'),
  'Both compact URL formats must include only changed values');
assert.ok(js.includes('jbs-overlay-output-${channel}'),
  'Output tabs must remain separate for each stream');
assert.ok(!editor.includes('id="exportPng"')
  && !editor.includes('html2canvas')
  && !editor.includes('vendor/html-to-image.js')
  && !js.includes('captureStagePngBlob')
  && !js.includes('exportStageAsPng')
  && !js.includes('pendingPngDownload'),
  'Removed PNG export must not leave unused UI, scripts or state');

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

const migrationStart = js.indexOf('function loadSharedState() {');
const migrationEnd = js.indexOf('\n// The shared UI focus ring', migrationStart);
assert.ok(migrationStart >= 0 && migrationEnd > migrationStart,
  'Stored-state migration must remain directly testable');
const migrationSource = js.slice(migrationStart, migrationEnd);
const migrateSavedState = Function('saved', 'migrationDone', `
  const embeddedState = null;
  const fromQuery = {};
  const storageKey = 'test-overlay';
  const defaults = { edition: 'JBS 第　回', round: '決勝', roundEn: 'FINAL',
    guideVerticalGap: 0, guideStart12: 500, guideStart6: 910,
    guideGoalStart: 1255, guidePointGap: 62, panelColor: '#FFFFFF' };
  let state = { ...defaults };
  let saves = 0;
  const localStorage = {
    data: new Map([['test-overlay', JSON.stringify(saved)],
      ...(migrationDone ? [['test-overlay-default-round-v1', '1']] : [])]),
    getItem(key) { return this.data.get(key) ?? null; },
    setItem(key, value) { this.data.set(key, value); }
  };
  const normalizeLegacyMediaModes = (value) => value;
  const persistState = () => { saves += 1; };
  ` + migrationSource + `
  loadSharedState();
  return { state, saves };
`);
assert.equal(migrateSavedState({ round: '準決勝', roundEn: 'SEMIFINAL' }, true).state.round,
  '準決勝', 'Manually saved semifinals must survive reloads');
assert.equal(migrateSavedState({ round: '' }, false).state.round,
  '決勝', 'Legacy blank round must migrate to final');
assert.equal(migrateSavedState({ round: '（未選択）' }, true).state.round,
  '決勝', 'Legacy placeholder must migrate even when initial migration completed');

const version = editor.match(/overlay\.js\?v=([^"']+)/)?.[1];
assert.ok(version && output.includes('overlay.js?v=' + version), 'Editor/output script version mismatch');
const cssVersion = editor.match(/styles\.css\?v=([^"']+)/)?.[1];
assert.ok(cssVersion && output.includes('styles.css?v=' + cssVersion),
  'Editor and OBS output must load the same CSS version');
const stageVersion = editor.match(/stage\.html\?v=([^"']+)/)?.[1];
assert.ok(stageVersion && output.includes('stage.html?v=' + stageVersion),
  'Editor and OBS output must load the same stage markup version');
console.log('Overlay static and state-management checks passed.');
