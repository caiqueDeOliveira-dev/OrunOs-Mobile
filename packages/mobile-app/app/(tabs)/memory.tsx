import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { NEON, SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../src/theme/tokens";
import { loadRecentConversations, type ConversationSummary } from "../../src/services/memoryService";
import { EmptyState, Loader, NeonBackground } from "../../src/components/ui";
import { t } from "../../src/i18n";
import { timeAgo } from "../../src/utils";

export default function MemoryScreen() {
  const { colors } = useTheme();
  const { headerPadding } = useSafeArea();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    return loadRecentConversations()
      .then((data) => {
        setConversations(data);
        setLoadError(null);
      })
      .catch((err) => setLoadError((err as Error).message));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t("memory.title")}</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accentGlow} />
        }
        ListHeaderComponent={
          loadError && conversations.length > 0 ? (
            <Text style={[styles.warning, { color: colors.warning }]}>
              {t("memory.stale", { error: loadError })}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          loadError && conversations.length === 0 ? (
            <EmptyState
              title={t("memory.error")}
              message={loadError}
              actionLabel={t("memory.retry")}
              onAction={() => {
                setLoading(true);
                load().finally(() => setLoading(false));
              }}
            />
          ) : (
            <EmptyState title={t("memory.empty")} />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.card,
              {
                backgroundColor: "rgba(15,7,24,0.55)",
                borderColor: NEON.glow.red + "30",
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/chat/${item.agent_id || "hampton"}`);
            }}
          >
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.cardTime, { color: colors.textMuted }]}>
                {timeAgo(item.updated_at)}
              </Text>
            </View>
          </Pressable>
        )}
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
  list: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: FONT_WEIGHT.medium,
    flex: 1,
    marginRight: SPACING.sm,
  },
  cardTime: {
    fontSize: TYPOGRAPHY.xs,
  },
  warning: {
    fontSize: TYPOGRAPHY.xs,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
});
