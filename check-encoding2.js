const fs = require('fs');
const path = 'd:/project/Smile/Offline/OfflineV3 27.3.26/src/app/web/document/page.tsx';

const buf = fs.readFileSync(path);

// Find "label: " in bytes
const searchStr = Buffer.from('label: "', 'utf8');
let pos = -1;
for (let i = 0; i < buf.length - searchStr.length; i++) {
  let match = true;
  for (let j = 0; j < searchStr.length; j++) {
    if (buf[i+j] !== searchStr[j]) { match = false; break; }
  }
  if (match) { pos = i; break; }
}

if (pos >= 0) {
  // Print hex of first 80 bytes after "label: "
  const start = pos + searchStr.length;
  const hexBytes = [];
  for (let i = start; i < start + 60 && i < buf.length; i++) {
    hexBytes.push(buf[i].toString(16).padStart(2, '0'));
  }
  console.log('Hex bytes after first label: ":', hexBytes.join(' '));
  console.log('As UTF-8:', buf.slice(start, start+60).toString('utf8'));
  
  // Check: are these TIS-620 / Windows-874 encoded?
  // TIS-620: Thai chars are A1-FB (single byte)
  // If these bytes were TIS-620, then decoding as UTF-8 gives wrong results
  
  // Try: interpret bytes as TIS-620/Windows-874
  // TIS-620 base = 0x0E00 for codepoints, offset from 0xA0
  // i.e., byte 0xA1 = U+0E01, byte 0xA2 = U+0E02, etc.
  const tis620Decoded = [];
  for (let i = start; i < start + 60 && i < buf.length; i++) {
    const b = buf[i];
    if (b >= 0xA1 && b <= 0xFB) {
      tis620Decoded.push(String.fromCharCode(0x0E01 + (b - 0xA1)));
    } else if (b < 0x80) {
      tis620Decoded.push(String.fromCharCode(b));
    } else {
      tis620Decoded.push('?');
    }
  }
  console.log('If TIS-620:', tis620Decoded.join(''));
}

// Also check: does the file contain bytes in 0xA1-0xFB range that are NOT part of valid UTF-8?
// no - it has BOM and passed UTF-8 parsing...

// Let me check a different approach: maybe the edit tool corrupted it
// Let me find "Store " comment (line 318) and check bytes
const storeStr = Buffer.from('Store ', 'utf8');
for (let i = 0; i < buf.length - storeStr.length; i++) {
  let match = true;
  for (let j = 0; j < storeStr.length; j++) {
    if (buf[i+j] !== storeStr[j]) { match = false; break; }
  }
  if (match) {
    const hexBytes = [];
    const s = i + storeStr.length;
    for (let k = s; k < s + 30 && k < buf.length; k++) {
      hexBytes.push(buf[k].toString(16).padStart(2, '0'));
    }
    console.log('\nHex after "Store ":', hexBytes.join(' '));
    console.log('As UTF-8:', buf.slice(s, s+30).toString('utf8'));
    break;
  }
}
