import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "games");
mkdirSync(dir, { recursive: true });

function svg(inner, bg) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bg[0]}"/>
      <stop offset="1" stop-color="${bg[1]}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#sky)"/>
  ${inner}
</svg>`;
}

const covers = {
  "crown-catch": svg(
    `<ellipse cx="256" cy="430" rx="150" ry="28" fill="#1e6b3a"/>
     <path d="M140 360 q116 90 232 0 v40 q-116 70 -232 0z" fill="#c4782a" stroke="#7a3e12" stroke-width="8"/>
     <path d="M160 360 q96 -70 192 0" fill="none" stroke="#7a3e12" stroke-width="8"/>
     <circle cx="180" cy="150" r="28" fill="#f4c430"/>
     <circle cx="300" cy="110" r="22" fill="#ffd24a"/>
     <circle cx="340" cy="210" r="18" fill="#f0b429"/>
     <circle cx="220" cy="70" r="26" fill="#1a1a1a"/>
     <circle cx="390" cy="160" r="22" fill="#222"/>
     <path d="M230 200 l18 -70 22 18 20 -40 22 40 24 -18 14 70z" fill="#f5c542" stroke="#b8860b" stroke-width="4"/>
     <circle cx="256" cy="148" r="8" fill="#6ec8ff"/>`,
    ["#7ec8ff", "#b8ecff"],
  ),
  "reflex-ring": svg(
    `<circle cx="256" cy="256" r="200" fill="none" stroke="#5b2dff" stroke-width="28"/>
     <circle cx="256" cy="256" r="150" fill="none" stroke="#00e0ff" stroke-width="24"/>
     <circle cx="256" cy="256" r="102" fill="none" stroke="#ff3d8a" stroke-width="22"/>
     <circle cx="256" cy="256" r="58" fill="#ffe14a" stroke="#ff9f1c" stroke-width="10"/>
     <circle cx="256" cy="256" r="18" fill="#fff"/>`,
    ["#1b0840", "#4a148c"],
  ),
  "memory-vault": svg(
    `<rect x="70" y="170" width="372" height="230" rx="18" fill="#8b5a2b"/>
     <rect x="86" y="186" width="340" height="198" rx="10" fill="#5c3516"/>
     <rect x="110" y="210" width="90" height="120" rx="10" fill="#2ecc71"/>
     <rect x="211" y="210" width="90" height="120" rx="10" fill="#f4d03f"/>
     <rect x="312" y="210" width="90" height="120" rx="10" fill="#5dade2"/>
     <path d="M140 250 l15 0 8 -18 8 18 15 0 -12 12 5 16 -16 -9 -16 9 5 -16z" fill="#fff"/>
     <circle cx="256" cy="270" r="22" fill="#c0392b"/>
     <rect x="338" y="248" width="38" height="48" rx="6" fill="#fff" opacity=".85"/>
     <path d="M160 120 h192 l20 50 h-232z" fill="#c0392b"/>`,
    ["#143d2c", "#1f6f4a"],
  ),
  "orbit-dash": svg(
    `<circle cx="256" cy="256" r="78" fill="#3dd6c6"/>
     <circle cx="230" cy="240" r="18" fill="#1a8f84"/>
     <ellipse cx="256" cy="256" rx="210" ry="70" fill="none" stroke="#ffd166" stroke-width="8" transform="rotate(-18 256 256)"/>
     <rect x="330" y="168" width="70" height="28" rx="10" fill="#ff6b35"/>
     <polygon points="400,182 430,168 430,196" fill="#ff6b35"/>
     <circle cx="140" cy="120" r="16" fill="#cfd8dc"/>
     <circle cx="400" cy="360" r="22" fill="#90a4ae"/>
     <circle cx="90" cy="300" r="12" fill="#ffd166"/>`,
    ["#070b2a", "#15205b"],
  ),
  "stack-king": svg(
    `<rect x="186" y="390" width="140" height="36" rx="6" fill="#e74c3c"/>
     <rect x="198" y="348" width="116" height="36" rx="6" fill="#f39c12"/>
     <rect x="208" y="306" width="96" height="36" rx="6" fill="#27ae60"/>
     <rect x="218" y="264" width="76" height="36" rx="6" fill="#2980b9"/>
     <rect x="80" y="200" width="120" height="32" rx="6" fill="#9b59b6"/>
     <rect x="200" y="70" width="52" height="52" rx="8" fill="#f1c40f"/>
     <polygon points="226,78 242,110 210,110" fill="#fff"/>`,
    ["#fdebd0", "#f5b7b1"],
  ),
  "pulse-tap": svg(
    `<rect x="70" y="40" width="110" height="432" rx="12" fill="#1a1a2e"/>
     <rect x="201" y="40" width="110" height="432" rx="12" fill="#16213e"/>
     <rect x="332" y="40" width="110" height="432" rx="12" fill="#1a1a2e"/>
     <rect x="82" y="300" width="86" height="54" rx="8" fill="#ff2e63"/>
     <rect x="213" y="180" width="86" height="54" rx="8" fill="#08d9d6"/>
     <rect x="344" y="240" width="86" height="54" rx="8" fill="#f9ed69"/>
     <rect x="60" y="400" width="392" height="14" fill="#fff" opacity=".9"/>`,
    ["#0f0c29", "#302b63"],
  ),
  "grid-merge": svg(
    `<rect x="56" y="56" width="400" height="400" rx="24" fill="#bbada0"/>
     <rect x="76" y="76" width="84" height="84" rx="10" fill="#eee4da"/><text x="118" y="132" text-anchor="middle" font-size="36" font-family="Arial" fill="#776e65">2</text>
     <rect x="172" y="76" width="84" height="84" rx="10" fill="#f2b179"/><text x="214" y="132" text-anchor="middle" font-size="36" font-family="Arial" fill="#fff">8</text>
     <rect x="268" y="76" width="84" height="84" rx="10" fill="#f67c5f"/><text x="310" y="132" text-anchor="middle" font-size="32" font-family="Arial" fill="#fff">16</text>
     <rect x="364" y="76" width="84" height="84" rx="10" fill="#edc22e"/><text x="406" y="132" text-anchor="middle" font-size="28" font-family="Arial" fill="#fff">64</text>
     <rect x="76" y="172" width="84" height="84" rx="10" fill="#ede0c8"/>
     <rect x="172" y="172" width="84" height="84" rx="10" fill="#f59563"/><text x="214" y="228" text-anchor="middle" font-size="32" font-family="Arial" fill="#fff">16</text>
     <rect x="268" y="172" width="84" height="84" rx="10" fill="#edc22e"/><text x="310" y="228" text-anchor="middle" font-size="28" font-family="Arial" fill="#fff">32</text>
     <rect x="364" y="172" width="84" height="84" rx="10" fill="#cdc1b4"/>
     <rect x="76" y="268" width="84" height="84" rx="10" fill="#f2b179"/><text x="118" y="324" text-anchor="middle" font-size="36" font-family="Arial" fill="#fff">4</text>
     <rect x="172" y="268" width="84" height="84" rx="10" fill="#cdc1b4"/>
     <rect x="268" y="268" width="84" height="84" rx="10" fill="#eee4da"/><text x="310" y="324" text-anchor="middle" font-size="36" font-family="Arial" fill="#776e65">2</text>
     <rect x="364" y="268" width="84" height="84" rx="10" fill="#f67c5f"/><text x="406" y="324" text-anchor="middle" font-size="28" font-family="Arial" fill="#fff">128</text>
     <rect x="76" y="364" width="84" height="84" rx="10" fill="#cdc1b4"/>
     <rect x="172" y="364" width="84" height="84" rx="10" fill="#edcc61"/><text x="214" y="420" text-anchor="middle" font-size="28" font-family="Arial" fill="#fff">256</text>
     <rect x="268" y="364" width="84" height="84" rx="10" fill="#eee4da"/>
     <rect x="364" y="364" width="84" height="84" rx="10" fill="#f2b179"/><text x="406" y="420" text-anchor="middle" font-size="36" font-family="Arial" fill="#fff">8</text>`,
    ["#faf8ef", "#eee4da"],
  ),
  "gold-slash": svg(
    `<path d="M40 360 Q 200 40 480 140" fill="none" stroke="#fff59d" stroke-width="14" stroke-linecap="round"/>
     <circle cx="150" cy="220" r="46" fill="#ff9f1c"/>
     <circle cx="280" cy="150" r="38" fill="#2ecc71"/>
     <circle cx="390" cy="250" r="42" fill="#e74c3c"/>
     <circle cx="240" cy="320" r="34" fill="#111"/>
     <path d="M120 200 l80 80" stroke="#fff" stroke-width="8"/>`,
    ["#1abc9c", "#16a085"],
  ),
  "king-tap": svg(
    `<circle cx="256" cy="270" r="150" fill="#f1c40f" stroke="#d35400" stroke-width="16"/>
     <circle cx="256" cy="270" r="92" fill="#e67e22"/>
     <path d="M220 90 h72 v70 h-72z" fill="#8e44ad"/>
     <circle cx="256" cy="70" r="28" fill="#9b59b6"/>
     <text x="256" y="286" text-anchor="middle" font-size="42" font-family="Arial Black" fill="#fff">TAP</text>`,
    ["#fdebd0", "#f5b041"],
  ),
  "maze-crown": svg(
    `<rect x="48" y="48" width="416" height="416" fill="#1b4f72"/>
     <path d="M80 80 h352 v352 h-352z" fill="none" stroke="#f4d03f" stroke-width="28"/>
     <path d="M160 80 v120 h120 v80 h-80 v120" fill="none" stroke="#f4d03f" stroke-width="28"/>
     <circle cx="200" cy="200" r="22" fill="#2ecc71"/>
     <circle cx="340" cy="300" r="22" fill="#e74c3c"/>
     <path d="M300 140 l12 -22 12 22 22 0 -18 14 7 22 -23 -12 -23 12 7 -22 -18 -14z" fill="#f1c40f"/>`,
    ["#0e2a44", "#1a5276"],
  ),
  "lane-rush": svg(
    `<rect x="70" y="20" width="120" height="472" fill="#2ecc71"/>
     <rect x="196" y="20" width="120" height="472" fill="#27ae60"/>
     <rect x="322" y="20" width="120" height="472" fill="#2ecc71"/>
     <rect x="196" y="360" width="120" height="70" rx="12" fill="#3498db"/>
     <circle cx="130" cy="140" r="26" fill="#f1c40f"/>
     <circle cx="256" cy="200" r="26" fill="#f1c40f"/>
     <circle cx="382" cy="90" r="24" fill="#111"/>`,
    ["#145a32", "#196f3d"],
  ),
  "target-crown": svg(
    `<circle cx="256" cy="256" r="170" fill="#e74c3c"/>
     <circle cx="256" cy="256" r="120" fill="#fff"/>
     <circle cx="256" cy="256" r="78" fill="#e74c3c"/>
     <circle cx="256" cy="256" r="36" fill="#f1c40f"/>
     <circle cx="110" cy="120" r="36" fill="#111"/>
     <circle cx="400" cy="380" r="30" fill="#f1c40f"/>`,
    ["#f5e6cc", "#e59866"],
  ),
  "gold-snake": svg(
    `<rect x="40" y="40" width="432" height="432" rx="20" fill="#145a32"/>
     <rect x="80" y="240" width="48" height="48" fill="#2ecc71"/>
     <rect x="128" y="240" width="48" height="48" fill="#27ae60"/>
     <rect x="176" y="240" width="48" height="48" fill="#2ecc71"/>
     <rect x="224" y="240" width="48" height="48" fill="#27ae60"/>
     <rect x="224" y="192" width="48" height="48" fill="#2ecc71"/>
     <rect x="224" y="144" width="48" height="48" fill="#1e8449"/>
     <circle cx="248" cy="160" r="8" fill="#fff"/>
     <rect x="352" y="144" width="40" height="40" rx="8" fill="#f1c40f"/>`,
    ["#0b3d0b", "#1e8449"],
  ),
  "gap-flyer": svg(
    `<rect x="0" y="0" width="160" height="512" fill="#27ae60"/>
     <rect x="352" y="0" width="160" height="512" fill="#27ae60"/>
     <rect x="0" y="200" width="160" height="120" fill="#7ed957"/>
     <rect x="352" y="200" width="160" height="120" fill="#7ed957"/>
     <ellipse cx="256" cy="256" rx="36" ry="26" fill="#f4d03f"/>
     <circle cx="278" cy="250" r="8" fill="#111"/>
     <path d="M220 256 q20 -30 40 0" fill="#e67e22"/>`,
    ["#5dade2", "#85c1e9"],
  ),
  "color-rush": svg(
    `<circle cx="160" cy="180" r="70" fill="#e74c3c"/>
     <circle cx="352" cy="180" r="70" fill="#3498db"/>
     <circle cx="160" cy="360" r="70" fill="#f1c40f"/>
     <circle cx="352" cy="360" r="70" fill="#2ecc71"/>
     <rect x="186" y="40" width="140" height="50" rx="12" fill="#8e44ad"/>`,
    ["#fdfefe", "#d5dbdb"],
  ),
  "simon-crown": svg(
    `<path d="M256 70 l150 150 h-300z" fill="#e74c3c"/>
     <path d="M406 220 l36 150 h-186z" fill="#f1c40f"/>
     <path d="M256 442 l-150 -150 h300z" fill="#2ecc71"/>
     <path d="M106 220 l-36 150 h186z" fill="#3498db"/>
     <circle cx="256" cy="256" r="48" fill="#111"/>`,
    ["#1c2833", "#2e4053"],
  ),
  "moto-rush": svg(
    `<rect x="0" y="300" width="512" height="212" fill="#5d6d7e"/>
     <rect x="0" y="360" width="512" height="18" fill="#f4d03f"/>
     <rect x="40" y="300" width="18" height="80" fill="#fff"/>
     <rect x="160" y="300" width="18" height="80" fill="#fff"/>
     <rect x="280" y="300" width="18" height="80" fill="#fff"/>
     <rect x="400" y="300" width="18" height="80" fill="#fff"/>
     <ellipse cx="210" cy="340" rx="28" ry="28" fill="#111"/>
     <ellipse cx="320" cy="340" rx="28" ry="28" fill="#111"/>
     <path d="M190 300 h140 l20 40 h-180z" fill="#e74c3c"/>
     <circle cx="250" cy="270" r="22" fill="#5dade2"/>
     <rect x="360" y="250" width="90" height="46" rx="8" fill="#3498db"/>
     <rect x="70" y="250" width="90" height="46" rx="8" fill="#2c3e50"/>`,
    ["#5dade2", "#aed6f1"],
  ),
  "wheelie-gold": svg(
    `<rect x="0" y="380" width="512" height="132" fill="#7d6608"/>
     <rect x="220" y="380" width="90" height="40" fill="#1c2833"/>
     <ellipse cx="180" cy="360" rx="34" ry="34" fill="#111"/>
     <ellipse cx="300" cy="250" rx="34" ry="34" fill="#111"/>
     <path d="M170 340 l90 -110 50 20 -70 120z" fill="#e67e22"/>
     <circle cx="240" cy="250" r="20" fill="#5dade2"/>`,
    ["#f5cba7", "#edbb99"],
  ),
  "gold-rally": svg(
    `<rect x="0" y="220" width="512" height="292" fill="#566573"/>
     <rect x="248" y="220" width="16" height="292" fill="#f4d03f"/>
     <rect x="210" y="340" width="70" height="110" rx="10" fill="#e74c3c"/>
     <rect x="80" y="280" width="64" height="96" rx="8" fill="#2c3e50"/>
     <rect x="360" y="300" width="64" height="96" rx="8" fill="#1a5276"/>
     <circle cx="226" cy="450" r="14" fill="#111"/><circle cx="264" cy="450" r="14" fill="#111"/>`,
    ["#85c1e9", "#5dade2"],
  ),
  "nitro-crown": svg(
    `<rect x="0" y="360" width="200" height="152" fill="#27ae60"/>
     <rect x="320" y="360" width="192" height="152" fill="#27ae60"/>
     <rect x="200" y="420" width="120" height="92" fill="#1c2833"/>
     <rect x="230" y="250" width="90" height="50" rx="10" fill="#f39c12"/>
     <ellipse cx="248" cy="310" rx="16" ry="16" fill="#111"/>
     <ellipse cx="300" cy="310" rx="16" ry="16" fill="#111"/>
     <path d="M240 250 q40 -70 80 0" fill="none" stroke="#fff" stroke-width="6"/>`,
    ["#aed6f1", "#5dade2"],
  ),
  "ring-fighter": svg(
    `<rect x="40" y="300" width="432" height="28" fill="#922b21"/>
     <rect x="70" y="328" width="372" height="120" fill="#7b241c"/>
     <circle cx="180" cy="250" r="70" fill="#f5cba7"/>
     <circle cx="340" cy="250" r="70" fill="#edbb99"/>
     <rect x="150" y="300" width="60" height="80" fill="#c0392b"/>
     <rect x="310" y="300" width="60" height="80" fill="#1a5276"/>
     <circle cx="150" cy="230" r="22" fill="#e74c3c"/>
     <circle cx="370" cy="230" r="22" fill="#e74c3c"/>`,
    ["#fad7a0", "#e67e22"],
  ),
  "turret-siege": svg(
    `<rect x="210" y="340" width="92" height="80" fill="#7f8c8d"/>
     <circle cx="256" cy="320" r="48" fill="#34495e"/>
     <rect x="248" y="200" width="16" height="90" fill="#2c3e50"/>
     <circle cx="140" cy="120" r="22" fill="#e74c3c"/>
     <circle cx="300" cy="80" r="18" fill="#e74c3c"/>
     <circle cx="400" cy="150" r="20" fill="#e74c3c"/>
     <path d="M256 70 l10 -20 10 20 20 2 -16 14 5 20 -19 -12 -19 12 5 -20 -16 -14z" fill="#f1c40f"/>`,
    ["#1a5276", "#154360"],
  ),
  "tank-push": svg(
    `<rect x="160" y="300" width="200" height="80" rx="12" fill="#1e8449"/>
     <rect x="240" y="230" width="120" height="28" fill="#145a32"/>
     <circle cx="200" cy="390" r="28" fill="#111"/>
     <circle cx="320" cy="390" r="28" fill="#111"/>
     <circle cx="390" cy="160" r="36" fill="#7f8c8d"/>
     <circle cx="120" cy="120" r="28" fill="#95a5a6"/>`,
    ["#f5cba7", "#d68910"],
  ),
  "sky-ace": svg(
    `<ellipse cx="256" cy="240" rx="120" ry="28" fill="#ecf0f1"/>
     <rect x="230" y="210" width="90" height="28" fill="#2980b9"/>
     <polygon points="320,224 390,200 390,248" fill="#2980b9"/>
     <circle cx="140" cy="140" r="26" fill="#e67e22" opacity=".8"/>
     <circle cx="380" cy="320" r="22" fill="#e67e22" opacity=".7"/>
     <circle cx="200" cy="360" r="18" fill="#f1c40f"/>`,
    ["#5dade2", "#2e86c1"],
  ),
  "jet-strike": svg(
    `<polygon points="256,80 300,220 256,200 212,220" fill="#1a5276"/>
     <polygon points="256,200 360,280 256,250 152,280" fill="#2471a3"/>
     <polygon points="200,300 240,360 180,400" fill="#e74c3c"/>
     <polygon points="320,320 360,380 300,410" fill="#c0392b"/>
     <rect x="248" y="200" width="16" height="90" fill="#f1c40f"/>`,
    ["#1b4f72", "#0e2a44"],
  ),
  "hover-dash": svg(
    `<rect x="60" y="40" width="120" height="432" rx="16" fill="#7d3c98"/>
     <rect x="196" y="40" width="120" height="432" rx="16" fill="#6c3483"/>
     <rect x="332" y="40" width="120" height="432" rx="16" fill="#7d3c98"/>
     <ellipse cx="256" cy="360" rx="46" ry="18" fill="#00e5ff"/>
     <rect x="226" y="300" width="60" height="50" rx="12" fill="#f4d03f"/>
     <circle cx="130" cy="160" r="20" fill="#f1c40f"/>
     <circle cx="382" cy="200" r="22" fill="#e74c3c"/>`,
    ["#1a0033", "#4a0072"],
  ),
};

for (const [id, xml] of Object.entries(covers)) {
  writeFileSync(join(dir, `${id}.svg`), xml);
}

console.log(`Wrote ${Object.keys(covers).length} covers`);
