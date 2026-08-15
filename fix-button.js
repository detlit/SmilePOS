const fs = require('fs');
const path = 'd:/project/Smile/Offline/OfflineV3 27.3.26/src/app/web/document/page.tsx';

let content = fs.readFileSync(path, 'utf8');

const oldText = "            <Button1\r\n\r\n              variant=\"outline-dark\"\r\n              onClick={handleShow}\r\n              className=\"form-control form-control-sm\"\r\n              style={{ fontFamily: \"Kanit\", textAlign: \"left\", fontSize: 12, height: 30 }}\r\n            >\r\n              \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\r\n            </Button1>";

const newText = "            <button\r\n              type=\"button\"\r\n              onClick={(e) => { e.stopPropagation(); handleShow(); }}\r\n              style={{\r\n                fontFamily: \"Kanit\", fontSize: 13, padding: \"6px 16px\", borderRadius: 8,\r\n                border: \"1.5px solid #059669\", backgroundColor: \"#ecfdf5\", color: \"#059669\",\r\n                cursor: \"pointer\", display: \"inline-flex\", alignItems: \"center\", gap: 6,\r\n                transition: \"all 0.15s\", whiteSpace: \"nowrap\", fontWeight: 600,\r\n              }}\r\n              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = \"#d1fae5\"; }}\r\n              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = \"#ecfdf5\"; }}\r\n            >\r\n              + \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\r\n            </button>";

const count = content.split(oldText).length - 1;
console.log(`Found ${count} matches`);

if (count > 0) {
  content = content.replaceAll(oldText, newText);
  fs.writeFileSync(path, content, 'utf8');
  console.log(`Replaced ${count} instances successfully`);
} else {
  console.log('No matches found. Trying to debug...');
  const btnCount = (content.match(/\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32/g) || []).length;
  console.log(`Found text ${btnCount} times`);
  
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32')) {
      console.log(`Line ${i+1}: "${line}"`);
      for (let j = Math.max(0, i-5); j < i; j++) {
        console.log(`  ${j+1}: "${lines[j]}"`);
      }
    }
  });
}
