import * as Haptics from "expo-haptics";
import { supabase } from "./supabaseClient";

interface ShareData {
  text?: string;
  url?: string;
  images?: string[];
}

/**
 * Process shared content from the iOS share extension.
 * Called when user shares text/URL/image from another app.
 */
export async function processSharedContent(data: ShareData): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const content = data.text ?? data.url ?? "";
    if (!content.trim() && (!data.images?.length)) {
      return { success: false, error: "No content to share" };
    }

    const message = content || "[Imagem compartilhada]";

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        title: message.slice(0, 60),
      })
      .select("id")
      .single();

    if (convError) {
      return { success: false, error: convError.message };
    }

    const { data: msg, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        role: "user",
        content: message,
        seq: 1,
        agent_id: null,
      })
      .select("id")
      .single();

    if (msgError) {
      return { success: false, error: msgError.message };
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    return { success: true, messageId: msg.id };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
