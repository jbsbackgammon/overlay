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
const probe = "<script>\n(() => {\n  const root = document.documentElement;\n  const finish = (message) => root.setAttribute('data-png-smoke', message);\n  const expected = '13,14,15,16,17,18,19,20,21,22,23,24';\n  window.alert = (message) => finish('alert: ' + message);\n  let started = false;\n  const timer = setInterval(() => {\n    if (started || root.getAttribute('data-png-smoke')) return;\n    if (!document.querySelector('.stage') || typeof exportStageAsPng !== 'function') return;\n    if (!window.htmlToImage?.toBlob || typeof window.html2canvas !== 'function') return;\n    started = true;\n    clearInterval(timer);\n    try {\n      const board = document.querySelector('#boardPreset');\n      if (board?.value !== 'japan' || board?.querySelector('option[value=\"\"]'))\n        throw new Error('Board default is not Japan');\n      const upper = [...document.querySelectorAll('.point-guide.top .guide-half span')]\n        .map((item) => item.textContent).join(',');\n      if (upper !== expected) throw new Error('Upper guide numbering is wrong: ' + upper);\n      if (!getComputedStyle(document.querySelector('.point-guide.top')).backgroundImage.includes('gradient'))\n        throw new Error('Upper guide two-color background is missing');\n      window.htmlToImage.toBlob = async () => { throw new Error('Forced SVG failure for smoke test'); };\n      document.querySelector('#exportPng').click();\n      const checker = setInterval(async () => {\n        if (root.getAttribute('data-png-smoke')) { clearInterval(checker); return; }\n        if (document.querySelector('#exportPng')?.textContent !== 'PNG保存') return;\n        clearInterval(checker);\n        try {\n          const url = pendingPngDownload?.url;\n          if (!url) throw new Error('PNG download URL missing');\n          const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());\n          const header = [137, 80, 78, 71, 13, 10, 26, 10];\n          if (bytes.length < 1000 || !header.every((value, i) => bytes[i] === value))\n            throw new Error('Invalid PNG header or size: ' + bytes.length);\n          finish('success-' + bytes.length);\n        } catch (error) { finish('failed: ' + error.message); }\n      }, 100);\n    } catch (error) { finish('failed: ' + error.message); }\n  }, 100);\n  setTimeout(() => { if (!root.getAttribute('data-png-smoke')) finish('timeout'); }, 25000);\n})();\n</script>";
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
