const fs = require('fs');
const https = require('https');
const zlib = require('zlib');

const raw = fs.readFileSync('eas-build.json', 'utf16le');
const data = JSON.parse(raw.replace(/^\uFEFF/, ''));
const url = data.logFiles[0];

https.get(url, (res) => {
  let chunks = [];
  const stream = res.headers['content-encoding'] === 'gzip' ? res.pipe(zlib.createGunzip()) : res;
  
  stream.on('data', (chunk) => chunks.push(chunk));
  stream.on('end', () => {
    const text = Buffer.concat(chunks).toString('utf8');
    const lines = text.split('\n');
    console.log(lines.slice(-50).join('\n'));
  });
}).on('error', (err) => console.error(err));
