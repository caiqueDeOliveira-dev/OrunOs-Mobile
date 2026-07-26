import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { supabase } from "./supabaseClient";

const BACKGROUND_AUTOMATION = "BACKGROUND_AUTOMATION";

TaskManager.defineTask(BACKGROUND_AUTOMATION, async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return BackgroundFetch.BackgroundFetchResult.NoData;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    const { data: automations } = await supabase
      .from("automations")
      .select("id, name, kind, enabled, config")
      .eq("enabled", true);

    if (!automations?.length) return BackgroundFetch.BackgroundFetchResult.NoData;

    let executed = 0;

    for (const automation of automations) {
      const config = automation.config as any;
      const schedule = config?.schedule;
      if (!schedule) continue;

      const matchesDay =
        !schedule.daysOfWeek?.length || schedule.daysOfWeek.includes(dayOfWeek);
      const matchesHour = !schedule.hour || schedule.hour === hour;

      if (!matchesDay || !matchesHour) continue;

      try {
        await supabase.functions.invoke("ai-relay", {
          body: {
            conversationId: config.conversationId,
            agentId: config.agentId,
            content: config.message ?? `Execute: ${automation.name}`,
          },
        });
        executed++;
      } catch {
        // Individual automation failure — continue with others
      }
    }

    if (executed > 0) {
      // Notifications disabled in Expo Go — re-enable with expo-notifications
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTask(): Promise<boolean> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_AUTOMATION);
    if (isRegistered) return true;

    await BackgroundFetch.registerTaskAsync(BACKGROUND_AUTOMATION, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    return true;
  } catch {
    return false;
  }
}

export async function unregisterBackgroundTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_AUTOMATION);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_AUTOMATION);
    }
  } catch {
    // noop
  }
}
