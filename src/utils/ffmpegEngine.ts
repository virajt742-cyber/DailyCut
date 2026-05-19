// @ts-ignore
import { showEditor } from 'react-native-video-trim';
import { createThumbnail } from 'react-native-create-thumbnail';
import * as FileSystem from 'expo-file-system/legacy';

export const FFmpegEngine = {
  trimVideo: async (inputUri: string, outputUri: string, startTimeSeconds: number): Promise<boolean> => {
    return true;
  },

  standardizeAndOverlay: async (inputUri: string, outputUri: string, _date: Date): Promise<boolean> => {
    try {
      const safeInput = inputUri.startsWith('file://') ? inputUri : `file://${inputUri}`;
      const safeOutput = outputUri.startsWith('file://') ? outputUri : outputUri;

      const inputInfo = await FileSystem.getInfoAsync(safeInput);
      if (!inputInfo.exists) {
        console.error(`[FFmpegEngine] Input file does not exist: ${safeInput}`);
        return false;
      }

      await FileSystem.copyAsync({ from: safeInput, to: safeOutput });
      return true;
    } catch (error) {
      console.error('[FFmpegEngine] standardizeAndOverlay error:', error);
      return false;
    }
  },

  generateThumbnail: async (inputUri: string, outputUri: string): Promise<boolean> => {
    try {
      const result = await createThumbnail({
        url: inputUri,
        timeStamp: 0,
        format: 'jpeg',
      });

      await FileSystem.moveAsync({ from: result.path, to: outputUri });
      return true;
    } catch (error) {
      console.error('[FFmpegEngine] generateThumbnail error:', error);
      return false;
    }
  },

  /**
   * Merges multiple videos into a single file using react-native-video-trim's
   * built-in merge(). This uses hardware encoding (h264_mediacodec on Android).
   * If the hardware encoder fails, returns false so the caller can fall back.
   */
  exportReel: async (
    videoPaths: string[],
    outputUri: string
  ): Promise<boolean> => {
    try {
      if (videoPaths.length === 0) return false;

      // Single clip — just copy directly, no merge needed
      if (videoPaths.length === 1) {
        await FileSystem.copyAsync({ from: videoPaths[0], to: outputUri });
        console.log("[FFmpegEngine] Single clip — copied directly.");
        return true;
      }

      // Clean old output if it exists
      const outInfo = await FileSystem.getInfoAsync(outputUri);
      if (outInfo.exists) await FileSystem.deleteAsync(outputUri);

      console.log("[FFmpegEngine] Merging", videoPaths.length, "videos via react-native-video-trim...");
      const { merge } = await import('react-native-video-trim');
      
      const result = await merge(videoPaths, { outputExt: 'mp4' });
      
      if (result && result.outputPath) {
        await FileSystem.copyAsync({ from: result.outputPath, to: outputUri });
        console.log("[FFmpegEngine] Export successful!");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[FFmpegEngine] exportReel error:', error);
      return false;
    }
  },
};
