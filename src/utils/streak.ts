import { isSameDay, subDays, format } from 'date-fns';
import Clip from '../database/models/Clip';

export function calculateStreak(clips: Clip[]): number {
  if (!clips || clips.length === 0) return 0;
  
  // Fix #9: Deduplicate by date before counting streak.
  // Re-recorded clips (via markAsDeleted + create) can leave
  // duplicate date entries in some WatermelonDB query modes.
  const uniqueByDate = new Map<string, Clip>();
  for (const clip of clips) {
    const key = format(new Date(clip.date), 'yyyy-MM-dd');
    uniqueByDate.set(key, clip); // last one wins — fine for streak counting
  }
  
  // Sort deduplicated clips descending by date
  const sorted = [...uniqueByDate.values()].sort((a, b) => b.date - a.date);
  let streak = 0;
  let checkDate = new Date(); // Start checking from today
  
  // If no clip today, but clip yesterday, streak continues
  const todayKey = format(checkDate, 'yyyy-MM-dd');
  if (!uniqueByDate.has(todayKey)) {
    checkDate = subDays(checkDate, 1);
  }

  for (let i = 0; i < sorted.length; i++) {
    if (isSameDay(new Date(sorted[i].date), checkDate)) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else if (new Date(sorted[i].date) < checkDate) {
      break; // Streak broken
    }
  }
  return streak;
}
