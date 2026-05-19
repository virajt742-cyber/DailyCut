const fs = require('fs');
const zlib = require('zlib');

try {
  const compressed = fs.readFileSync('eas_logs.txt');
  let decompressed;
  try {
    decompressed = zlib.unzipSync(compressed).toString('utf-8');
  } catch (e) {
    decompressed = zlib.brotliDecompressSync(compressed).toString('utf-8');
  }
  const lines = decompressed.split('\n');
  
  let errorLines = [];
  let capture = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('FAILURE: Build failed with an exception.')) {
      capture = true;
    }
    if (capture) {
      errorLines.push(lines[i]);
    }
    if (capture && lines[i].includes('* Get more help at')) {
      break;
    }
  }
  
  if (errorLines.length > 0) {
    console.log('\n--- EXACT GRADLE ERROR ---\n');
    console.log(errorLines.join('\n'));
  } else {
    console.log('\n--- LAST 100 LINES ---\n');
    console.log(lines.slice(-100).join('\n'));
  }
} catch (e) {
  console.error("Error decompressing:", e.message);
}
