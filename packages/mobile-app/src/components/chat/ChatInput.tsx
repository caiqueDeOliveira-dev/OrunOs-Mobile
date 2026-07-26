import React, { useState, useRef } from "react";
import { View, TextInput, Pressable, Text, StyleSheet, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { RADIUS, SPACING, TYPOGRAPHY, FONT_WEIGHT } from "../../theme/tokens";
import { t } from "../../i18n";

interface ChatInputProps {
  onSend: (text: string) => void;
  onVoiceStart?: () => void;
  onCamera?: () => void;
  placeholder?: string;
  sending?: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onVoiceStart,
  onCamera,
  placeholder,
  sending = false,
  disabled = false,
}: ChatInputProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    onSend(trimmed);
    setText("");
    Keyboard.dismiss();
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgBase,
          borderTopColor: colors.surfaceBorder + "14",
          paddingBottom: insets.bottom || SPACING.sm,
        },
      ]}
    >
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.bgSunken,
            borderColor: colors.surfaceBorder + "14",
          },
        ]}
      >
        {onCamera && (
          <Pressable
            onPress={onCamera}
            style={styles.voiceButton}
            disabled={disabled}
          >
            <Text style={[styles.icon, { color: colors.textMuted }]}>📷</Text>
          </Pressable>
        )}

        {onVoiceStart && !text.trim() && (
          <Pressable
            onPress={onVoiceStart}
            style={styles.voiceButton}
            disabled={disabled}
          >
            <Text style={[styles.icon, { color: colors.textMuted }]}>🎙</Text>
          </Pressable>
        )}

        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.textPrimary }]}
          value={text}
          onChangeText={setText}
          placeholder={placeholder ?? t("chat.placeholder")}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={4000}
          editable={!disabled && !sending}
          blurOnSubmit={false}
        />

        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || sending || disabled}
          style={[
            styles.sendButton,
            {
              backgroundColor: text.trim() && !sending ? colors.accent : colors.surfaceActive,
            },
          ]}
        >
          <Text
            style={[
              styles.sendIcon,
              {
                color: text.trim() && !sending ? colors.textInverted : colors.textMuted,
              },
            ]}
          >
            {sending ? "..." : "↑"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  voiceButton: {
    padding: SPACING.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    minHeight: 24,
    maxHeight: 120,
    fontSize: TYPOGRAPHY.md,
    lineHeight: 22,
    paddingVertical: SPACING.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: {
    fontSize: 16,
    fontWeight: FONT_WEIGHT.bold,
  },
});
