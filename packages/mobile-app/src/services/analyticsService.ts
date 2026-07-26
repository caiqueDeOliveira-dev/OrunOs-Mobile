let posthog: any = null;

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export async function initAnalytics(): Promise<void> {
  if (!POSTHOG_KEY) return;

  try {
    const PostHog = require("posthog-react-native").default;
    posthog = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      captureApplicationLifecycleEvents: true,
      captureScreenViews: true,
    });
  } catch {
    // posthog-react-native not installed
  }
}

export function identify(userId: string, properties?: Record<string, unknown>): void {
  posthog?.identify(userId, properties);
}

export function track(event: string, properties?: Record<string, unknown>): void {
  posthog?.capture(event, properties);
}

export function trackScreen(screenName: string, properties?: Record<string, unknown>): void {
  posthog?.screen(screenName, properties);
}

export function trackChatSent(agentId: string, provider: string): void {
  track("chat_message_sent", { agent_id: agentId, provider });
}

export function trackVoiceRecorded(durationSeconds: number): void {
  track("voice_recorded", { duration_seconds: durationSeconds });
}

export function trackAutomationTriggered(automationId: string, method: string): void {
  track("automation_triggered", { automation_id: automationId, method });
}

export function flush(): void {
  posthog?.flush();
}

export function shutdown(): void {
  posthog?. shutdown();
}
