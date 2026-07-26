import { Platform } from "react-native";
import { t } from "../i18n";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return t("time.now");
  if (mins < 60) return t("time.minutesAgo", { count: String(mins) });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("time.hoursAgo", { count: String(hours) });
  return t("time.daysAgo", { count: String(Math.floor(hours / 24)) });
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "...";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const IS_IOS = Platform.OS === "ios";
export const IS_ANDROID = Platform.OS === "android";

export function formatMessageContent(content: string): string {
  return content
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
