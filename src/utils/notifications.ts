import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { database } from '../database';
import Clip from '../database/models/Clip';
import { calculateStreak } from './streak';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  requestPermissions: async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  },

  scheduleDailyReminder: async (hour: number, minute: number) => {
    // Cancel all previous reminders first
    await Notifications.cancelAllScheduledNotificationsAsync();

    let streak = 0;
    try {
      const clips = await database.get<Clip>('clips').query().fetch();
      streak = calculateStreak(clips);
    } catch (err) {
      console.error("Could not fetch clips for notification streak:", err);
    }

    const bodyText = streak > 0
      ? `🔥 You are on a ${streak}-day streak! Don't break it today!`
      : "Don't forget to record your 1 second today! 📹";

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Cut 📹",
        body: bodyText,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
};
