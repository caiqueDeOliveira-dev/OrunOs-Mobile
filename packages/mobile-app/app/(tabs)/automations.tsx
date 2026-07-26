import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Switch, RefreshControl, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../src/theme/tokens";
import { loadAutomations, setAutomationEnabled, type Automation } from "../../src/services/automationsService";
import { EmptyState, Loader } from "../../src/components/ui";
import { t } from "../../src/i18n";

const KIND_LABEL: Record<string, string> = {
  n8n_webhook: "n8n",
  whatsapp: "WhatsApp",
  cron: "Agendado",
};

export default function AutomationsScreen() {
  const { colors } = useTheme();
  const { headerPadding } = useSafeArea();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      setAutomations(await loadAutomations());
      setLoadError(null);
    } catch (err) {
      setLoadError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleToggle(id: string, next: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: next } : a)));
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await setAutomationEnabled(id, next);
    } catch (err) {
      setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !next } : a)));
    } finally {
      setPendingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgBase }]}>
        <Loader />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <View style={[styles.header, headerPadding]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t("automations.title")}</Text>
      </View>

      <FlatList
        data={automations}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          loadError && automations.length > 0 ? (
            <Text style={[styles.warning, { color: colors.warning }]}>
              {t("memory.stale", { error: loadError ?? "" })}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          loadError && automations.length === 0 ? (
            <EmptyState
              title={t("automations.error")}
              message={loadError}
              actionLabel={t("common.retry")}
              onAction={() => {
                setLoading(true);
                load().finally(() => setLoading(false));
              }}
            />
          ) : (
            <EmptyState title={t("automations.empty")} />
          )
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder + "14",
              },
            ]}
          >
            <View style={styles.cardInfo}>
              <Text style={[styles.cardName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.cardKind, { color: colors.textMuted }]}>
                {KIND_LABEL[item.kind] ?? item.kind}
              </Text>
            </View>
            <Switch
              value={item.enabled}
              onValueChange={(next) => handleToggle(item.id, next)}
              disabled={pendingIds.has(item.id)}
              trackColor={{ false: colors.surfaceActive, true: colors.accent }}
              thumbColor={colors.textPrimary}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  list: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  cardKind: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: 2,
  },
  warning: {
    fontSize: TYPOGRAPHY.xs,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
});
