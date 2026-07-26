import { describe, it, expect } from "vitest";
import {
  registerForPushNotifications,
  addNotificationListeners,
  scheduleLocalNotification,
  getPushToken,
} from "./notificationService";

describe("notificationService (stub)", () => {
  it("registerForPushNotifications returns null (disabled in Expo Go)", async () => {
    const token = await registerForPushNotifications();
    expect(token).toBeNull();
  });

  it("addNotificationListeners returns a noop unsubscribe function", () => {
    const unsub = addNotificationListeners();
    expect(typeof unsub).toBe("function");
    expect(unsub()).toBeUndefined();
  });

  it("scheduleLocalNotification is a noop", async () => {
    await expect(scheduleLocalNotification("title", "body")).resolves.toBeUndefined();
    await expect(scheduleLocalNotification("title", "body", { key: "val" })).resolves.toBeUndefined();
  });

  it("getPushToken returns null", () => {
    expect(getPushToken()).toBeNull();
  });
});
