'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const candidates = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];
const chrome = process.env.CHROME_BIN || candidates.find((name) =>
  spawnSync('which', [name], { stdio: 'ignore' }).status === 0);
if (!chrome) {
  console.log('Chrome unavailable; skipping real-browser UI smoke test.');
  process.exit(0);
}
const probe = "<script>\n(() => {\n  const root = document.documentElement;\n  const finish = (message) => root.setAttribute('data-ui-smoke', message);\n  let started = false;\n  const poll = setInterval(() => {\n    if (started || root.getAttribute('data-ui-smoke')) return;\n    if (!document.querySelector('.stage') || typeof render !== 'function') return;\n    started = true;\n    clearInterval(poll);\n    try {\n      const requireCondition = (condition, message) => {\n        if (!condition) throw new Error(message);\n      };\n      const board = document.querySelector('#boardPreset');\n      requireCondition(board?.value === 'japan' && !board.querySelector('option[value=\"\"]'),\n        'Board default must be Japan without blank choice');\n      const upper = [...document.querySelectorAll('.point-guide.top .guide-half span')]\n        .map((item) => item.textContent).join(',');\n      requireCondition(upper === '13,14,15,16,17,18,19,20,21,22,23,24',\n        'Upper point guide numbering changed: ' + upper);\n      requireCondition(getComputedStyle(document.querySelector('.point-guide.top'))\n        .backgroundImage.includes('gradient'), 'Upper point guide color gradient is missing');\n      const buttonFonts = ['#openOutput', '#saveSettings', '#swapPlayerNames', '#swapPlayerColors']\n        .map((selector) => getComputedStyle(document.querySelector(selector)).fontSize);\n      requireCondition(buttonFonts.every((font) => font === '14px'),\n        'Shared button typography mismatch: ' + buttonFonts.join(','));\n      const dropdowns = ['right1Mode', 'right2Mode', 'right3Mode', 'right4Mode',\n        'right5Mode', 'channelSelect', 'titlePreset', 'roundPreset', 'panelMode', 'boardPreset'];\n      for (const id of dropdowns) {\n        const option = document.querySelector('#' + id + ' option');\n        requireCondition(getComputedStyle(option).fontSize === '14px',\n          'Opened dropdown font size changed: ' + id);\n        requireCondition(getComputedStyle(option).backgroundColor === 'rgb(255, 255, 255)',\n          'Opened dropdown background changed: ' + id);\n      }\n      requireCondition(getComputedStyle(document.querySelector('#right1Mode')).fontSize === '16px',\n        'Closed right-side dropdown must remain 16px');\n      requireCondition(getComputedStyle(document.querySelector('#titlePreset')).fontSize === '14px',\n        'Closed preset dropdown must remain 14px');\n      const width = document.documentElement.clientWidth;\n      const columns = (selector) => getComputedStyle(document.querySelector(selector))\n        .gridTemplateColumns.trim().split(/\\s+/).length;\n      requireCondition(columns('.right-selects') === (width <= 600 ? 2 : width <= 960 ? 3 : 5),\n        'Right-slot responsive layout mismatch');\n      requireCondition(columns('.event-fields') === (width <= 820 ? 2 : width <= 1200 ? 3 : 4),\n        'Player-entry responsive layout mismatch');\n      const title = document.querySelector('.stage > .title-card .title-name');\n      const round = document.querySelector('.stage > .title-card .title-round');\n      const mirror = () => document.querySelector('.title-card-right2 .title-round');\n      requireCondition(round && mirror() && getComputedStyle(round).color === getComputedStyle(mirror()).color,\n        'Mirrored round style changed');\n      state.round = '準決勝';\n      state.roundEn = 'SEMIFINAL';\n      render();\n      const normalColor = getComputedStyle(title).color;\n      requireCondition(getComputedStyle(round).color === normalColor &&\n        getComputedStyle(mirror()).color === normalColor,\n        'Non-final round should use panel text color on both panels');\n      state.round = '決勝';\n      state.roundEn = 'FINAL';\n      render();\n      requireCondition(!document.querySelector('#exportPng') &&\n        typeof exportStageAsPng === 'undefined' && typeof captureStagePngBlob === 'undefined',\n        'Removed PNG export is still accessible');\n      const field = document.querySelector('#topName');\n      field.value = '配信テスト選手';\n      field.dispatchEvent(new Event('input', { bubbles: true }));\n      requireCondition(state.topName === '配信テスト選手' &&\n        document.querySelector('[data-output=\"topName\"]').textContent === '配信テスト選手',\n        'Player name edit did not update the stage');\n      // Latin-script names remain the same in both language modes even if\n      // member.nameEn contains a country code; Japanese names still rotate.\n      const originalLanguage = state.english;\n      const originalTop = [state.topName, state.topNameEn];\n      const originalBottom = [state.bottomName, state.bottomNameEn];\n      const originalMode = languageMode;\n      state.english = true;\n      state.topName = 'John Smith';\n      state.topNameEn = 'USA';\n      state.bottomName = '柳 暢祐';\n      state.bottomNameEn = 'Nobusuke YANAGI';\n      languageMode = 'en';\n      render();\n      requireCondition(document.querySelector('[data-output=topName]').textContent === 'John Smith',\n        'Latin player name was incorrectly replaced by country code in English mode');\n      requireCondition(document.querySelector('[data-output=bottomName]').textContent === 'Nobusuke YANAGI',\n        'Japanese player name should switch to romanized name in English mode');\n      languageMode = 'ja';\n      render();\n      requireCondition(document.querySelector('[data-output=topName]').textContent === 'John Smith',\n        'Latin name changed in Japanese mode');\n      requireCondition(document.querySelector('[data-output=bottomName]').textContent === '柳 暢祐',\n        'Japanese player name did not return on rotation');\n      state.english = originalLanguage;\n      [state.topName, state.topNameEn] = originalTop;\n      [state.bottomName, state.bottomNameEn] = originalBottom;\n      languageMode = originalMode;\n      render();\n      finish('success');\n    } catch (error) {\n      finish('failed: ' + (error?.stack || error));\n    }\n  }, 100);\n  setTimeout(() => {\n    if (!root.getAttribute('data-ui-smoke')) finish('timeout');\n  }, 20000);\n})();\n</script>";
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript',
  '.css':'text/css', '.json':'application/json', '.png':'image/png',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.webp':'image/webp' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost/').pathname);
  const file = pathname === '/smoke.html' ? path.join(root, 'index.html')
    : path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  if (pathname === '/smoke.html') {
    res.end(fs.readFileSync(file, 'utf8').replace('</body>', probe + '</body>'));
  } else {
    fs.createReadStream(file).pipe(res);
  }
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    const html = await new Promise((resolve, reject) => {
      const args = ['--headless=new', '--no-sandbox', '--disable-gpu',
        '--disable-dev-shm-usage', '--no-first-run', '--disable-extensions',
        '--virtual-time-budget=30000', '--dump-dom',
        'http://127.0.0.1:' + port + '/smoke.html'];
      const child = spawn(chrome, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '', stderr = '';
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('Browser smoke timeout: ' + stderr.slice(-1000)));
      }, 90000);
      child.stdout.on('data', (chunk) => { stdout += String(chunk); });
      child.stderr.on('data', (chunk) => { stderr += String(chunk); });
      child.once('error', (error) => { clearTimeout(timeout); reject(error); });
      child.once('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) reject(new Error('Chrome exited ' + code + ': ' + stderr.slice(-1600)));
        else resolve(stdout);
      });
    });
    const status = html.match(/data-ui-smoke="([^"]+)"/)?.[1];
    assert.equal(status, 'success', 'Real-browser UI smoke failed: ' + String(status));
    console.log('Real-browser UI smoke succeeded (' + status + ').');
  } finally {
    server.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
