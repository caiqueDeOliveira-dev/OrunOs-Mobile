// Notifications are disabled in Expo Go (expo-notifications removed).
// Re-enable by installing expo-notifications and implementing a real service.

export async function registerForPushNotifications(): Promise<string | null> {
  return null;
}

export function addNotificationListeners() {
  return () => {};
}

export async function scheduleLocalNotification(
  _title: string,
  _body: string,
  _data?: Record<string, unknown>
) {}

export function getPushToken(): string | null {
  return null;
}
