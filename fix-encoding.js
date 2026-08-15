// Fix double-encoding: UTF-8 bytes were misread as Windows-874 and re-encoded as UTF-8
// To fix: convert each codepoint back to its CP874 byte value, then decode as UTF-8

const fs = require('fs');
const filePath = 'd:/project/Smile/Offline/OfflineV3 27.3.26/src/app/web/document/page.tsx';

// Build reverse CP874 (Windows-874) mapping: codepoint -> byte
const cp874ToByte = new Map();

// ASCII: 0x00-0x7F map to themselves
for (let i = 0; i <= 0x7F; i++) {
  cp874ToByte.set(i, i);
}

// 0x80-0x9F range (Windows-874 specific)
cp874ToByte.set(0x20AC, 0x80); // €
// 0x81-0x84: undefined in CP874, mapped to control chars
cp874ToByte.set(0x0081, 0x81);
cp874ToByte.set(0x0082, 0x82);
cp874ToByte.set(0x0083, 0x83);
cp874ToByte.set(0x0084, 0x84);
cp874ToByte.set(0x2026, 0x85); // …
cp874ToByte.set(0x0086, 0x86);
cp874ToByte.set(0x0087, 0x87);
cp874ToByte.set(0x0088, 0x88);
cp874ToByte.set(0x0089, 0x89);
cp874ToByte.set(0x008A, 0x8A);
cp874ToByte.set(0x008B, 0x8B);
cp874ToByte.set(0x008C, 0x8C);
cp874ToByte.set(0x008D, 0x8D);
cp874ToByte.set(0x008E, 0x8E);
cp874ToByte.set(0x008F, 0x8F);
cp874ToByte.set(0x0090, 0x90);
cp874ToByte.set(0x2018, 0x91); // '
cp874ToByte.set(0x2019, 0x92); // '
cp874ToByte.set(0x201C, 0x93); // "
cp874ToByte.set(0x201D, 0x94); // "
cp874ToByte.set(0x2022, 0x95); // •
cp874ToByte.set(0x2013, 0x96); // –
cp874ToByte.set(0x2014, 0x97); // —
cp874ToByte.set(0x0098, 0x98);
cp874ToByte.set(0x0099, 0x99);
cp874ToByte.set(0x009A, 0x9A);
cp874ToByte.set(0x009B, 0x9B);
cp874ToByte.set(0x009C, 0x9C);
cp874ToByte.set(0x009D, 0x9D);
cp874ToByte.set(0x009E, 0x9E);
cp874ToByte.set(0x009F, 0x9F);

// 0xA0: NBSP
cp874ToByte.set(0x00A0, 0xA0);

// 0xA1-0xDA: Thai chars U+0E01-U+0E3A
for (let i = 0; i <= 0x39; i++) {
  cp874ToByte.set(0x0E01 + i, 0xA1 + i);
}

// 0xDB-0xDE: undefined, map to control
cp874ToByte.set(0x00DB, 0xDB);
cp874ToByte.set(0x00DC, 0xDC);
cp874ToByte.set(0x00DD, 0xDD);
cp874ToByte.set(0x00DE, 0xDE);

// 0xDF-0xFB: Thai chars U+0E3F-U+0E5B
for (let i = 0; i <= 0x1C; i++) {
  cp874ToByte.set(0x0E3F + i, 0xDF + i);
}

// 0xFC-0xFF: undefined
cp874ToByte.set(0x00FC, 0xFC);
cp874ToByte.set(0x00FD, 0xFD);
cp874ToByte.set(0x00FE, 0xFE);
cp874ToByte.set(0x00FF, 0xFF);

// Read the corrupted file
const corruptedText = fs.readFileSync(filePath, 'utf8');

// Skip BOM if present
let startIdx = 0;
if (corruptedText.charCodeAt(0) === 0xFEFF) {
  startIdx = 1;
}

// Convert each character back to CP874 byte
const bytes = [];
let unmappedCount = 0;
const unmappedChars = new Set();

for (let i = startIdx; i < corruptedText.length; i++) {
  const cp = corruptedText.codePointAt(i);
  
  if (cp874ToByte.has(cp)) {
    bytes.push(cp874ToByte.get(cp));
  } else {
    // Character doesn't have a CP874 mapping - this shouldn't happen
    // in a properly double-encoded file, but handle it gracefully
    unmappedCount++;
    unmappedChars.add('U+' + cp.toString(16).toUpperCase().padStart(4, '0'));
    // Keep the original UTF-8 bytes
    const charStr = String.fromCodePoint(cp);
    const charBuf = Buffer.from(charStr, 'utf8');
    for (const b of charBuf) {
      bytes.push(b);
    }
    // Handle surrogate pairs
    if (cp > 0xFFFF) i++;
  }
}

if (unmappedCount > 0) {
  console.log(`Warning: ${unmappedCount} chars had no CP874 mapping:`, [...unmappedChars].slice(0, 20));
}

// The bytes array now contains the original UTF-8 content
const fixedBuf = Buffer.from(bytes);
const fixedText = fixedBuf.toString('utf8');

// Verify the fix
const testWords = ['เอกสารขาย', 'ใบเสนอราคา', 'เพิ่มสินค้า', 'ร้านค้า', 'รออนุมัติ'];
for (const word of testWords) {
  console.log(`"${word}" found: ${fixedText.includes(word)}`);
}

// Count Thai chars in fixed version
const thaiCount = (fixedText.match(/[\u0E00-\u0E7F]/g) || []).length;
console.log(`Thai chars in fixed version: ${thaiCount}`);

// Show a sample line
const fixedLines = fixedText.split('\n');
for (let i = 0; i < fixedLines.length; i++) {
  if (fixedLines[i].includes('salesDocTypes')) {
    for (let j = i; j < Math.min(i + 8, fixedLines.length); j++) {
      console.log(`L${j+1}: ${fixedLines[j]}`);
    }
    break;
  }
}

// Write backup and fixed file
fs.writeFileSync(filePath + '.bak', corruptedText, 'utf8');
console.log('\nBackup saved to page.tsx.bak');

// Write with BOM
const bomBuf = Buffer.from([0xEF, 0xBB, 0xBF]);
const finalBuf = Buffer.concat([bomBuf, fixedBuf]);
fs.writeFileSync(filePath, finalBuf);
console.log('Fixed file saved!');
console.log(`Original size: ${Buffer.byteLength(corruptedText, 'utf8')} bytes`);
console.log(`Fixed size: ${finalBuf.length} bytes`);
