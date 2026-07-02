import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const REMINDER_NOTIFICATION_ID = 'gymlog-daily-reminder';

export async function requestNotificationPermission() {
  if (!Device.isDevice) {
    return { granted: true };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Workout reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
  }

  return { granted: finalStatus === 'granted' };
}

/**
 * Schedules a daily repeating local notification at the given hour/minute.
 * Any previously scheduled reminder is cancelled first so there is never
 * more than one active at a time.
 */
export async function scheduleDailyReminder(hour, minute) {
  await cancelDailyReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: 'Time to train 💪',
      body: "It's workout time — log today's session in GymLog!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID).catch(() => {});
}

export async function scheduleOneOffReminder(secondsFromNow = 60) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to train 💪',
      body: "It's workout time — log today's session in GymLog!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
    },
  });
}
