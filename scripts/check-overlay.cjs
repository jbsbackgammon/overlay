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
const retiredColors = /--color-(?:20|40|80|90)\\b/;
assert.ok(!retiredColors.test(styles), 'Overlay CSS must use the six-color palette only');
const usedColors = [...styles.matchAll(/var\\(--color-(\\d+)\\b/g)].map((match) => Number(match[1]));
assert.ok(usedColors.every((level) => [25,45,60,85,95,100].includes(level)),
  'Overlay CSS must not reference undefined palette values');
assert.ok(editor.includes('common/ui.css?v=28'), 'Shared CSS v28 must be loaded');
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
  && styles.includes('color: var(--color-25, hsl(215 25% 25%));'), 'Base colors missing');
assert.ok(!js.includes('setProperty("--button-theme"'), 'Unused theme override remains');
assert.ok(!styles.includes('\n.jbsui-preset-input {') && !styles.includes('\n.jbsui-preset-input select {'),
  'Shared preset select must not be redefined in overlay styles');
for (const field of ['topMember', 'bottomMember', 'titlePreset', 'roundPreset']) {
  assert.ok(editor.includes('id="' + field + '"'),
    'Existing preset selector must be kept: ' + field);
}
assert.ok(editor.includes('class="control-panel jbsui"'), 'Missing JBS editor scope');
assert.ok(editor.includes('id="channelSelect" class="jbsui-select"'),
  'Stream selector must use the same common select state styles as right1–5');
assert.ok(!/\.channel-picker select\s*\{[^}]*(?:border:|border-color:|background-color:|color:|cursor:)/s.test(styles)
  && !styles.includes('.channel-picker select:not(:disabled):hover'),
  'Stream selector must not override common hover or focus styles');
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
assert.ok(js.includes('async function captureStagePngBlob(stage)')
  && js.includes('const blob = await captureStagePngBlob(stage);'),
  'PNG export must use one shared capture helper');
assert.ok(js.includes('if (blob?.size > 0) return blob;')
  && js.includes('if (typeof window.html2canvas === "function")')
  && js.includes('html2canvas fallback failed'),
  'A failed SVG/PNG renderer must retry with html2canvas');

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
// Exercise the actual PNG capture helper with stubbed browser renderers.
// The previous implementation failed immediately rather than attempting
// html2canvas whenever html-to-image was present but threw an exception.
const sourceStart = js.indexOf('async function captureStagePngBlob(stage) {');
const sourceEnd = js.indexOf('\nasync function exportStageAsPng() {', sourceStart);
assert.ok(sourceStart >= 0 && sourceEnd > sourceStart,
  'PNG capture helper must be independently testable');
const captureSource = js.slice(sourceStart, sourceEnd);
const makeCapture = (browser) => Function('window', 'console',
  captureSource + '\nreturn captureStagePngBlob;')(browser, { warn() {}, error() {} });

async function testPngCapture() {
  const stage = { id: 'stage-test' };
  const png = new Blob(['png-content'], { type: 'image/png' });

  let fallbackCalls = 0;
  const primary = makeCapture({
    htmlToImage: { toBlob: async () => png },
    html2canvas: async () => { fallbackCalls++; throw new Error('unexpected fallback'); }
  });
  assert.equal(await primary(stage), png, 'Successful SVG export must not invoke fallback');
  assert.equal(fallbackCalls, 0, 'Successful SVG export must not render twice');

  for (const failingRenderer of [
    async () => { throw new Error('SVG renderer blocked'); },
    async () => null
  ]) {
    let canvasCalls = 0;
    const retry = makeCapture({
      htmlToImage: { toBlob: failingRenderer },
      html2canvas: async (node, options) => {
        assert.equal(node, stage);
        assert.equal(options.width, 1920);
        assert.equal(options.height, 1080);
        assert.equal(options.useCORS, true);
        canvasCalls++;
        return { toBlob(callback, type) { assert.equal(type, 'image/png'); callback(png); } };
      }
    });
    assert.equal(await retry(stage), png, 'Fallback must produce a valid PNG blob');
    assert.equal(canvasCalls, 1, 'Fallback must run exactly once after SVG failure');
  }

  const fallbackOnly = makeCapture({
    html2canvas: async () => ({ toBlob(callback) { callback(png); } })
  });
  assert.equal(await fallbackOnly(stage), png, 'Fallback must work if primary is unavailable');

  const allFailed = makeCapture({
    htmlToImage: { toBlob: async () => { throw new Error('first failed'); } },
    html2canvas: async () => { throw new Error('second failed'); }
  });
  await assert.rejects(() => allFailed(stage), /All PNG renderers failed/,
    'Both renderer failures must be reported instead of silently pretending success');
}

testPngCapture()
  .then(() => console.log('Overlay initialization and PNG fallback checks passed.'))
  .catch((error) => { console.error(error); process.exitCode = 1; });
