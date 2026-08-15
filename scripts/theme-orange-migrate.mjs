/**
 * SmileStore POS — green ➜ orange brand migration.
 *
 * The app was originally built with green as the brand colour, but green also
 * encodes the "success" side of the status triad (green = ok / amber = pending
 * / red = failed). A blind find-and-replace destroys that meaning, so every
 * occurrence is classified before it is rewritten:
 *
 *   BRAND   → re-mapped shade-for-shade onto the warm orange ramp
 *   SUCCESS → normalised onto ONE canonical success-green ramp, so the three
 *             green families that were in use (tailwind green, emerald and MUI
 *             green) stop looking accidental and read as a deliberate token
 *
 * This script is idempotent: the output palettes are not inputs, so re-running
 * it changes nothing. It is kept in the repo as the record of how the palette
 * was derived, and to re-run if stray greens get reintroduced.
 *
 *   node scripts/theme-orange-migrate.mjs                  # dry run + report
 *   node scripts/theme-orange-migrate.mjs --apply          # write files
 *   node scripts/theme-orange-migrate.mjs --report success # sample a bucket
 *   REASON="on/off" node scripts/theme-orange-migrate.mjs --report brand
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const APPLY = process.argv.includes('--apply');
const reportIdx = process.argv.indexOf('--report');
const REPORT = reportIdx !== -1 ? process.argv[reportIdx + 1] : null;
const SAMPLES = Number(process.env.SAMPLES || 14);

/* ------------------------------------------------------------------ ramps */
// Warm, deep orange. Anchors chosen for long-shift legibility: 500 is the
// primary, 600 the hover/active, 800 the on-light text tone.
const ORANGE = {
  50: '#FFF7EF', 100: '#FDEBD8', 200: '#F8D4B0', 300: '#F0B27C', 400: '#E88F45',
  500: '#E06B10', 600: '#B85207', 700: '#94420A', 800: '#7C3A08', 900: '#5C2B07',
};

// Calm, slightly desaturated green. Stays unmistakably "success" beside the
// warm brand orange without the neon edge of tailwind green-500.
const SUCCESS = {
  50: '#EDF9F3', 100: '#D3F0E2', 200: '#A9E1C6', 300: '#74CCA4', 400: '#43B283',
  500: '#1F9D6B', 600: '#147F56', 700: '#0F6845', 800: '#0C5238', 900: '#083B29',
};

// Every green that appeared in the codebase, keyed to its 50..900 ramp position.
const SHADE = {
  // tailwind green
  '#f0fdf4': 50, '#dcfce7': 100, '#bbf7d0': 200, '#86efac': 300, '#4ade80': 400,
  '#22c55e': 500, '#16a34a': 600, '#15803d': 700, '#166534': 800, '#14532d': 900,
  // tailwind emerald
  '#ecfdf5': 50, '#d1fae5': 100, '#a7f3d0': 200, '#6ee7b7': 300, '#34d399': 400,
  '#10b981': 500, '#059669': 600, '#047857': 700, '#065f46': 800, '#064e3b': 900,
  // material green
  '#e8f5e9': 50, '#c8e6c9': 100, '#a5d6a7': 200, '#81c784': 300, '#66bb6a': 400,
  '#4caf50': 500, '#43a047': 600, '#388e3c': 700, '#2e7d32': 800, '#1b5e20': 900,
};

const GREEN_RE = new RegExp(`#(?:${Object.keys(SHADE).map((h) => h.slice(1)).join('|')})\\b`, 'gi');

/* ------------------------------------------------------------- classifier */
const DANGER_WARN = /#(?:dc2626|ef4444|b91c1c|f87171|fee2e2|fecaca|fef2f2|991b1b|7f1d1d|e53935|d32f2f|c62828|f44336|f59e0b|d97706|b45309|92400e|fef3c7|fde68a|fffbeb|fcd34d|fbbf24|eab308|facc15|ff9800|ed6c02|fff7ed|ffedd5|9a3412|c2410c|ea580c)\b/i;

// Conditionals that switch on which tab/menu/row is *selected* are chrome, not
// status — they go orange even though they look like state.
const UI_STATE = /(showcolor|activetab|selectedtab|tabindex|currentpage|currenttab|ishover|hover|ismenu|menuopen|isopen|isexpand|collaps|sidebar|===\s*index|index\s*===|\bselected\b|isselected|iscurrent|\btab\s*===|\bpage\s*===|\bmode\s*===|view\s*===|sort|filter\s*===|isfocus|focused|darkmode|theme)/i;

// Words that genuinely name a record's state — these keep their green even when
// the opposite branch is only a muted grey.
const STRONG_STATUS = /(status|สถานะ|completed|success|สำเร็จ|เรียบร้อย|approved|อนุมัติ|paid|ชำระ|จ่ายแล้ว|online|เชื่อมต่อ|connected|checkin|เข้างาน|registered|consent|verified|ยืนยัน|expire|หมดอายุ|ตรงเวลา|ปกติ|instock|มีสต็อก|รับเข้า|ผ่าน)/i;

// Positive-vs-negative number formatting (profit, balance, stock movement).
const NUMERIC = /(>=?\s*0|<=?\s*0|>\s*0|<\s*0|profit|กำไร|revenue|ยอดขาย|balance|คงเหลือ|netprofit|\bgp\b|increase|เพิ่มขึ้น)/i;

// Ambiguous alone: "enabled" is a status on a record but chrome on a toggle.
// Resolved below by what the opposite branch paints.
const WEAK_STATE = /(isactive|\bactive\b|enabled|เปิดใช้|available|พร้อม|valid|\bdone\b|finish|เสร็จ|match|ครบ|\bok\b|normal|pass\b)/i;

// A grey counterpart means "off / disabled / empty" — a control, not a status
// readout — so it belongs to the brand.
const NEUTRAL = /#(?:94a3b8|64748b|4b5563|6b7280|9ca3af|cbd5e1|e2e8f0|d1d5db|e5e7eb|f1f5f9|f8fafc|475569|334155|1e293b|0f172a|a1a1aa|d4d4d8|71717a|adb5bd|ced4da|dee2e6|f8f9fa|808080)\b/i;

// Strong enough to mean "success" with no conditional in sight.
const SEMANTIC_PLAIN = /(สำเร็จ|เรียบร้อย|อนุมัติ|approved|completed|ชำระแล้ว|จ่ายแล้ว|รับเข้า|เข้างาน|ตรงเวลา|ผ่านแล้ว|instock|กำไร|profit)/i;

function classify(line, idx) {
  const before = line.slice(0, idx);
  const qIdx = before.lastIndexOf('?');

  if (qIdx !== -1) {
    const window = line.slice(Math.max(0, idx - 170), Math.min(line.length, idx + 170));
    const guard = before.slice(Math.max(0, qIdx - 190), qIdx);

    // Most reliable signal: the other branch paints red or amber, so this green
    // is the success arm of a status triad.
    if (DANGER_WARN.test(window)) return ['success', 'paired-with-danger/warning'];
    if (UI_STATE.test(guard)) return ['brand', 'ui-state conditional'];
    if (STRONG_STATUS.test(guard)) return ['success', 'named status'];

    if (NUMERIC.test(guard) || WEAK_STATE.test(guard)) {
      return NEUTRAL.test(window)
        ? ['brand', 'on/off control (green vs grey)']
        : ['success', 'semantic conditional'];
    }
    return ['brand', 'unclassified conditional'];
  }

  if (SEMANTIC_PLAIN.test(line)) return ['success', 'success label on line'];
  return ['brand', 'plain chrome'];
}

/* --------------------------------------------------- rgb()/rgba() variants */
// Glows and shadows are written as rgba(34, 197, 94, .3) rather than hex, so
// they survive a hex-only sweep and leave green halos under orange buttons.
const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

const RGB_SHADE = new Map();
for (const [hex, shade] of Object.entries(SHADE)) RGB_SHADE.set(hexToRgb(hex).join(','), shade);
// Hand-written greens that never matched a ramp exactly.
RGB_SHADE.set('22,163,106', 600);
RGB_SHADE.set('39,141,19', 600);
RGB_SHADE.set('4,124,0', 600);

function migrateRgb(line, guardLine, stat) {
  return line.replace(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*[0-9.]+\s*)?\)/gi,
    (full, r, g, b, alpha, off) => {
      const shade = RGB_SHADE.get(`${+r},${+g},${+b}`);
      if (shade === undefined) return full;
      const [kind, reason] = classify(guardLine, off);
      const [nr, ng, nb] = hexToRgb(kind === 'brand' ? ORANGE[shade] : SUCCESS[shade]);
      stat(kind, `${reason} (rgba)`);
      // `alpha` keeps its own leading comma — do not add another.
      return alpha ? `rgba(${nr}, ${ng}, ${nb}${alpha})` : `rgb(${nr}, ${ng}, ${nb})`;
    });
}

/* --------------------------------------------------------- gradient repair */
// green-600 → emerald-600 was a two-tone gradient; both land on the same orange
// once collapsed onto a single ramp, flattening it. Where consecutive stops come
// out identical, step the later one down the ramp so the gradient keeps depth.
const STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const RAMP_OF = new Map();
for (const [k, v] of Object.entries(ORANGE)) RAMP_OF.set(v.toLowerCase(), ['orange', Number(k)]);
for (const [k, v] of Object.entries(SUCCESS)) RAMP_OF.set(v.toLowerCase(), ['success', Number(k)]);

function repairGradients(text) {
  let fixes = 0;
  const out = text.replace(/(?:linear|radial)-gradient\([^)]*\)/gi, (grad) => {
    // `prev` must be scoped to one gradient — letting it leak across gradients
    // makes unrelated stops look like duplicates.
    let prev = null;
    return grad.replace(/#[0-9a-f]{6}\b/gi, (hex) => {
      const cur = RAMP_OF.get(hex.toLowerCase());
      if (!cur) { prev = null; return hex; }
      if (prev && prev[0] === cur[0] && prev[1] === cur[1]) {
        const next = STOPS[Math.min(STOPS.indexOf(cur[1]) + 2, STOPS.length - 1)];
        prev = [cur[0], next];
        fixes++;
        return (cur[0] === 'orange' ? ORANGE : SUCCESS)[next];
      }
      prev = cur;
      return hex;
    });
  });
  return [out, fixes];
}

/* ------------------------------------------------------------------- walk */
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue;
      walk(p, out);
    } else if (/\.(tsx|jsx|ts|js|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

const stats = { brand: 0, success: 0 };
const byReason = {};
const samples = { brand: [], success: [] };
const touched = [];

for (const file of walk(SRC)) {
  const original = fs.readFileSync(file, 'utf8');
  const lines = original.split('\n');

  let next = lines.map((line, ln) => {
    const rel = `${path.relative(ROOT, file).split(path.sep).join('/')}:${ln + 1}`;
    const record = (kind, reason, hex, to, off) => {
      stats[kind]++;
      byReason[reason] = (byReason[reason] || 0) + 1;
      const bucket = samples[kind];
      if (bucket.length < 400) {
        bucket.push({ reason, loc: rel, hex, to, text: line.trim().slice(Math.max(0, off - 78), off + 60) });
      }
    };

    const withHex = line.replace(GREEN_RE, (hex, off) => {
      const shade = SHADE[hex.toLowerCase()];
      const [kind, reason] = classify(line, off);
      const to = (kind === 'brand' ? ORANGE : SUCCESS)[shade];
      record(kind, reason, hex, to, off);
      return to;
    });

    // Classify against the ORIGINAL line so the guard text is still intact.
    return migrateRgb(withHex, line, (kind, reason) => record(kind, reason, 'rgba', 'rgba', 0));
  }).join('\n');

  const [repaired, fixes] = repairGradients(next);
  next = repaired;
  if (fixes) byReason['gradient depth restored'] = (byReason['gradient depth restored'] || 0) + fixes;

  if (next !== original) {
    touched.push(path.relative(ROOT, file).split(path.sep).join('/'));
    if (APPLY) fs.writeFileSync(file, next);
  }
}

/* ----------------------------------------------------------------- report */
if (REPORT) {
  const bucket = samples[REPORT] || [];
  const filter = process.env.REASON;
  const wanted = filter ? bucket.filter((s) => s.reason.includes(filter)) : bucket;
  const step = Math.max(1, Math.floor(wanted.length / SAMPLES));
  console.log(`\n── ${REPORT.toUpperCase()} samples (every ${step}th of ${wanted.length}) ──`);
  for (let i = 0; i < wanted.length; i += step) {
    const s = wanted[i];
    console.log(`\n${s.loc}  [${s.reason}]  ${s.hex} → ${s.to}`);
    console.log(`   …${s.text}`);
  }
} else {
  console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'} — ${stats.brand + stats.success} green values in ${touched.length} files`);
  console.log(`  brand   → orange : ${stats.brand}`);
  console.log(`  success → green  : ${stats.success}`);
  console.log('\nby rule:');
  for (const [r, n] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(5)}  ${r}`);
  }
}
