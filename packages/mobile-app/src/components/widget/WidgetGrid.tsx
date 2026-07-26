import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeProvider";
import { t } from "../../i18n";

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress?: () => void;
}

function QuickAction({ icon, label, description, onPress }: QuickActionProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.action, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={colors.accent} />
      <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>{label}</Text>
      <Text style={[styles.actionDesc, { color: colors.textMuted }]}>{description}</Text>
    </Pressable>
  );
}

interface WidgetGridProps {
  automations?: Array<{
    id: string;
    name: string;
    enabled: boolean;
  }>;
}

export function WidgetGrid({ automations = [] }: WidgetGridProps) {
  const { colors } = useTheme();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("home.suggestion.chat")}</Text>
      <View style={styles.grid}>
        <QuickAction icon="chatbubble" label={t("tab.chat")} description={t("home.chat")} />
        <QuickAction icon="mic" label={t("tab.voice")} description={t("voice.tapToRecord")} />
        <QuickAction icon="camera" label={t("camera.title")} description={t("camera.send")} />
        <QuickAction icon="flash" label={t("automations.title")} description={t("automations.empty")} />
      </View>

      {automations.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>
            {t("automations.title")}
          </Text>
          {automations.map((auto) => (
            <View
              key={auto.id}
              style={[styles.autoItem, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            >
              <Ionicons
                name={auto.enabled ? "checkmark-circle" : "pause-circle"}
                size={20}
                color={auto.enabled ? colors.success : colors.warning}
              />
              <Text style={[styles.autoName, { color: colors.textPrimary }]}>{auto.name}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  action: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  actionDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  autoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  autoName: {
    fontSize: 14,
    fontWeight: "500",
  },
});
