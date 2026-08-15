/**
 * Generates the SmileStore POS brand assets.
 *
 * Everything is plain vector geometry (no <text>, no font dependency), so the
 * SVGs render identically in the browser, in Electron and when rasterised here.
 * Each asset is written as .svg plus a PNG fallback for consumers that cannot
 * take SVG (installer icons, printed docs, LINE/social previews).
 *
 *   node scripts/build-brand-assets.mjs [outDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT_DIR = process.argv[2] || path.join(process.cwd(), 'public', 'images', 'brand');

const C = {
  navy: '#13314F',
  ink: '#0E2740',
  skin: '#F7D8B6',
  hair: '#4B2E1F',
  // Brand blue ("Calm Ocean") — matches --color-brand-* in src/app/globals.css.
  brand: '#3E86C7',
  brandDark: '#2A6AAA',
  brandDeep: '#1E5088',
  white: '#FFFFFF',
  yellow: '#F2C21C',
  // Leading "S" of STORE POS — mirrors the yellow "S" of Smile, so it wants the
  // vivid brand tone rather than a tint.
  brandLight: '#3E86C7',
  brandText: '#2A6AAA',
  // Kraft paper. Warm against the blue apron, which is what keeps the bag
  // legible as a separate object rather than blending into it.
  bag: '#D9C4A9',
  bagDark: '#BFA688',
  apple: '#EF4444',
  // Foliage on the groceries — depicts fresh produce, so it stays green and is
  // deliberately not tied to the brand ramp.
  leaf: '#3E9B52',
  shadow: '#DCE8F4',
  mouth: '#7C2F2F',
  tongue: '#E4736B',
  cheek: '#F4A9A0',
};

/* ------------------------------------------------------------------ mascot */
// content bounds ≈ x 45..465, y 34..494 inside a 0 0 512 512 box
const mascot = `
<g fill="none" stroke="${C.navy}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
  <!-- ground shadow -->
  <ellipse cx="252" cy="476" rx="146" ry="20" fill="${C.shadow}" stroke="none"/>

  <!-- legs -->
  <path d="M206 356h48v62a24 24 0 0 1-48 0z" fill="#1E3A5F"/>
  <path d="M266 356h48v62a24 24 0 0 1-48 0z" fill="#1E3A5F"/>
  <!-- shoes -->
  <rect x="182" y="416" width="78" height="38" rx="19" fill="${C.ink}"/>
  <rect x="258" y="416" width="78" height="38" rx="19" fill="${C.ink}"/>

  <!-- shirt -->
  <path d="M256 258c-48 0-76 22-76 54v54c0 16 12 28 28 28h96c16 0 28-12 28-28v-54c0-32-28-54-76-54z" fill="${C.white}"/>

  <!-- apron neck strap (passes behind the head) -->
  <path d="M218 288c-4-36 14-50 38-50s42 14 38 50" stroke="${C.navy}" stroke-width="24"/>
  <path d="M218 288c-4-36 14-50 38-50s42 14 38 50" stroke="${C.brand}" stroke-width="14"/>

  <!-- apron -->
  <path d="M214 282h84v40l22 14v42q0 16-16 16H208q-16 0-16-16v-42l22-14z" fill="${C.brand}"/>
  <rect x="220" y="344" width="72" height="34" rx="8" stroke="${C.brandDeep}" stroke-width="7"/>
  <path d="M256 344v34" stroke="${C.brandDeep}" stroke-width="7"/>

  <!-- waving arm -->
  <path d="M196 296c-38 6-68-4-86-30" stroke="${C.navy}" stroke-width="42"/>
  <path d="M196 296c-38 6-68-4-86-30" stroke="${C.white}" stroke-width="30"/>
  <rect x="70" y="196" width="17" height="52" rx="8.5" fill="${C.skin}"/>
  <rect x="89" y="188" width="17" height="60" rx="8.5" fill="${C.skin}"/>
  <rect x="108" y="192" width="17" height="56" rx="8.5" fill="${C.skin}"/>
  <rect x="127" y="202" width="17" height="46" rx="8.5" fill="${C.skin}"/>
  <rect x="66" y="228" width="80" height="76" rx="30" fill="${C.skin}"/>
  <rect x="52" y="250" width="40" height="22" rx="11" fill="${C.skin}" transform="rotate(-35 72 261)"/>

  <!-- basket arm (runs behind the grocery bag) -->
  <path d="M314 292c24 6 36 24 36 44" stroke="${C.navy}" stroke-width="42"/>
  <path d="M314 292c24 6 36 24 36 44" stroke="${C.white}" stroke-width="30"/>

  <!-- neck -->
  <rect x="232" y="226" width="48" height="44" rx="14" fill="${C.skin}"/>

  <!-- head -->
  <ellipse cx="168" cy="192" rx="19" ry="24" fill="${C.skin}"/>
  <ellipse cx="344" cy="192" rx="19" ry="24" fill="${C.skin}"/>
  <path d="M256 90c56 0 90 34 90 88s-34 88-90 88-90-34-90-88 34-88 90-88z" fill="${C.skin}"/>
  <path d="M170 172c-2-54 38-86 86-86s88 32 86 86c-8-32-40-54-86-54s-78 22-86 54z" fill="${C.hair}" stroke="none"/>

  <!-- eyebrows / eyes -->
  <path d="M198 148q22-12 42-2" stroke-width="9"/>
  <path d="M272 146q20-10 42 2" stroke-width="9"/>
  <ellipse cx="220" cy="176" rx="16" ry="20" fill="${C.ink}" stroke="none"/>
  <ellipse cx="292" cy="176" rx="16" ry="20" fill="${C.ink}" stroke="none"/>
  <circle cx="226" cy="169" r="6" fill="${C.white}" stroke="none"/>
  <circle cx="298" cy="169" r="6" fill="${C.white}" stroke="none"/>

  <!-- cheeks -->
  <ellipse cx="196" cy="218" rx="17" ry="11" fill="${C.cheek}" stroke="none" opacity=".85"/>
  <ellipse cx="316" cy="218" rx="17" ry="11" fill="${C.cheek}" stroke="none" opacity=".85"/>

  <!-- mouth -->
  <path d="M222 208q34-4 68 0 2 42-34 42t-34-42z" fill="${C.mouth}"/>
  <path d="M227 210q29-4 58 0v9q-29 3-58 0z" fill="${C.white}" stroke="none"/>
  <path d="M238 238q18-12 36 0 0 12-18 12t-18-12z" fill="${C.tongue}" stroke="none"/>

  <!-- cap -->
  <path d="M170 128c0-52 38-82 86-82s86 30 86 82z" fill="${C.brand}"/>
  <path d="M334 112c52-6 86 16 88 40 1 14-24 18-56 12-22-4-34-18-36-34z" fill="${C.brandDark}"/>
  <rect x="164" y="114" width="184" height="20" rx="10" fill="${C.brandDark}"/>
  <circle cx="256" cy="44" r="11" fill="${C.brandDark}"/>
  <path d="M226 86q30 26 60 0-30 14-60 0z" fill="${C.yellow}" stroke="none"/>

  <!-- grocery bag -->
  <path d="M348 306c-10-32 4-54 20-48-8 16-6 34 4 48z" fill="${C.leaf}"/>
  <path d="M400 258q2-12 12-14" stroke="#5C3A21" stroke-width="7"/>
  <circle cx="400" cy="284" r="26" fill="${C.apple}"/>
  <path d="M412 244c12-6 24 0 22 10-10 6-20 0-22-10z" fill="${C.leaf}" stroke-width="7"/>
  <rect x="428" y="252" width="26" height="58" rx="13" fill="#DDA455" stroke-width="8" transform="rotate(14 441 281)"/>
  <path d="M330 328v66q0 16 16 16h90q16 0 16-16v-66z" fill="${C.bag}"/>
  <path d="M322 304h138l-8 28H330z" fill="${C.bagDark}"/>
  <path d="M383 336v70" stroke="${C.bagDark}" stroke-width="7"/>

  <!-- hand on the bag -->
  <ellipse cx="336" cy="340" rx="30" ry="24" fill="${C.skin}"/>
  <path d="M322 332h26M322 346h22" stroke="${C.navy}" stroke-width="6"/>
</g>`;

/* ---------------------------------------------------------------- wordmark */
// "Smile" cap band y 20..120 · swoosh · "STORE POS" cap band y 140..192
// content bounds ≈ x 4..688, y 20..192
const wordmark = `
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Smile -->
  <path d="M61.8 33.4A30 20.75 0 1 0 42.5 70A30 20.75 0 1 1 23.2 106.6" stroke="${C.yellow}" stroke-width="17"/>
  <g stroke="${C.navy}" stroke-width="15">
    <path d="M100.5 112.5V89"/>
    <path d="M100.5 89a23.5 23.5 0 0 1 47 0V112.5"/>
    <path d="M147.5 89a23.5 23.5 0 0 1 47 0V112.5"/>
    <path d="M221.5 112.5V65.5"/>
    <path d="M248.5 112.5V27.5"/>
    <path d="M275.5 89h68a34 23.5 0 1 0-12.15 18"/>
  </g>
  <circle cx="221.5" cy="42" r="9.5" fill="${C.navy}"/>
  <!-- smile swoosh -->
  <path d="M96 140q83 84 166 0-83 36-166 0z" fill="${C.navy}"/>

  <!-- STORE POS -->
  <g stroke-width="11">
    <path d="M319.8 148.1A16 11.25 0 1 0 309.5 168A16 11.25 0 1 1 299.2 187.9" stroke="${C.brandLight}"/>
    <g stroke="${C.brandText}">
      <path d="M345.5 145.5h34M362.5 145.5v45"/>
      <ellipse cx="416.5" cy="168" rx="17" ry="22.5"/>
      <path d="M453.5 190.5v-45h13a11 11 0 1 1 0 22h-13M466.5 167.5l17 23"/>
      <path d="M531.5 145.5h-28v45h28M503.5 168h24"/>
      <path d="M566.5 190.5v-45h13a11 11 0 1 1 0 22h-13"/>
      <ellipse cx="627.5" cy="168" rx="17" ry="22.5"/>
      <path d="M690.8 148.1A16 11.25 0 1 0 680.5 168A16 11.25 0 1 1 670.2 187.9"/>
    </g>
  </g>
</g>`;

const svg = (viewBox, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${title}">
<title>${title}</title>${body}
</svg>
`;

const assets = [
  // mascot on its own — เด็กร้านของชำ
  { name: 'smilestore-mascot', viewBox: '30 20 452 490', body: mascot, png: 700,
    title: 'SmileStore POS mascot' },
  // wordmark on its own — card headers, receipts, nav bar
  { name: 'smilestore-logo', viewBox: '0 10 712 196', body: wordmark, png: 900,
    title: 'SmileStore POS' },
  // horizontal lockup — wordmark beside the mascot (login hero, landing page)
  { name: 'smilestore-lockup', viewBox: '0 10 1246 490', png: 1400, title: 'SmileStore POS',
    body: `<g transform="translate(30 145.6)">${wordmark}</g>
     <g transform="translate(770 0) scale(0.95)">${mascot}</g>` },
  // vertical lockup — mascot above the wordmark (splash, app icon, portrait cards)
  { name: 'smilestore-hero', viewBox: '-20 0 542 672', png: 800, title: 'SmileStore POS',
    body: `<g transform="translate(-4 -14)">${mascot}</g>
     <g transform="translate(-2.88 511.6) scale(0.72)">${wordmark}</g>` },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const a of assets) {
  const content = svg(a.viewBox, a.body, a.title);
  const svgPath = path.join(OUT_DIR, `${a.name}.svg`);
  const pngPath = path.join(OUT_DIR, `${a.name}.png`);
  fs.writeFileSync(svgPath, content, 'utf8');
  // transparent background so the mark drops onto any card colour
  await sharp(Buffer.from(content), { density: 300 })
    .resize({ width: a.png, fit: 'inside' })
    .png()
    .toFile(pngPath);
  console.log('wrote', svgPath, '+', path.basename(pngPath));
}
