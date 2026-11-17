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
  console.log('Chrome unavailable; skipping real-browser PNG smoke test.');
  process.exit(0);
}
const probe = "<script>\n(() => {\n  const root = document.documentElement;\n  const finish = (message) => root.setAttribute('data-png-smoke', message);\n  const expected = '13,14,15,16,17,18,19,20,21,22,23,24';\n  window.alert = (message) => finish('alert: ' + message);\n  let started = false;\n  const timer = setInterval(() => {\n    if (started || root.getAttribute('data-png-smoke')) return;\n    if (!document.querySelector('.stage') || typeof exportStageAsPng !== 'function') return;\n    if (!window.htmlToImage?.toBlob || typeof window.html2canvas !== 'function') return;\n    started = true;\n    clearInterval(timer);\n    try {\n      const board = document.querySelector('#boardPreset');\n      if (board?.value !== 'japan' || board?.querySelector('option[value=\"\"]'))\n        throw new Error('Board default is not Japan');\n      const upper = [...document.querySelectorAll('.point-guide.top .guide-half span')]\n        .map((item) => item.textContent).join(',');\n      if (upper !== expected) throw new Error('Upper guide numbering is wrong: ' + upper);\n      if (!getComputedStyle(document.querySelector('.point-guide.top')).backgroundImage.includes('gradient'))\n        throw new Error('Upper guide two-color background is missing');\n      const fontMain = getComputedStyle(document.querySelector('#openOutput')).fontSize;\n      const fontOther = getComputedStyle(document.querySelector('#saveSettings')).fontSize;\n      const fontSwap = getComputedStyle(document.querySelector('#swapPlayerNames')).fontSize;\n      if (fontMain !== '14px' || fontMain !== fontOther || fontMain !== fontSwap)\n        throw new Error('Shared button font size is inconsistent: ' + [fontMain, fontOther, fontSwap].join(','));\n      const optionBackground = getComputedStyle(board.querySelector('option')).backgroundColor;\n      if (optionBackground !== 'rgb(255, 255, 255)')\n        throw new Error('Native dropdown options are not white: ' + optionBackground);\n      const width = document.documentElement.clientWidth;\n      const expectedRightColumns = width <= 600 ? 2 : width <= 960 ? 3 : 5;\n      const rightColumns = getComputedStyle(document.querySelector('.right-selects')).gridTemplateColumns.split(' ').length;\n      if (rightColumns !== expectedRightColumns)\n        throw new Error('Right-slot grid mismatch at ' + width + 'px: ' + rightColumns);\n      const expectedEventColumns = width <= 820 ? 2 : width <= 1200 ? 3 : 4;\n      const eventColumns = getComputedStyle(document.querySelector('.event-fields')).gridTemplateColumns.split(' ').length;\n      if (eventColumns !== expectedEventColumns)\n        throw new Error('Player grid mismatch at ' + width + 'px: ' + eventColumns);\n      const firstRound = document.querySelector('.stage > .title-card .title-round');\n      const mirroredRound = document.querySelector('.title-card-right2 .title-round');\n      if (!firstRound || !mirroredRound || getComputedStyle(firstRound).color !== getComputedStyle(mirroredRound).color)\n        throw new Error('Mirrored tournament round styling is not synchronized');\n      state.round = '準決勝'; state.roundEn = 'SEMIFINAL'; render();\n      const roundInk = getComputedStyle(firstRound).color;\n      const panelInk = getComputedStyle(document.querySelector('.stage > .title-card .title-name')).color;\n      const updatedMirrorInk = getComputedStyle(document.querySelector('.title-card-right2 .title-round')).color;\n      if (roundInk !== panelInk || updatedMirrorInk !== panelInk)\n        throw new Error('Non-final text colors: original=' + roundInk + ', title=' + panelInk + ', mirrored=' + updatedMirrorInk + ', token=' + getComputedStyle(document.querySelector('.stage')).getPropertyValue('--round-text-color'));\n      state.round = '決勝'; state.roundEn = 'FINAL'; render();\n      window.htmlToImage.toBlob = async () => { throw new Error('Forced SVG failure for smoke test'); };\n      document.querySelector('#exportPng').click();\n      const checker = setInterval(async () => {\n        if (root.getAttribute('data-png-smoke')) { clearInterval(checker); return; }\n        if (document.querySelector('#exportPng')?.textContent !== 'PNG保存') return;\n        clearInterval(checker);\n        try {\n          const url = pendingPngDownload?.url;\n          if (!url) throw new Error('PNG download URL missing');\n          const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());\n          const header = [137, 80, 78, 71, 13, 10, 26, 10];\n          if (bytes.length < 1000 || !header.every((value, i) => bytes[i] === value))\n            throw new Error('Invalid PNG header or size: ' + bytes.length);\n          finish('success-' + bytes.length);\n        } catch (error) { finish('failed: ' + error.message); }\n      }, 100);\n    } catch (error) { finish('failed: ' + error.message); }\n  }, 100);\n  setTimeout(() => { if (!root.getAttribute('data-png-smoke')) finish('timeout'); }, 25000);\n})();\n</script>";
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
    const status = html.match(/data-png-smoke="([^"]+)"/)?.[1];
    assert.ok(status?.startsWith('success-'), 'Real-browser PNG smoke failed: ' + String(status));
    console.log('Real-browser PNG fallback succeeded (' + status + ' bytes).');
  } finally {
    server.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
