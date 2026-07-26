import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../src/theme/tokens";
import { t } from "../../src/i18n";

interface WorkspaceInfo {
  titleKey: string;
  descriptionKey: string;
  icon: string;
  featureKeys: string[];
}

const WORKSPACES: Record<string, WorkspaceInfo> = {
  developer: {
    titleKey: "workspace.developer.title",
    descriptionKey: "workspace.developer.description",
    icon: "💻",
    featureKeys: [
      "workspace.developer.feature.editor",
      "workspace.developer.feature.terminal",
      "workspace.developer.feature.debugging",
    ],
  },
  designer: {
    titleKey: "workspace.designer.title",
    descriptionKey: "workspace.designer.description",
    icon: "🎨",
    featureKeys: [
      "workspace.designer.feature.generate",
      "workspace.designer.feature.edit",
      "workspace.designer.feature.palette",
      "workspace.designer.feature.export",
    ],
  },
  creator: {
    titleKey: "workspace.creator.title",
    descriptionKey: "workspace.creator.description",
    icon: "🎬",
    featureKeys: [
      "workspace.creator.feature.videoEdit",
      "workspace.creator.feature.audio",
      "workspace.creator.feature.render",
    ],
  },
  health: {
    titleKey: "workspace.health.title",
    descriptionKey: "workspace.health.description",
    icon: "❤️",
    featureKeys: [
      "workspace.health.feature.goals",
      "workspace.health.feature.exercises",
      "workspace.health.feature.sleep",
      "workspace.health.feature.nutrition",
    ],
  },
  finance: {
    titleKey: "workspace.finance.title",
    descriptionKey: "workspace.finance.description",
    icon: "💰",
    featureKeys: [
      "workspace.finance.feature.transactions",
      "workspace.finance.feature.budget",
      "workspace.finance.feature.investments",
      "workspace.finance.feature.reports",
    ],
  },
  teacher: {
    titleKey: "workspace.teacher.title",
    descriptionKey: "workspace.teacher.description",
    icon: "📚",
    featureKeys: [
      "workspace.teacher.feature.whiteboard",
      "workspace.teacher.feature.flashcards",
      "workspace.teacher.feature.summaries",
      "workspace.teacher.feature.quiz",
    ],
  },
  marketing: {
    titleKey: "workspace.marketing.title",
    descriptionKey: "workspace.marketing.description",
    icon: "📢",
    featureKeys: [
      "workspace.marketing.feature.copywriting",
      "workspace.marketing.feature.analytics",
      "workspace.marketing.feature.campaigns",
    ],
  },
  automation: {
    titleKey: "workspace.automation.title",
    descriptionKey: "workspace.automation.description",
    icon: "⚡",
    featureKeys: [
      "workspace.automation.feature.monitoring",
    ],
  },
};

export default function WorkspaceScreen() {
  const { colors } = useTheme();
  const { headerPadding } = useSafeArea();
  const { workspaceId } = useLocalSearchParams<{ workspaceId: string }>();
  const router = useRouter();

  const info = WORKSPACES[workspaceId || ""];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgBase }]} contentContainerStyle={styles.content}>
      <View style={[styles.header, headerPadding]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Text style={[styles.closeButton, { color: colors.textMuted }]}>
            ✕ {t("workspace.close")}
          </Text>
        </Pressable>
      </View>

      {info ? (
        <View style={styles.center}>
          <Text style={styles.icon}>{info.icon}</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t(info.titleKey)}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{t(info.descriptionKey)}</Text>

          {info.featureKeys.length > 0 && (
            <View style={[styles.featuresCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "14" }]}>
              <Text style={[styles.featuresTitle, { color: colors.textSecondary }]}>{t("workspace.features")}</Text>
              {info.featureKeys.map((key, i) => (
                <View key={i} style={[styles.featureRow, i < info.featureKeys.length - 1 && { borderBottomColor: colors.surfaceBorder + "14", borderBottomWidth: 1 }]}>
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>{t(key)}</Text>
                  <Text style={[styles.featureStatus, { color: colors.warning }]}>{t("workspace.comingSoon")}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.icon}>🔧</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{workspaceId}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: SPACING.xl,
  },
  header: {
    alignItems: "flex-end",
    marginBottom: SPACING.xl,
  },
  closeButton: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
    padding: SPACING.sm,
  },
  center: {
    alignItems: "center",
    gap: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  description: {
    fontSize: TYPOGRAPHY.md,
    textAlign: "center",
  },
  featuresCard: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    width: "100%",
    gap: SPACING.sm,
  },
  featuresTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
  },
  featureText: {
    fontSize: TYPOGRAPHY.md,
  },
  featureStatus: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});
