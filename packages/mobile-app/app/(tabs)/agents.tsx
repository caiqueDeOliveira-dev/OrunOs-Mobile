import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { NEON, SPACING, TYPOGRAPHY, FONT_WEIGHT } from "../../src/theme/tokens";
import { supabase } from "../../src/services/supabaseClient";
import { AgentCard } from "../../src/components/agents";
import { EmptyState, Loader, NeonBackground } from "../../src/components/ui";
import { t } from "../../src/i18n";
import type { OrunAgent } from "../../src/types";

export default function AgentsScreen() {
  const { colors } = useTheme();
  const { headerPadding } = useSafeArea();
  const router = useRouter();
  const [agents, setAgents] = useState<OrunAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadAgents() {
    try {
      setLoadError(null);
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, role, is_core")
        .order("name", { ascending: true });

      if (error) {
        setLoadError(error.message);
        return;
      }

      if (data) {
        setAgents(
          data.map((a) => ({
            id: a.id,
            name: a.name,
            role: a.role || "",
            status: "online" as const,
            isCore: a.is_core ?? false,
          }))
        );
      }
    } catch (err) {
      setLoadError((err as Error).message);
    }
  }

  useEffect(() => {
    loadAgents().finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAgents();
    setRefreshing(false);
  }

  function handleAgentPress(agent: OrunAgent) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chat/${agent.id}`);
  }

  if (loading) {
    return (
      <NeonBackground>
        <View style={[styles.center, {}]}>
          <Loader />
        </View>
      </NeonBackground>
    );
  }

  return (
    <NeonBackground style={styles.container}>
      <View
        style={[
          styles.header,
          headerPadding,
          {
            backgroundColor: "rgba(10,4,20,0.55)",
            borderBottomColor: NEON.glow.red + "40",
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t("agents.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {t("agents.countAvailable", { count: String(agents.length) })}
        </Text>
      </View>

      <FlatList
        data={agents}
        keyExtractor={(a) => a.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accentGlow} />
        }
        ListEmptyComponent={
          loadError ? (
            <EmptyState title={t("common.error")} message={loadError} actionLabel={t("common.retry")} onAction={loadAgents} />
          ) : (
            <EmptyState title={t("agents.empty")} />
          )
        }
        renderItem={({ item }) => <AgentCard agent={item} onPress={handleAgentPress} />}
      />
    </NeonBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: SPACING.xs,
  },
  grid: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  row: {
    gap: SPACING.md,
  },
});
