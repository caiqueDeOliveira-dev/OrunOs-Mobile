import React, { memo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../theme/ThemeProvider";
import { RADIUS, SPACING, TYPOGRAPHY, FONT_WEIGHT } from "../../theme/tokens";
import { Avatar } from "../ui/Avatar";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { speak, stopSpeaking, isSpeaking } from "../../services/voiceService";
import { getLocale } from "../../i18n";
import type { ChatMessage } from "../../types";

interface MessageBubbleProps {
  message: ChatMessage;
  agentName?: string;
  onLongPress?: (message: ChatMessage) => void;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  agentName = "Hampton",
  onLongPress,
}: MessageBubbleProps) {
  const { colors } = useTheme();
  const isUser = message.role === "user";
  const [ttsActive, setTtsActive] = useState(false);

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" });
  }

  async function handleTTSToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (ttsActive || isSpeaking()) {
      await stopSpeaking();
      setTtsActive(false);
    } else {
      setTtsActive(true);
      await speak(message.content, { language: getLocale() });
      setTtsActive(false);
    }
  }

  return (
    <Pressable
      onLongPress={() => onLongPress?.(message)}
      delayLongPress={500}
      style={[styles.row, isUser && styles.rowUser]}
    >
      {!isUser && (
        <View style={styles.avatarWrap}>
          <Avatar name={agentName} size="sm" isCore />
        </View>
      )}
      <View style={[styles.bubbleCol, isUser && styles.bubbleColUser]}>
        {!isUser && (
          <Text style={[styles.agentName, { color: colors.textSecondary }]}>{agentName}</Text>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: colors.accent, borderBottomRightRadius: 4 }
              : {
                  backgroundColor: colors.surface,
                  borderBottomLeftRadius: 4,
                  borderWidth: 1,
                  borderColor: colors.surfaceBorder + "14",
                },
          ]}
        >
          {isUser ? (
            <Text style={[styles.text, { color: colors.textInverted }]}>
              {message.content}
            </Text>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {formatTime(message.created_at)}
          </Text>
          {!isUser && (
            <Pressable
              onPress={handleTTSToggle}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[styles.ttsBtn, ttsActive && { backgroundColor: colors.accent + "20" }]}
              accessibilityRole="button"
              accessibilityLabel={ttsActive ? "Parar leitura" : "Ouvir mensagem"}
              accessibilityState={{ busy: ttsActive }}
            >
              <Text style={[styles.ttsIcon, { color: ttsActive ? colors.accent : colors.textMuted }]}>
                {ttsActive ? "⏹" : "🔊"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  rowUser: {
    flexDirection: "row-reverse",
  },
  avatarWrap: {
    marginBottom: 18,
  },
  bubbleCol: {
    maxWidth: "78%",
    gap: 3,
  },
  bubbleColUser: {
    alignItems: "flex-end",
  },
  agentName: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: FONT_WEIGHT.medium,
    paddingHorizontal: SPACING.xs,
  },
  bubble: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  text: {
    fontSize: TYPOGRAPHY.md,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  time: {
    fontSize: TYPOGRAPHY.xs,
    paddingHorizontal: SPACING.xs,
  },
  ttsBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ttsIcon: {
    fontSize: 12,
  },
});
