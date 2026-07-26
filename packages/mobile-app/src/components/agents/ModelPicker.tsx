import React, { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../theme/ThemeProvider";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../theme/tokens";
import { t } from "../../i18n";

const MODELS = [
  { id: "gpt-4o", provider: "openai", label: "GPT-4o" },
  { id: "gpt-4o-mini", provider: "openai", label: "GPT-4o Mini" },
  { id: "claude-sonnet-4-20250514", provider: "anthropic", label: "Claude Sonnet" },
  { id: "claude-3-5-haiku-20241022", provider: "anthropic", label: "Claude Haiku" },
  { id: "gemini-2.5-pro", provider: "google", label: "Gemini 2.5 Pro" },
  { id: "gemini-2.0-flash", provider: "google", label: "Gemini Flash" },
  { id: "gpt-5.5", provider: "opencode", label: "GPT 5.5" },
  { id: "gpt-5.4-mini", provider: "opencode", label: "GPT 5.4 Mini" },
  { id: "claude-sonnet-5", provider: "opencode", label: "Claude Sonnet 5" },
  { id: "claude-haiku-4-5", provider: "opencode", label: "Claude Haiku 4.5" },
  { id: "deepseek-v4-flash", provider: "opencode", label: "DeepSeek V4 Flash" },
  { id: "grok-4.5", provider: "opencode", label: "Grok 4.5" },
];

interface ModelPickerProps {
  currentModel: string;
  onSelect: (modelId: string, provider: string) => void;
}

export function ModelPicker({ currentModel, onSelect }: ModelPickerProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  const current = MODELS.find((m) => m.id === currentModel);

  function handleSelect(model: (typeof MODELS)[number]) {
    Haptics.selectionAsync();
    onSelect(model.id, model.provider);
    setVisible(false);
  }

  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setVisible(true);
        }}
        style={[styles.trigger, { backgroundColor: colors.bgSunken, borderColor: colors.surfaceBorder + "20" }]}
      >
        <Text style={[styles.triggerText, { color: colors.textSecondary }]}>
          {t("modelPicker.change")}
        </Text>
        <Text style={[styles.currentModel, { color: colors.textPrimary }]}>
          {current?.label ?? currentModel}
        </Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              {t("modelPicker.title")}
            </Text>
            {MODELS.map((model) => (
              <Pressable
                key={model.id}
                style={[
                  styles.option,
                  {
                    backgroundColor:
                      model.id === currentModel ? colors.accent + "15" : "transparent",
                    borderColor:
                      model.id === currentModel ? colors.accent : colors.surfaceBorder + "10",
                  },
                ]}
                onPress={() => handleSelect(model)}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      color:
                        model.id === currentModel ? colors.accent : colors.textPrimary,
                    },
                  ]}
                >
                  {model.label}
                </Text>
                <Text style={[styles.optionProvider, { color: colors.textMuted }]}>
                  {model.provider}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  triggerText: {
    fontSize: TYPOGRAPHY.sm,
  },
  currentModel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  sheetTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  optionLabel: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  optionProvider: {
    fontSize: TYPOGRAPHY.xs,
    textTransform: "capitalize",
  },
});
