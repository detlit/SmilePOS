/**
 * Generates the branded artwork for the SmileStore POS Windows installer.
 *
 * Inno Setup only accepts .bmp for the wizard panels and .ico for the setup
 * icon, and sharp writes neither — so the two encoders live here. Everything is
 * derived from public/images/brand/*.svg, which keeps the installer visually
 * identical to the app instead of drifting into its own look.
 *
 *   node scripts/build-brand-assets.mjs      # refresh the source SVGs first
 *   node scripts/build-installer-assets.mjs  # then rebuild installer artwork
 *
 * Outputs into installer/assets/:
 *   icon.ico                 setup + uninstall icon (16..256, size-tuned art)
 *   wizard-large*.bmp        welcome/finished side panel (100/150/200/250% DPI)
 *   wizard-small*.bmp        inner-page header mark (100/150/200/250% DPI)
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const BRAND_DIR = path.join(ROOT, 'public', 'images', 'brand');
const OUT_DIR = path.join(ROOT, 'installer', 'assets');
const PREVIEW_DIR = process.env.SMILE_ASSET_PREVIEW_DIR || '';

const C = {
  navy: '#13314F',
  brand: '#3E86C7',
  brandDark: '#2A6AAA',
  brandDeep: '#1E5088',
  yellow: '#F2C21C',
  white: '#FFFFFF',
  shadow: '#DCE8F4',
};

/* ------------------------------------------------------------ brand sources */

/**
 * Pulls the inner markup + viewBox out of a generated brand SVG so it can be
 * re-placed inside a composed layout as a nested <svg>.
 */
function loadBrandArt(name) {
  const file = path.join(BRAND_DIR, `${name}.svg`);
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing brand art: ${file}\nRun "node scripts/build-brand-assets.mjs" first.`
    );
  }
  const text = fs.readFileSync(file, 'utf8');
  const viewBox = /viewBox="([^"]+)"/.exec(text)?.[1];
  const inner = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(text)?.[1];
  if (!viewBox || !inner) throw new Error(`Unparsable brand art: ${file}`);
  return { viewBox, inner: inner.replace(/<title>[\s\S]*?<\/title>/g, '').trim() };
}

/** Single-pass colour swap, so a mapped target colour is never re-mapped. */
function recolor(markup, map) {
  const keys = Object.keys(map);
  if (!keys.length) return markup;
  const pattern = new RegExp(keys.join('|'), 'gi');
  const lookup = {};
  for (const k of keys) lookup[k.toLowerCase()] = map[k];
  return markup.replace(pattern, (m) => lookup[m.toLowerCase()]);
}

const mascotArt = loadBrandArt('smilestore-mascot');
const logoArt = loadBrandArt('smilestore-logo');

// Head-and-cap crops for the icon and the small header mark clip a corner of
// the grocery bag, which lands as a stray green speck at 16px. The bag is the
// trailing block of the mascot group, so dropping it from that marker onward is
// enough; if the marker ever disappears the full art is still valid art.
const mascotHead = mascotArt.inner.includes('<!-- grocery bag -->')
  ? `${mascotArt.inner.split('<!-- grocery bag -->')[0]}</g>`
  : mascotArt.inner;

// Knockout wordmark for dark panels: white lettering, and the leading "S" of
// STORE POS turns yellow so it mirrors the yellow "S" of Smile the way the
// light-background original does with its blue/yellow pair.
const logoOnDark = recolor(logoArt.inner, {
  [C.navy]: C.white,
  [C.brandDark]: C.white,
  [C.brand]: C.yellow,
});

/** Places a piece of brand art at an exact box in the composed layout. */
function place(art, { x, y, w, h }) {
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${art.viewBox}" preserveAspectRatio="xMidYMid meet">${
    art.inner ?? art
  }</svg>`;
}

/* ----------------------------------------------------------------- encoders */

/** 24-bit uncompressed BMP (bottom-up, 4-byte padded rows) — Inno's wizard format. */
function encodeBmp24(rgb, width, height) {
  const rowSize = (width * 3 + 3) & ~3;
  const pixels = rowSize * height;
  const buf = Buffer.alloc(54 + pixels);

  buf.write('BM', 0, 'ascii');
  buf.writeUInt32LE(54 + pixels, 2);
  buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22); // positive height => bottom-up rows
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(pixels, 34);
  buf.writeInt32LE(2835, 38); // 72 DPI in pixels/metre
  buf.writeInt32LE(2835, 42);

  for (let y = 0; y < height; y++) {
    let src = y * width * 3;
    let dst = 54 + (height - 1 - y) * rowSize;
    for (let x = 0; x < width; x++) {
      buf[dst++] = rgb[src + 2];
      buf[dst++] = rgb[src + 1];
      buf[dst++] = rgb[src];
      src += 3;
    }
  }
  return buf;
}

/** One 32-bit BGRA icon image: BITMAPINFOHEADER + XOR bitmap + (unused) AND mask. */
function encodeIcoDib(rgba, w, h) {
  const xorSize = w * h * 4;
  const andRow = ((w + 31) >> 5) * 4;
  const andSize = andRow * h;
  const buf = Buffer.alloc(40 + xorSize + andSize);

  buf.writeUInt32LE(40, 0);
  buf.writeInt32LE(w, 4);
  buf.writeInt32LE(h * 2, 8); // XOR + AND stacked
  buf.writeUInt16LE(1, 12);
  buf.writeUInt16LE(32, 14);
  buf.writeUInt32LE(xorSize + andSize, 20);

  let dst = 40;
  for (let y = 0; y < h; y++) {
    let src = (h - 1 - y) * w * 4;
    for (let x = 0; x < w; x++) {
      buf[dst++] = rgba[src + 2];
      buf[dst++] = rgba[src + 1];
      buf[dst++] = rgba[src];
      buf[dst++] = rgba[src + 3];
      src += 4;
    }
  }
  // AND mask stays all-zero (fully opaque); the 32-bit alpha channel is what
  // Windows actually honours for these sizes.
  return buf;
}

/** Assembles ICONDIR + entries. `images` are {size, data, png} in ascending size. */
function encodeIco(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = header.length;
  images.forEach((img, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(img.size >= 256 ? 0 : img.size, e); // 0 means 256
    header.writeUInt8(img.size >= 256 ? 0 : img.size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(img.data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += img.data.length;
  });

  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

/* ------------------------------------------------------------------ raster */

const render = (svg, w, h) =>
  sharp(Buffer.from(svg), { density: 384 }).resize(w, h, { fit: 'fill' });

async function writeBmp(svg, w, h, file) {
  const { data } = await render(svg, w, h)
    .flatten({ background: C.white })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  fs.writeFileSync(file, encodeBmp24(data, w, h));
  return file;
}

/* ------------------------------------------------------------------ layouts */

/**
 * Welcome/Finished side panel, drawn in 164x314 logical units.
 *
 * The mascot sits on a white card rather than straight on the gradient: its
 * outlines are navy, which would otherwise dissolve into the blue and cost the
 * character its silhouette.
 */
function wizardPanelSvg() {
  const W = 164;
  const H = 314;
  const card = { x: 16, y: 52, w: 132, h: 146, r: 14 };
  const mascot = { x: 24, y: 62, w: 116, h: 126 };
  const word = { x: 18, y: 220, w: 128, h: 35 };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="58" y2="${H}">
      <stop offset="0" stop-color="#0B2038"/>
      <stop offset="0.52" stop-color="${C.brandDeep}"/>
      <stop offset="1" stop-color="#3576B8"/>
    </linearGradient>
    <radialGradient id="glow" gradientUnits="userSpaceOnUse" cx="82" cy="118" r="118">
      <stop offset="0" stop-color="${C.white}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${C.white}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="panel"><rect width="${W}" height="${H}"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- smile arcs, echoing the swoosh in the wordmark -->
  <g clip-path="url(#panel)" fill="none" stroke="${C.white}" stroke-opacity="0.09" stroke-width="1.6">
    <path d="M-46 262q128 92 256 0"/>
    <path d="M-46 288q128 92 256 0"/>
    <path d="M-46 314q128 92 256 0"/>
  </g>

  <!-- mascot card (soft cast shadow faked with an offset plate) -->
  <rect x="${card.x}" y="${card.y + 3}" width="${card.w}" height="${card.h}" rx="${card.r}" fill="#071A2E" opacity="0.28"/>
  <rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="${card.r}" fill="${C.white}"/>
  ${place(mascotArt, mascot)}

  ${place({ viewBox: logoArt.viewBox, inner: logoOnDark }, word)}

  <rect y="${H - 4}" width="${W}" height="4" fill="${C.yellow}"/>
</svg>`;
}

/**
 * Inner-page header mark, 55x55 logical on the wizard's white header.
 *
 * Reuses the icon tile rather than dropping bare art onto white: the tile gives
 * the mark a defined edge at this size, and the header then matches the icon
 * the user just double-clicked.
 */
function wizardSmallSvg() {
  const S = 55;
  const tile = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(iconSvg(64))[1];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <rect width="${S}" height="${S}" fill="${C.white}"/>
  <svg x="1" y="1" width="53" height="53" viewBox="0 0 64 64">${tile}</svg>
</svg>`;
}

/**
 * App icon tile: the cap-and-grin mark on a brand-blue tile, at every size.
 *
 * The full-body mascot is deliberately not used here. Its apron is brand blue
 * and its outlines are navy, so on a blue tile the torso goes muddy — and at
 * 16px the whole figure collapses to noise. Cropping to cap + face keeps one
 * mark across the whole size ramp, with skin tone carrying the contrast.
 */
function iconSvg(size) {
  const r = Math.round(size * 0.22);
  const box = { x: size * 0.05, y: size * 0.13, w: size * 0.9, h: size * 0.74 };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="t" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${size * 0.35}" y2="${size}">
      <stop offset="0" stop-color="#5AA0DC"/>
      <stop offset="0.55" stop-color="${C.brand}"/>
      <stop offset="1" stop-color="${C.brandDeep}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#t)"/>
  <rect x="0.5" y="0.5" width="${size - 1}" height="${size - 1}" rx="${r}" fill="none"
        stroke="${C.white}" stroke-opacity="0.28" stroke-width="1"/>
  ${place({ viewBox: '148 24 284 234', inner: mascotHead }, box)}
</svg>`;
}

/* -------------------------------------------------------------------- build */

fs.mkdirSync(OUT_DIR, { recursive: true });
if (PREVIEW_DIR) fs.mkdirSync(PREVIEW_DIR, { recursive: true });

const written = [];

// Wizard panels at the DPI scalings Windows actually uses. Inno Setup 6 takes a
// comma-separated list and picks the closest match at runtime.
const SCALES = [
  { suffix: '', factor: 1 },
  { suffix: '-150', factor: 1.5 },
  { suffix: '-200', factor: 2 },
  { suffix: '-250', factor: 2.5 },
];

const panelSvg = wizardPanelSvg();
const smallSvg = wizardSmallSvg();

for (const { suffix, factor } of SCALES) {
  written.push(
    await writeBmp(
      panelSvg,
      Math.round(164 * factor),
      Math.round(314 * factor),
      path.join(OUT_DIR, `wizard-large${suffix}.bmp`)
    )
  );
  written.push(
    await writeBmp(
      smallSvg,
      Math.round(55 * factor),
      Math.round(55 * factor),
      path.join(OUT_DIR, `wizard-small${suffix}.bmp`)
    )
  );
}

// Icon: DIB images up to 128px, PNG for the 256px entry (the conventional
// layout — a raw 256x256 DIB would add ~256KB for no gain).
const ICON_SIZES = [16, 20, 24, 32, 40, 48, 64, 128, 256];
const iconImages = [];
for (const size of ICON_SIZES) {
  const pipeline = render(iconSvg(size), size, size);
  if (size >= 256) {
    iconImages.push({ size, data: await pipeline.png({ compressionLevel: 9 }).toBuffer() });
  } else {
    const { data } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    iconImages.push({ size, data: encodeIcoDib(data, size, size) });
  }
}
const ico = encodeIco(iconImages);
const icoPath = path.join(OUT_DIR, 'icon.ico');
fs.writeFileSync(icoPath, ico);
written.push(icoPath);

// The browser tab uses the same mark as the installer and the desktop shortcut.
// Next.js App Router serves src/app/favicon.ico automatically, and Chrome caches
// it for "Create shortcut..." web shortcuts — so letting it drift is how you end
// up with an old logo on the tab long after the rest is rebranded.
const faviconPath = path.join(ROOT, 'src', 'app', 'favicon.ico');
fs.writeFileSync(faviconPath, ico);
written.push(faviconPath);

if (PREVIEW_DIR) {
  await render(panelSvg, 328, 628).png().toFile(path.join(PREVIEW_DIR, 'wizard-large.png'));
  await render(smallSvg, 220, 220).png().toFile(path.join(PREVIEW_DIR, 'wizard-small.png'));
  for (const size of [16, 32, 48, 256]) {
    await render(iconSvg(size), size, size)
      .resize(256, 256, { kernel: 'nearest' })
      .png()
      .toFile(path.join(PREVIEW_DIR, `icon-${size}.png`));
  }
  console.log('previews ->', PREVIEW_DIR);
}

for (const f of written) {
  console.log('wrote', path.relative(ROOT, f), `(${(fs.statSync(f).size / 1024).toFixed(1)} KB)`);
}
