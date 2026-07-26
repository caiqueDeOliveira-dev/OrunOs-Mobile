import { supabase } from "./supabaseClient";

export interface N8nWorkflow {
  id: string;
  name: string;
  webhookUrl: string;
  enabled: boolean;
}

export interface N8nTriggerResult {
  success: boolean;
  runId?: string;
  error?: string;
}

/**
 * Triggers an n8n workflow via its webhook URL.
 * The workflow can be used for social media publishing, automations, etc.
 */
export async function triggerN8nWorkflow(
  webhookUrl: string,
  payload: Record<string, unknown>,
): Promise<N8nTriggerResult> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return { success: false, error: `n8n returned ${res.status}` };
    }

    const data = await res.json().catch(() => ({}));
    return { success: true, runId: data.runId ?? data.id };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Publishes content to social media via n8n.
 * This is a convenience wrapper around triggerN8nWorkflow.
 */
export async function publishToSocial(
  platform: "instagram" | "tiktok" | "twitter",
  content: {
    text: string;
    imageUrl?: string;
    hashtags?: string[];
  },
  webhookUrl: string,
): Promise<N8nTriggerResult> {
  return triggerN8nWorkflow(webhookUrl, {
    action: "publish",
    platform,
    content: {
      text: content.text,
      image_url: content.imageUrl,
      hashtags: content.hashtags ?? [],
    },
  });
}

/**
 * Sends a notification via n8n (e.g., to Slack, Discord, email).
 */
export async function sendN8nNotification(
  webhookUrl: string,
  title: string,
  body: string,
): Promise<N8nTriggerResult> {
  return triggerN8nWorkflow(webhookUrl, {
    action: "notify",
    title,
    body,
  });
}
