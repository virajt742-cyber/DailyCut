import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import Clip from './models/Clip';
import * as FileSystem from 'expo-file-system/legacy';

export const clipService = {
  getClipsForMonth: (startOfMonth: number, endOfMonth: number) => {
    return database.get<Clip>('clips').query(
      Q.where('date', Q.between(startOfMonth, endOfMonth))
    ).observe();
  },

  getAllClipsAscending: async () => {
    return await database.get<Clip>('clips').query(
      Q.sortBy('date', Q.asc)
    ).fetch();
  },

  saveClip: async (date: number, videoPath: string, thumbnailPath: string) => {
    await database.write(async () => {
      // Check if clip already exists for this date and delete/replace
      const existing = await database.get<Clip>('clips').query(Q.where('date', date)).fetch();
      for (const clip of existing) {
        // Fix #7: Delete orphaned files from disk before removing the DB record
        try {
          const videoInfo = await FileSystem.getInfoAsync(clip.videoPath);
          if (videoInfo.exists) {
            await FileSystem.deleteAsync(clip.videoPath, { idempotent: true });
          }
        } catch (e) {
          console.warn('[clipService] Could not delete old video file:', clip.videoPath, e);
        }
        try {
          const thumbInfo = await FileSystem.getInfoAsync(clip.thumbnailPath);
          if (thumbInfo.exists) {
            await FileSystem.deleteAsync(clip.thumbnailPath, { idempotent: true });
          }
        } catch (e) {
          console.warn('[clipService] Could not delete old thumbnail:', clip.thumbnailPath, e);
        }

        await clip.markAsDeleted();
      }

      await database.get<Clip>('clips').create(clip => {
        clip.date = date;
        clip.videoPath = videoPath;
        clip.thumbnailPath = thumbnailPath;
      });
    });
  },
};
