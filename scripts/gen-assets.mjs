// Generates app icons + splash from inline SVG logos using sharp.
// Run: node scripts/gen-assets.mjs
// Produces two sets (blob, sprout) so you can choose in app.json.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'assets');
mkdirSync(out, { recursive: true });

const CREAM = '#F4EDE0';
const FOREST = '#163324';
const BLUE = '#A9C2E8';
const PINK = '#FF5BA8';
const AMBER = '#C87828';

// ---- Logo A: blob mascot -------------------------------------------------
function blobMark(s, withBg = true) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 512 512">
    ${withBg ? `<rect width="512" height="512" fill="${CREAM}"/>` : ''}
    <g>
      <path d="M256 96
        C150 96 116 196 116 268
        C116 360 172 412 256 412
        C340 412 396 360 396 268
        C396 196 362 96 256 96 Z" fill="${BLUE}"/>
      <ellipse cx="206" cy="256" rx="34" ry="38" fill="#fff"/>
      <ellipse cx="306" cy="256" rx="34" ry="38" fill="#fff"/>
      <circle cx="212" cy="252" r="17" fill="#1A1A1A"/>
      <circle cx="312" cy="252" r="17" fill="#1A1A1A"/>
      <circle cx="218" cy="246" r="5" fill="#fff"/>
      <circle cx="318" cy="246" r="5" fill="#fff"/>
      <path d="M214 318 q42 40 84 0" stroke="#7A2E3A" stroke-width="13" fill="none" stroke-linecap="round"/>
      <circle cx="176" cy="300" r="13" fill="${PINK}" opacity="0.7"/>
      <circle cx="344" cy="300" r="13" fill="${PINK}" opacity="0.7"/>
    </g>
  </svg>`;
}

// ---- Logo B: sprout ------------------------------------------------------
function sproutMark(s, withBg = true) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 512 512">
    ${withBg ? `<rect width="512" height="512" fill="${CREAM}"/>` : ''}
    <g>
      <rect x="206" y="150" width="100" height="60" rx="14" fill="${AMBER}"/>
      <path d="M216 410 L296 410 L286 470 L226 470 Z" fill="#B5734A"/>
      <ellipse cx="256" cy="410" rx="44" ry="10" fill="#C98A5E"/>
      <path d="M256 410 V250" stroke="${FOREST}" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M256 300 C190 300 156 250 156 196 C226 196 256 240 256 300 Z" fill="#3FA063"/>
      <path d="M256 280 C322 280 356 230 356 176 C286 176 256 220 256 280 Z" fill="#4E9A66"/>
      <circle cx="256" cy="210" r="26" fill="#E7B6C9"/>
      <circle cx="256" cy="210" r="12" fill="${AMBER}"/>
    </g>
  </svg>`;
}

async function png(svg, file, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(resolve(out, file));
  console.log('wrote', file);
}

// Splash: centered mark on cream, wide canvas
async function splash(markFn, file) {
  const mark = markFn(1, false).replace(/width="1" height="1"/, 'width="600" height="600"');
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1242" height="2436" viewBox="0 0 1242 2436">
    <rect width="1242" height="2436" fill="${CREAM}"/>
    <g transform="translate(321, 818)">${mark}</g>
    <text x="621" y="1560" font-family="Arial, sans-serif" font-size="120" font-weight="700"
      fill="${FOREST}" text-anchor="middle">buddi</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(resolve(out, file));
  console.log('wrote', file);
}

for (const [name, fn] of [['blob', blobMark], ['sprout', sproutMark]]) {
  await png(fn(1024, true), `icon-${name}.png`, 1024);
  await png(fn(1024, false), `adaptive-${name}.png`, 1024); // transparent-ish foreground
  await png(fn(196, true), `favicon-${name}.png`, 196);
  await splash(fn, `splash-${name}.png`);
}

console.log('done. Pick a set and copy to icon.png / splash.png / adaptive-icon.png / favicon.png');
