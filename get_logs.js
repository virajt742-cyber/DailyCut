const { execSync } = require('child_process');
const https = require('https');
const zlib = require('zlib');

console.log("Fetching EAS Build JSON...");
const output = execSync('npx eas-cli build:view 783bb4a5-5aed-46fd-bff1-7a58c9b28474 --json').toString();
const jsonStart = output.indexOf('{');
const jsonEnd = output.lastIndexOf('}') + 1;
const rawJson = output.substring(jsonStart, jsonEnd);
const data = JSON.parse(rawJson);
const url = data.logFiles[0];

console.log("Downloading logs from:", url);

https.get(url, (res) => {
  let chunks = [];
  const stream = res.headers['content-encoding'] === 'gzip' ? res.pipe(zlib.createGunzip()) : res;
  
  stream.on('data', (chunk) => chunks.push(chunk));
  stream.on('end', () => {
    const text = Buffer.concat(chunks).toString('utf8');
    const lines = text.split('\n');
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
        break; // End of Gradle error block
      }
    }
    
    if (errorLines.length > 0) {
      console.log("\n--- GRADLE ERROR FOUND ---\n");
      console.log(errorLines.join('\n'));
    } else {
      console.log("\n--- NO EXPLICIT GRADLE ERROR FOUND, PRINTING LAST 100 LINES ---\n");
      console.log(lines.slice(-100).join('\n'));
    }
  });
}).on('error', (err) => console.error(err));
