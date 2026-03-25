import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const ensurePermissions = async () => {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
  );
};

export const scheduleDateNotification = async (title: string, body: string, date: Date) => {
  const granted = await ensurePermissions();
  if (!granted) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
};

export const scheduleMoveInReminder = async (moveInDate: string) => {
  const date = new Date(moveInDate);
  date.setDate(date.getDate() - 1);
  date.setHours(9, 0, 0, 0);
  if (date <= new Date()) return null;
  return scheduleDateNotification(
    'Move-in reminder',
    'Your move-in is tomorrow. Review the checklist and lease preview.',
    date
  );
};

export const scheduleRenewalReminders = async (leaseEndDate: string, days: number[]) => {
  const ids: string[] = [];
  for (const day of days) {
    const date = new Date(leaseEndDate);
    date.setDate(date.getDate() - day);
    date.setHours(9, 0, 0, 0);
    if (date <= new Date()) continue;
    const id = await scheduleDateNotification(
      'Lease renewal reminder',
      `Your lease ends in ${day} days. Review renewal options.`,
      date
    );
    if (id) ids.push(id);
  }
  return ids;
};

export const cancelNotification = async (id: string) => {
  await Notifications.cancelScheduledNotificationAsync(id);
};

export const cancelNotifications = async (ids: string[]) => {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
};

export const scheduleReviewPrompt = async (checkOutTimestamp: string) => {
  const date = new Date(checkOutTimestamp);
  date.setHours(date.getHours() + 24);
  if (date <= new Date()) return null;
  return scheduleDateNotification(
    'Share your experience',
    'Your tenancy ended recently. Leave a verified review to help other renters.',
    date
  );
};
