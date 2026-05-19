/**
 * Post-install patch for react-native-video-trim.
 * Replaces the hardcoded h264_mediacodec hardware encoder with libx264 software encoder
 * in the native Android source code. This fixes the "MediaCodec configure failed" crash
 * on devices where the hardware encoder is broken or unsupported.
 *
 * This runs automatically after `npm install` via the "postinstall" script in package.json.
 */
const fs = require('fs');
const path = require('path');

const KOTLIN_FILE = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-video-trim',
  'android',
  'src',
  'main',
  'java',
  'com',
  'videotrim',
  'utils',
  'VideoTrimmerUtil.kt'
);

function patch() {
  if (!fs.existsSync(KOTLIN_FILE)) {
    console.log('[patch-encoder] VideoTrimmerUtil.kt not found — skipping (library may not be installed yet).');
    return;
  }

  let content = fs.readFileSync(KOTLIN_FILE, 'utf8');

  if (content.includes('"h264_mediacodec"')) {
    content = content.replace(
      /\"h264_mediacodec\"/g,
      '"libx264"'
    );
    fs.writeFileSync(KOTLIN_FILE, content, 'utf8');
    console.log('[patch-encoder] ✅ Patched h264_mediacodec → libx264 in VideoTrimmerUtil.kt');
  } else if (content.includes('"libx264"')) {
    console.log('[patch-encoder] Already patched — libx264 is set.');
  } else {
    console.log('[patch-encoder] ⚠️ Could not find encoder reference to patch.');
  }
}

patch();
