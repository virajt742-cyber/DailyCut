const fs = require('fs');
const zlib = require('zlib');

const compressed = fs.readFileSync('eas_logs.txt');
let decompressed;
try {
  decompressed = zlib.unzipSync(compressed).toString('utf-8');
} catch (e) {
  decompressed = zlib.brotliDecompressSync(compressed).toString('utf-8');
}
const lines = decompressed.split('\n').filter(l => l.trim().length > 0);

let errorBlock = [];
let capture = false;
let allMsgs = [];

for (let line of lines) {
  try {
    const json = JSON.parse(line);
    if (json.msg) {
      const msg = json.msg;
      allMsgs.push(msg);
      
      if (msg.includes('FAILURE: Build failed with an exception.')) {
        capture = true;
      }
      
      if (capture) {
        errorBlock.push(msg);
      }
      
      if (capture && msg.includes('* Get more help at')) {
        break;
      }
    }
  } catch (e) {
    // skip invalid json
  }
}

if (errorBlock.length > 0) {
  console.log('--- ERROR BLOCK ---');
  console.log(errorBlock.join('\n'));
} else {
  // Try to find the word 'error:' in allMsgs
  const explicitErrors = allMsgs.filter(m => m.toLowerCase().includes('error:') || m.toLowerCase().includes('failed'));
  if (explicitErrors.length > 0) {
    console.log('--- EXPLICIT ERRORS ---');
    console.log(explicitErrors.slice(-30).join('\n'));
  } else {
    console.log('--- LAST 50 LINES ---');
    console.log(allMsgs.slice(-50).join('\n'));
  }
}
