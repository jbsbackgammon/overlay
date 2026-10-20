// Enumerate static media at publish time; no GitHub API or token required.
const fs = require('node:fs');
const path = require('node:path');
const output = process.argv[2] || 'media.json';
const extensions = /\.(png|jpe?g|webp|gif)$/i;
function collect(dir, exclude = () => false) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(file => file.isFile() && extensions.test(file.name) && !exclude(file.name))
    .map(file => ({ path: `${dir}/${file.name}`, name: file.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}
const media = {
  thumbnails: collect('assets/thumbnail'),
  ads: collect('assets/ads', name => name.toLowerCase() === 'jbs-logo.png')
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(media, null, 2) + '\n');
console.log(`Media manifest: ${media.thumbnails.length} thumbnails, ${media.ads.length} ads`);
