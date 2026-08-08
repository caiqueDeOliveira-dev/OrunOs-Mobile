import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { NEON, SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../src/theme/tokens";
import { t } from "../../src/i18n";
import { supabase } from "../../src/services/supabaseClient";
import { getUserId } from "../../src/stores/authStore";
import { NeonBackground } from "../../src/components/ui";

interface HealthEntry {
  id: string;
  kind: string;
  description: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  exercise_name: string | null;
  duration_min: number | null;
  calories_burned: number | null;
  metric: string | null;
  value: number | null;
  unit: string | null;
  date: string;
}

interface HealthSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  workoutMinutes: number;
  caloriesBurned: number;
  metrics: Array<{ metric: string; value: number; unit: string }>;
  entries: HealthEntry[];
}

export default function HealthWorkspace() {
  const { colors } = useTheme();
  const { headerPadding } = useSafeArea();
  const router = useRouter();
  const { workspaceId } = useLocalSearchParams<{ workspaceId: string }>();
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHealthData = useCallback(async () => {
    try {
      const userId = getUserId();
      const today = new Date().toISOString().split("T")[0];

      const { data } = await supabase
        .from("health_log")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      const entries = (data ?? []) as HealthEntry[];
      const meals = entries.filter((e) => e.kind === "meal");
      const workouts = entries.filter((e) => e.kind === "workout");
      const metrics = entries.filter((e) => e.kind === "metric");

      setSummary({
        totalCalories: meals.reduce((s, m) => s + (m.calories ?? 0), 0),
        totalProtein: meals.reduce((s, m) => s + (m.protein_g ?? 0), 0),
        totalCarbs: meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0),
        totalFat: meals.reduce((s, m) => s + (m.fat_g ?? 0), 0),
        workoutMinutes: workouts.reduce((s, w) => s + (w.duration_min ?? 0), 0),
        caloriesBurned: workouts.reduce((s, w) => s + (w.calories_burned ?? 0), 0),
        metrics: metrics.map((m) => ({ metric: m.metric ?? "", value: m.value ?? 0, unit: m.unit ?? "" })),
        entries,
      });
    } catch {
      // silently fail — data loads on next refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadHealthData(); }, [loadHealthData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHealthData();
  }, [loadHealthData]);

  const statCard = (label: string, value: string, unit: string, color: string) => (
    <View style={[styles.statCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statUnit, { color: colors.textMuted }]}>{unit}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );

  return (
    <NeonBackground style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentGlow} />}
      >
        <View
          style={[
            styles.header,
            headerPadding,
            { backgroundColor: "rgba(10,4,20,0.55)", borderBottomColor: NEON.glow.red + "40" },
          ]}
        >
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
            <Text style={[styles.closeButton, { color: colors.textMuted }]}>✕ {t("workspace.close")}</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>❤️ {t("workspace.health.title")}</Text>
        </View>

        {summary && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HOJE</Text>
            <View style={styles.statsGrid}>
              {statCard("Calorias", String(summary.totalCalories), "kcal", colors.accentGlow)}
              {statCard("Proteina", summary.totalProtein.toFixed(1), "g", "#4CAF50")}
              {statCard("Carboidratos", summary.totalCarbs.toFixed(1), "g", "#FF9800")}
              {statCard("Gordura", summary.totalFat.toFixed(1), "g", "#F44336")}
            </View>

            <View style={styles.statsGrid}>
              {statCard("Treino", String(summary.workoutMinutes), "min", "#2196F3")}
              {statCard("Queimado", String(summary.caloriesBurned), "kcal", "#9C27B0")}
            </View>

            {summary.metrics.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>METRICAS</Text>
                {summary.metrics.map((m, i) => (
                  <View key={i} style={[styles.metricRow, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
                    <Text style={[styles.metricName, { color: colors.textPrimary }]}>{m.metric}</Text>
                    <Text style={[styles.metricValue, { color: colors.accentGlow }]}>{m.value} {m.unit}</Text>
                  </View>
                ))}
              </>
            )}

            {summary.entries.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>REGISTROS</Text>
                {summary.entries.slice(0, 10).map((entry) => (
                  <View key={entry.id} style={[styles.entryRow, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
                    <Text style={[styles.entryKind, { color: colors.accentGlow }]}>
                      {entry.kind === "meal" ? "🍽️" : entry.kind === "workout" ? "🏋️" : "📊"}
                    </Text>
                    <View style={styles.entryInfo}>
                      <Text style={[styles.entryTitle, { color: colors.textPrimary }]}>
                        {entry.description ?? entry.exercise_name ?? entry.metric}
                      </Text>
                      <Text style={[styles.entrySubtitle, { color: colors.textMuted }]}>
                        {entry.kind === "meal" && `${entry.calories ?? 0} kcal`}
                        {entry.kind === "workout" && `${entry.duration_min ?? 0} min`}
                        {entry.kind === "metric" && `${entry.value ?? 0} ${entry.unit}`}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {summary.entries.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
                <Text style={[styles.emptyIcon, { color: colors.textMuted }]}>❤️</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nenhum registro hoje</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Peca ao Hampton para registrar uma refeicao, treino ou metrica
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </NeonBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.xl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: SPACING.lg, borderBottomWidth: 1, marginBottom: SPACING.xl },
  closeButton: { fontSize: TYPOGRAPHY.sm, fontWeight: FONT_WEIGHT.medium, padding: SPACING.sm },
  headerTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: FONT_WEIGHT.bold },
  sectionTitle: { fontSize: TYPOGRAPHY.sm, fontWeight: FONT_WEIGHT.medium, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: SPACING.md, marginTop: SPACING.lg },
  statsGrid: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.md },
  statCard: { flex: 1, padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: "center" },
  statValue: { fontSize: TYPOGRAPHY.xxl, fontWeight: FONT_WEIGHT.bold },
  statUnit: { fontSize: TYPOGRAPHY.xs, marginTop: -2 },
  statLabel: { fontSize: TYPOGRAPHY.sm, marginTop: SPACING.xs },
  metricRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm },
  metricName: { fontSize: TYPOGRAPHY.md, fontWeight: FONT_WEIGHT.medium },
  metricValue: { fontSize: TYPOGRAPHY.md, fontWeight: FONT_WEIGHT.bold },
  entryRow: { flexDirection: "row", alignItems: "center", padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm, gap: SPACING.md },
  entryKind: { fontSize: 24 },
  entryInfo: { flex: 1 },
  entryTitle: { fontSize: TYPOGRAPHY.md, fontWeight: FONT_WEIGHT.medium },
  entrySubtitle: { fontSize: TYPOGRAPHY.sm },
  emptyState: { padding: SPACING.xxl, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: "center", gap: SPACING.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: FONT_WEIGHT.bold },
  emptySubtitle: { fontSize: TYPOGRAPHY.md, textAlign: "center" },
});
