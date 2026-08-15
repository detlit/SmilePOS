const fs = require('fs');
const path = 'd:/project/Smile/Offline/OfflineV3 27.3.26/src/app/web/document/page.tsx';

const buf = fs.readFileSync(path);
const c = buf.toString('utf8');

// Find first "label:" and show chars around it
const idx = c.indexOf('label:');
console.log('Found label at index:', idx);
if (idx > 0) {
  const slice = c.substring(idx, idx + 80);
  console.log('Raw string:', JSON.stringify(slice));
  
  // Try to fix: treat each char as a Latin-1 byte, then decode as UTF-8
  try {
    const bytes = Buffer.from(slice, 'latin1');  
    const fixed = bytes.toString('utf8');
    console.log('After latin1->utf8:', fixed);
  } catch(e) {
    console.log('Fix failed:', e.message);
  }
}

// Also check: originally file content around line 318 (original Thai)
const lines = c.split('\n');
console.log('\nLine 318:', JSON.stringify(lines[317]));
console.log('Line 357:', JSON.stringify(lines[356]));

// Check hex of first Thai char sequence
const thaiMatch = c.match(/[\u0E00-\u0E7F]+/);
if (thaiMatch) {
  const thaiStr = thaiMatch[0].substring(0, 10);
  console.log('\nFirst Thai sequence:', JSON.stringify(thaiStr));
  // Print codepoints
  const cps = [...thaiStr].map(ch => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
  console.log('Codepoints:', cps.join(' '));
  
  // Try latin1 decode
  const thaiBytes = Buffer.from(thaiStr, 'latin1');
  console.log('Hex bytes:', thaiBytes.toString('hex'));
  try {
    console.log('Decoded as UTF-8:', thaiBytes.toString('utf8'));
  } catch(e) {
    console.log('Decode error');
  }
}
