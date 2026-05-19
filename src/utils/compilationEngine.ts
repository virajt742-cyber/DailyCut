import { clipService } from '../database/clipService';
import * as FileSystem from 'expo-file-system/legacy';
import Clip from '../database/models/Clip';

export interface ReelData {
  clips: Clip[];
  videoPaths: string[];
  missingCount: number;
}

export const compilationEngine = {
  /**
   * Loads all clips in chronological order for sequential playback.
   * Validates that each video file still exists on disk (guards against
   * cache clearing, reinstalls, or OS cleanup).
   */
  loadReelData: async (): Promise<ReelData> => {
    const allClips = await clipService.getAllClipsAscending();
    if (allClips.length === 0) {
      throw new Error('No clips to compile');
    }

    // Validate each file exists
    const validClips: Clip[] = [];
    const validPaths: string[] = [];
    let missingCount = 0;

    for (const clip of allClips) {
      try {
        const info = await FileSystem.getInfoAsync(clip.videoPath);
        if (info.exists) {
          validClips.push(clip);
          validPaths.push(clip.videoPath);
        } else {
          missingCount++;
          console.warn(`[CompilationEngine] Missing file: ${clip.videoPath}`);
        }
      } catch {
        missingCount++;
        console.warn(`[CompilationEngine] Error checking file: ${clip.videoPath}`);
      }
    }

    if (validClips.length === 0) {
      throw new Error('All clip files are missing from disk. Try re-recording.');
    }

    return { clips: validClips, videoPaths: validPaths, missingCount };
  },
};
