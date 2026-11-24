'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.resolve(process.argv[2] || '_site');
const assets = ['styles.css', 'overlay.js', 'stage.html', 'snapshot.js'];
const entries = ['index.html', 'output.html'];
const keys = Object.fromEntries(assets.map(asset => [
  asset, createHash('sha256').update(fs.readFileSync(path.join(root, asset))).digest('hex').slice(0, 16)
]));

for (const entry of entries) {
  const file = path.join(root, entry);
  let html = fs.readFileSync(file, 'utf8');
  for (const asset of assets) {
    const matcher = new RegExp('(["\\x27])(?:\\./)?' + asset.replace('.', '\\.') + '(?:\\?[^"\\x27]*)?\\1', 'g');
    let count = 0;
    html = html.replace(matcher, (_, quote) => {
      count++;
      return quote + asset + '?v=' + keys[asset] + quote;
    });
    assert.ok(count > 0, entry + ' is missing ' + asset);
  }
  fs.writeFileSync(file, html);
}
// Verify the final published entries, not source-version strings.
for (const entry of entries) {
  const html = fs.readFileSync(path.join(root, entry), 'utf8');
  for (const asset of assets) {
    assert.ok(html.includes(asset + '?v=' + keys[asset]),
      'Generated cache key missing: ' + entry + ' / ' + asset);
  }
}
console.log('Generated identical content-derived asset keys for editor and OBS output.', keys);
