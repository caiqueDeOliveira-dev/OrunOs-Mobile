import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../src/theme/tokens";
import { checkProviders, type ProviderInfo } from "../../src/services/providerService";
import { t } from "../../src/i18n";

export default function ProvidersScreen() {
  const { colors } = useTheme();
  const { headerPadding } = useSafeArea();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProviders() {
    try {
      setError(null);
      const data = await checkProviders();
      setProviders(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadProviders();
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadProviders();
  }

  const configuredCount = providers.filter((p) => p.configured).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgBase }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
    >
      <View style={headerPadding}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t("providers.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {t("providers.configured", { count: String(configuredCount), total: String(providers.length) })}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.danger + "15", borderColor: colors.danger + "30" }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <Pressable onPress={loadProviders} accessibilityRole="button" accessibilityLabel={t("common.retry")}>
            <Text style={[styles.retryText, { color: colors.accent }]}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {providers.map((provider) => (
            <View
              key={provider.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "14" }]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons
                    name={provider.configured ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={provider.configured ? "#22C55E" : colors.textMuted}
                  />
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{provider.name}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: provider.configured ? "#22C55E" + "20" : colors.surfaceHover,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: provider.configured ? "#22C55E" : colors.textMuted },
                    ]}
                  >
                    {provider.configured ? t("providers.active") : t("providers.notConfigured")}
                  </Text>
                </View>
              </View>

              <Text style={[styles.envKey, { color: colors.textMuted }]}>
                {t("providers.envKey")}: {provider.envKey}
              </Text>

              <View style={styles.modelsRow}>
                <Text style={[styles.modelsLabel, { color: colors.textMuted }]}>{t("providers.models")}:</Text>
                <Text style={[styles.modelsList, { color: colors.textSecondary }]}>
                  {provider.models.slice(0, 3).join(", ")}
                  {provider.models.length > 3 ? ` +${provider.models.length - 3}` : ""}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.helpBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "14" }]}>
        <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
        <View style={styles.helpContent}>
          <Text style={[styles.helpTitle, { color: colors.textPrimary }]}>{t("providers.helpTitle")}</Text>
          <Text style={[styles.helpText, { color: colors.textMuted }]}>
            {t("providers.helpBody")}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: SPACING.xl,
    paddingTop: 0,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  center: {
    paddingVertical: SPACING.xxl * 2,
    alignItems: "center",
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: FONT_WEIGHT.bold,
    paddingBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    paddingBottom: SPACING.lg,
  },
  list: {
    gap: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  envKey: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: "monospace",
  },
  modelsRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    flexWrap: "wrap",
  },
  modelsLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  modelsList: {
    fontSize: TYPOGRAPHY.xs,
    flex: 1,
  },
  errorBox: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sm,
    textAlign: "center",
  },
  retryText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  helpBox: {
    flexDirection: "row",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  helpContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  helpTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  helpText: {
    fontSize: TYPOGRAPHY.xs,
    lineHeight: 18,
  },
});
