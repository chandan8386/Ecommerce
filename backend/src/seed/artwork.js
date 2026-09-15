/**
 * Generates elegant SVG product/banner artwork for demo data so the seeded store
 * looks complete without depending on external image hosts.
 */

const METALS = {
  gold: ['#f6e27a', '#d4a017', '#8a6212'],
  rose: ['#f7c6b8', '#d68f7c', '#8f4f40'],
  white: ['#ffffff', '#d8dde3', '#8e98a3'],
  platinum: ['#f4f4f2', '#cfd1d0', '#7d8180'],
  silver: ['#ffffff', '#c0c4c8', '#6f757b'],
};

const GEMS = {
  diamond: ['#ffffff', '#cfe9ff', '#7fb2d9'],
  ruby: ['#ff8a9a', '#c8102e', '#5e0716'],
  emerald: ['#9ef0c0', '#12925a', '#064a2c'],
  sapphire: ['#9cc4ff', '#1f4fbf', '#0b2263'],
  pearl: ['#ffffff', '#f1ebe1', '#c9bfae'],
};

const BACKGROUNDS = [
  ['#fbf7f2', '#efe4d6'],
  ['#f6f1f4', '#e6d7de'],
  ['#f2f4f6', '#dde3e9'],
];

const defs = (metal, gem, bg) => {
  const m = METALS[metal] || METALS.gold;
  const g = GEMS[gem] || GEMS.diamond;
  return `
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></radialGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m[0]}"/><stop offset=".5" stop-color="${m[1]}"/><stop offset="1" stop-color="${m[2]}"/></linearGradient>
    <linearGradient id="metal2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m[2]}"/><stop offset=".5" stop-color="${m[1]}"/><stop offset="1" stop-color="${m[0]}"/></linearGradient>
    <radialGradient id="gem" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="${g[0]}"/><stop offset=".55" stop-color="${g[1]}"/><stop offset="1" stop-color="${g[2]}"/></radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".18"/></filter>
  </defs>`;
};

const gemShape = (cx, cy, r, gem) =>
  gem === 'none'
    ? ''
    : gem === 'pearl'
      ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#gem)"/><circle cx="${cx - r * 0.35}" cy="${cy - r * 0.35}" r="${r * 0.25}" fill="#fff" opacity=".8"/>`
      : `<polygon points="${cx},${cy - r} ${cx + r},${cy - r * 0.2} ${cx + r * 0.6},${cy + r} ${cx - r * 0.6},${cy + r} ${cx - r},${cy - r * 0.2}" fill="url(#gem)" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
         <polyline points="${cx - r},${cy - r * 0.2} ${cx},${cy + r} ${cx + r},${cy - r * 0.2}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/>
         <line x1="${cx - r * 0.45}" y1="${cy - r * 0.2}" x2="${cx}" y2="${cy - r}" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>
         <line x1="${cx + r * 0.45}" y1="${cy - r * 0.2}" x2="${cx}" y2="${cy - r}" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>`;

const SHAPES = {
  ring: (gem) => `
    <ellipse cx="400" cy="470" rx="170" ry="150" fill="none" stroke="url(#metal)" stroke-width="34"/>
    <ellipse cx="400" cy="470" rx="170" ry="150" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4" transform="translate(-6,-8)"/>
    <path d="M360 330 L380 280 L420 280 L440 330 Z" fill="url(#metal2)"/>
    ${gemShape(400, 250, 62, gem === 'none' ? 'diamond' : gem)}`,
  band: (gem) => `
    <ellipse cx="400" cy="420" rx="200" ry="200" fill="none" stroke="url(#metal)" stroke-width="56"/>
    <ellipse cx="400" cy="420" rx="200" ry="200" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="6" transform="translate(-8,-10)"/>
    ${gem === 'none' ? '' : Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1.1 + i * 0.1); return gemShape(400 + 200 * Math.cos(a), 420 + 200 * Math.sin(a), 16, gem); }).join('')}`,
  pendant: (gem) => `
    <path d="M150 120 Q400 520 650 120" fill="none" stroke="url(#metal)" stroke-width="7"/>
    <circle cx="400" cy="330" r="16" fill="none" stroke="url(#metal)" stroke-width="8"/>
    <path d="M400 620 C300 540 250 480 250 420 C250 370 290 340 330 340 C365 340 390 360 400 385 C410 360 435 340 470 340 C510 340 550 370 550 420 C550 480 500 540 400 620 Z" fill="none" stroke="url(#metal)" stroke-width="24"/>
    ${gemShape(400, 460, 42, gem)}`,
  chain: () => `
    ${Array.from({ length: 13 }, (_, i) => { const t = i / 12; const x = 130 + 540 * t; const y = 160 + 420 * Math.sin(Math.PI * t); return `<ellipse cx="${x}" cy="${y}" rx="34" ry="20" fill="none" stroke="url(#metal)" stroke-width="10" transform="rotate(${-60 + 120 * t} ${x} ${y})"/>`; }).join('')}`,
  choker: (gem) => `
    <path d="M140 220 Q400 620 660 220" fill="none" stroke="url(#metal)" stroke-width="38"/>
    ${Array.from({ length: 7 }, (_, i) => { const t = (i + 1) / 8; const x = 140 + 520 * t; const y = 220 + 400 * t * (1 - t) * 1.95; return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 70}" stroke="url(#metal)" stroke-width="5"/>${gemShape(x, y + 92, 22, gem)}`; }).join('')}`,
  stud: (gem) => `
    <circle cx="280" cy="400" r="95" fill="url(#metal)" filter="url(#shadow)"/>${gemShape(280, 400, 70, gem === 'none' ? 'diamond' : gem)}
    <circle cx="530" cy="400" r="95" fill="url(#metal)" filter="url(#shadow)"/>${gemShape(530, 400, 70, gem === 'none' ? 'diamond' : gem)}`,
  hoop: (gem) => `
    <circle cx="270" cy="410" r="130" fill="none" stroke="url(#metal)" stroke-width="30"/>
    <circle cx="530" cy="410" r="130" fill="none" stroke="url(#metal2)" stroke-width="30"/>
    ${gem === 'none' ? '' : [0, 1, 2, 3, 4].map((i) => gemShape(270 + 130 * Math.cos(Math.PI * (0.3 + i * 0.1)), 410 + 130 * Math.sin(Math.PI * (0.3 + i * 0.1)), 11, gem) + gemShape(530 + 130 * Math.cos(Math.PI * (0.3 + i * 0.1)), 410 + 130 * Math.sin(Math.PI * (0.3 + i * 0.1)), 11, gem)).join('')}`,
  drop: (gem) => `
    ${[270, 530].map((x) => `
      <circle cx="${x}" cy="200" r="30" fill="url(#metal)"/>
      <line x1="${x}" y1="230" x2="${x}" y2="340" stroke="url(#metal)" stroke-width="8"/>
      <path d="M${x} 340 C${x - 80} 450 ${x - 80} 560 ${x} 610 C${x + 80} 560 ${x + 80} 450 ${x} 340 Z" fill="url(#metal2)"/>
      ${gemShape(x, 500, 55, gem === 'none' ? 'diamond' : gem)}`).join('')}`,
  bangle: (gem) => `
    <ellipse cx="400" cy="400" rx="250" ry="130" fill="none" stroke="url(#metal)" stroke-width="44" filter="url(#shadow)"/>
    <ellipse cx="400" cy="450" rx="250" ry="130" fill="none" stroke="url(#metal2)" stroke-width="30" opacity=".9"/>
    ${gem === 'none' ? '' : [-2, -1, 0, 1, 2].map((i) => gemShape(400 + i * 90, 400 + 130 - Math.abs(i) * 22, 18, gem)).join('')}`,
  bracelet: (gem) => `
    ${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; const x = 400 + 240 * Math.cos(a); const y = 400 + 150 * Math.sin(a); return gem === 'none' ? `<ellipse cx="${x}" cy="${y}" rx="26" ry="17" fill="none" stroke="url(#metal)" stroke-width="9" transform="rotate(${(a * 180) / Math.PI + 90} ${x} ${y})"/>` : `<circle cx="${x}" cy="${y}" r="26" fill="url(#metal)"/>${gemShape(x, y, 17, gem)}`; }).join('')}`,
};

export function productSvg({ shape = 'ring', metal = 'gold', gem = 'diamond', variant = 0 }) {
  const bg = BACKGROUNDS[variant % BACKGROUNDS.length];
  const draw = SHAPES[shape] || SHAPES.ring;
  const rotate = variant ? `rotate(${variant % 2 ? -12 : 10} 400 400)` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">${defs(metal, gem, bg)}
  <rect width="800" height="800" fill="url(#bg)"/>
  <ellipse cx="400" cy="700" rx="230" ry="26" fill="#000" opacity=".06"/>
  <g transform="${rotate}" filter="url(#shadow)">${draw(gem)}</g>
</svg>`;
}

const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]);

export function bannerSvg({ title, theme = ['#2b1a12', '#8c6239'], position = 'hero' }) {
  const [w, h] = position === 'hero' ? [1600, 700] : [1000, 500];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme[0]}"/><stop offset="1" stop-color="${theme[1]}"/></linearGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e27a"/><stop offset=".5" stop-color="#d4a017"/><stop offset="1" stop-color="#8a6212"/></linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#b)"/>
  <g opacity=".9" fill="none" stroke="url(#g)">
    <circle cx="${w * 0.78}" cy="${h * 0.5}" r="${h * 0.32}" stroke-width="${h * 0.045}"/>
    <circle cx="${w * 0.78}" cy="${h * 0.5}" r="${h * 0.42}" stroke-width="2" opacity=".5"/>
    <circle cx="${w * 0.9}" cy="${h * 0.2}" r="${h * 0.08}" stroke-width="6" opacity=".6"/>
  </g>
  <polygon points="${w * 0.78},${h * 0.1} ${w * 0.82},${h * 0.17} ${w * 0.8},${h * 0.24} ${w * 0.76},${h * 0.24} ${w * 0.74},${h * 0.17}" fill="#fff" opacity=".85"/>
  <text x="${w * 0.06}" y="${h * 0.92}" font-family="Georgia, serif" font-size="${h * 0.04}" fill="#fff" opacity=".35" letter-spacing="8">${esc(title.toUpperCase())}</text>
</svg>`;
}
