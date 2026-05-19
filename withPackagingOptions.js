const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

function withPackagingOptions(config) {
  // 1. Fix libc++_shared.so duplicate conflict
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("pickFirst 'lib/x86/libc++_shared.so'")) {
      config.modResults.contents = config.modResults.contents.replace(
        /android\s?\{/,
        `android {
    packagingOptions {
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
    }`
      );
    }
    return config;
  });

  // 2. Switch react-native-video-trim's FFmpeg from 'min' to 'min-gpl'
  //    so that libx264 software encoder is available (bypasses broken h264_mediacodec)
  config = withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("VideoTrim_ffmpeg_package")) {
      config.modResults.contents = config.modResults.contents.replace(
        /ext\s*\{/,
        `ext {
        VideoTrim_ffmpeg_package = "min-gpl"`
      );
    }
    return config;
  });

  return config;
}

module.exports = withPackagingOptions;
