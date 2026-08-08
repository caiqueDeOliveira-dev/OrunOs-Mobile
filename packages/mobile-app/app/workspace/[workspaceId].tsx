import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { NEON, SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../src/theme/tokens";
import { t } from "../../src/i18n";
import { supabase } from "../../src/services/supabaseClient";
import { getUserId } from "../../src/stores/authStore";
import { NeonBackground } from "../../src/components/ui";

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
    featureKeys: ["workspace.developer.feature.editor", "workspace.developer.feature.terminal", "workspace.developer.feature.debugging"],
  },
  designer: {
    titleKey: "workspace.designer.title",
    descriptionKey: "workspace.designer.description",
    icon: "🎨",
    featureKeys: ["workspace.designer.feature.generate", "workspace.designer.feature.edit", "workspace.designer.feature.palette", "workspace.designer.feature.export"],
  },
  creator: {
    titleKey: "workspace.creator.title",
    descriptionKey: "workspace.creator.description",
    icon: "🎬",
    featureKeys: ["workspace.creator.feature.videoEdit", "workspace.creator.feature.audio", "workspace.creator.feature.render"],
  },
  health: {
    titleKey: "workspace.health.title",
    descriptionKey: "workspace.health.description",
    icon: "❤️",
    featureKeys: ["workspace.health.feature.goals", "workspace.health.feature.exercises", "workspace.health.feature.sleep", "workspace.health.feature.nutrition"],
  },
  finance: {
    titleKey: "workspace.finance.title",
    descriptionKey: "workspace.finance.description",
    icon: "💰",
    featureKeys: ["workspace.finance.feature.transactions", "workspace.finance.feature.budget", "workspace.finance.feature.investments", "workspace.finance.feature.reports"],
  },
  teacher: {
    titleKey: "workspace.teacher.title",
    descriptionKey: "workspace.teacher.description",
    icon: "📚",
    featureKeys: ["workspace.teacher.feature.whiteboard", "workspace.teacher.feature.flashcards", "workspace.teacher.feature.summaries", "workspace.teacher.feature.quiz"],
  },
  marketing: {
    titleKey: "workspace.marketing.title",
    descriptionKey: "workspace.marketing.description",
    icon: "📢",
    featureKeys: ["workspace.marketing.feature.copywriting", "workspace.marketing.feature.analytics", "workspace.marketing.feature.campaigns"],
  },
  automation: {
    titleKey: "workspace.automation.title",
    descriptionKey: "workspace.automation.description",
    icon: "⚡",
    featureKeys: ["workspace.automation.feature.monitoring", "workspace.automation.feature.whatsapp", "workspace.automation.feature.telegram", "workspace.automation.feature.scheduler"],
  },
};

// ─── Health Summary Component ──────────────────────────────────────

function HealthDashboard() {
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const userId = getUserId();
      const today = new Date().toISOString().split("T")[0];
      const { data: rows } = await supabase
        .from("health_log").select("*")
        .eq("user_id", userId).eq("date", today).is("deleted_at", null)
        .order("created_at", { ascending: false });

      const entries = rows ?? [];
      const meals = entries.filter((e: any) => e.kind === "meal");
      const workouts = entries.filter((e: any) => e.kind === "workout");
      const metrics = entries.filter((e: any) => e.kind === "metric");

      setData({
        calories: meals.reduce((s: number, m: any) => s + (m.calories ?? 0), 0),
        protein: meals.reduce((s: number, m: any) => s + (m.protein_g ?? 0), 0),
        workoutMin: workouts.reduce((s: number, w: any) => s + (w.duration_min ?? 0), 0),
        burned: workouts.reduce((s: number, w: any) => s + (w.calories_burned ?? 0), 0),
        metrics: metrics.map((m: any) => `${m.metric}: ${m.value} ${m.unit}`),
        meals: meals.length,
        workoutCount: workouts.length,
      });
    } catch { /* */ }
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stat = (label: string, value: string, color: string) => (
    <View style={[s.statCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={[s.statLbl, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );

  return (
    <View>
      <Text style={[s.section, { color: colors.textSecondary }]}>RESUMO DO DIA</Text>
      <View style={s.statsRow}>
        {stat("Calorias", `${data?.calories ?? 0}`, colors.accent)}
        {stat("Proteina", `${data?.protein?.toFixed(1) ?? 0}g`, "#4CAF50")}
        {stat("Treino", `${data?.workoutMin ?? 0}min`, "#2196F3")}
        {stat("Queimado", `${data?.burned ?? 0}`, "#9C27B0")}
      </View>
      {data?.metrics?.length > 0 && (
        <View style={[s.card, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
          <Text style={[s.cardTitle, { color: colors.textSecondary }]}>Metricas</Text>
          {data.metrics.map((m: string, i: number) => (
            <Text key={i} style={[s.cardText, { color: colors.textPrimary }]}>{m}</Text>
          ))}
        </View>
      )}
      {(!data || (data.calories === 0 && data.workoutMin === 0)) && (
        <View style={[s.emptyCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>Peca ao Hampton para registrar refeicoes ou treinos</Text>
        </View>
      )}
    </View>
  );
}

// ─── Finance Summary Component ─────────────────────────────────────

function FinanceDashboard() {
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const userId = getUserId();
      const today = new Date().toISOString().split("T")[0];
      const { data: rows } = await supabase
        .from("finance_log").select("*")
        .eq("user_id", userId).eq("date", today).is("deleted_at", null)
        .order("created_at", { ascending: false });

      const entries = rows ?? [];
      const income = entries.filter((e: any) => e.type === "income").reduce((s: number, e: any) => s + e.amount, 0);
      const expenses = entries.filter((e: any) => e.type === "expense").reduce((s: number, e: any) => s + e.amount, 0);

      setData({ income, expenses, balance: income - expenses, entries: entries.slice(0, 10) });
    } catch { /* */ }
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stat = (label: string, value: string, color: string) => (
    <View style={[s.statCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={[s.statLbl, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );

  return (
    <View>
      <Text style={[s.section, { color: colors.textSecondary }]}>HOJE</Text>
      <View style={s.statsRow}>
        {stat("Receitas", `R$ ${data?.income?.toFixed(2) ?? "0,00"}`, "#4CAF50")}
        {stat("Despesas", `R$ ${data?.expenses?.toFixed(2) ?? "0,00"}`, "#F44336")}
        {stat("Saldo", `R$ ${data?.balance?.toFixed(2) ?? "0,00"}`, data?.balance >= 0 ? "#4CAF50" : "#F44336")}
      </View>
      {data?.entries?.length > 0 && (
        <View style={[s.card, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
          <Text style={[s.cardTitle, { color: colors.textSecondary }]}>Transacoes</Text>
          {data.entries.map((e: any, i: number) => (
            <View key={i} style={[s.txRow, i < data.entries.length - 1 && { borderBottomColor: NEON.glow.red + "30", borderBottomWidth: 1 }]}>
              <Text style={[s.txDesc, { color: colors.textPrimary }]}>{e.description}</Text>
              <Text style={[s.txAmount, { color: e.type === "income" ? "#4CAF50" : "#F44336" }]}>
                {e.type === "income" ? "+" : "-"} R$ {e.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}
      {(!data || data.entries.length === 0) && (
        <View style={[s.emptyCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>Peca ao Hampton para registrar transacoes</Text>
        </View>
      )}
    </View>
  );
}

// ─── Marketing Summary Component ───────────────────────────────────

function MarketingDashboard() {
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const userId = getUserId();
      const { data: rows } = await supabase
        .from("marketing_log").select("*")
        .eq("user_id", userId).is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10);
      setData({ entries: rows ?? [] });
    } catch { /* */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View>
      <Text style={[s.section, { color: colors.textSecondary }]}>CAMPANHAS</Text>
      {data?.entries?.length > 0 ? (
        data.entries.map((e: any, i: number) => (
          <View key={i} style={[s.card, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{e.campaign_name ?? "Campanha"}</Text>
            <Text style={[s.cardText, { color: colors.textSecondary }]}>{e.objective ?? ""}</Text>
            <Text style={[s.cardStatus, { color: e.status === "published" ? "#4CAF50" : colors.warning }]}>{e.status}</Text>
          </View>
        ))
      ) : (
        <View style={[s.emptyCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>Peca ao Marketing para criar campanhas</Text>
        </View>
      )}
    </View>
  );
}

// ─── Developer Dashboard ───────────────────────────────────────────

function DeveloperDashboard() {
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const userId = getUserId();
      const { data: rows } = await supabase
        .from("developer_reviews").select("*")
        .eq("user_id", userId).is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10);
      setData({ entries: rows ?? [] });
    } catch { /* */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sevColor = (sev: string) => {
    if (sev === "critical") return "#F44336";
    if (sev === "high") return "#FF9800";
    if (sev === "medium") return "#FFC107";
    return "#4CAF50";
  };

  return (
    <View>
      <Text style={[s.section, { color: colors.textSecondary }]}>ANALISES DE CODIGO</Text>
      {data?.entries?.length > 0 ? (
        data.entries.map((e: any, i: number) => (
          <View key={i} style={[s.card, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{e.repo ?? e.file_path ?? "Analise"}</Text>
              {e.severity && <Text style={[s.cardStatus, { color: sevColor(e.severity) }]}>{e.severity}</Text>}
            </View>
            <Text style={[s.cardText, { color: colors.textSecondary }]} numberOfLines={2}>{e.summary}</Text>
            {e.issues_found > 0 && (
              <Text style={[s.cardText, { color: "#FF9800" }]}>{e.issues_found} problema(s) encontrado(s)</Text>
            )}
          </View>
        ))
      ) : (
        <View style={[s.emptyCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>Peca ao Developer para analisar codigo</Text>
        </View>
      )}
    </View>
  );
}

// ─── Designer Dashboard ────────────────────────────────────────────

function DesignerDashboard() {
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const userId = getUserId();
      const { data: rows } = await supabase
        .from("image3d_generations").select("*")
        .eq("user_id", userId).is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10);
      setData({ entries: rows ?? [] });
    } catch { /* */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View>
      <Text style={[s.section, { color: colors.textSecondary }]}>IMAGENS GERADAS</Text>
      {data?.entries?.length > 0 ? (
        data.entries.map((e: any, i: number) => (
          <View key={i} style={[s.card, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{e.engine} / {e.model_used ?? "—"}</Text>
            <Text style={[s.cardText, { color: colors.textSecondary }]} numberOfLines={2}>{e.prompt}</Text>
            {e.output_url && (
              <Text style={[s.cardText, { color: colors.accent }]}>Ver imagem</Text>
            )}
          </View>
        ))
      ) : (
        <View style={[s.emptyCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>Peca ao Designer para gerar imagens</Text>
        </View>
      )}
    </View>
  );
}

// ─── Creator Dashboard ─────────────────────────────────────────────

function CreatorDashboard() {
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const userId = getUserId();
      const { data: rows } = await supabase
        .from("video_projects").select("*")
        .eq("user_id", userId).is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10);
      setData({ entries: rows ?? [] });
    } catch { /* */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusColor = (st: string) => {
    if (st === "done") return "#4CAF50";
    if (st === "rendering") return "#FF9800";
    return colors.textMuted;
  };

  return (
    <View>
      <Text style={[s.section, { color: colors.textSecondary }]}>PROJETOS DE VIDEO</Text>
      {data?.entries?.length > 0 ? (
        data.entries.map((e: any, i: number) => (
          <View key={i} style={[s.card, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{e.title}</Text>
              <Text style={[s.cardStatus, { color: statusColor(e.status) }]}>{e.status}</Text>
            </View>
            {e.duration_sec && (
              <Text style={[s.cardText, { color: colors.textSecondary }]}>{Math.round(e.duration_sec)}s</Text>
            )}
          </View>
        ))
      ) : (
        <View style={[s.emptyCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>Peca ao Creator para criar videos</Text>
        </View>
      )}
    </View>
  );
}

// ─── Teacher Dashboard ─────────────────────────────────────────────

function TeacherDashboard() {
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const userId = getUserId();
      const { data: rows } = await supabase
        .from("teacher_progress").select("*")
        .eq("user_id", userId).is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10);
      setData({ entries: rows ?? [] });
    } catch { /* */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusColor = (st: string) => {
    if (st === "mastered") return "#4CAF50";
    if (st === "reviewing") return "#FF9800";
    return colors.textMuted;
  };

  return (
    <View>
      <Text style={[s.section, { color: colors.textSecondary }]}>PROGRESSO</Text>
      {data?.entries?.length > 0 ? (
        data.entries.map((e: any, i: number) => (
          <View key={i} style={[s.card, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{e.subject}</Text>
              {e.status && <Text style={[s.cardStatus, { color: statusColor(e.status) }]}>{e.status}</Text>}
            </View>
            {e.topic && <Text style={[s.cardText, { color: colors.textSecondary }]}>{e.topic}</Text>}
            {e.score != null && <Text style={[s.cardText, { color: colors.accent }]}>Nota: {e.score}</Text>}
          </View>
        ))
      ) : (
        <View style={[s.emptyCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>Peca ao Teacher para criar quizzes</Text>
        </View>
      )}
    </View>
  );
}

// ─── Automation Dashboard ──────────────────────────────────────────

function AutomationDashboard() {
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const userId = getUserId();
      const { data: automations } = await supabase
        .from("automations").select("*")
        .eq("user_id", userId).is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
      const { data: jobs } = await supabase
        .from("scheduled_jobs").select("*")
        .eq("user_id", userId).is("deleted_at", null);
      setData({ automations: automations ?? [], jobs: jobs ?? [] });
    } catch { /* */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View>
      <Text style={[s.section, { color: colors.textSecondary }]}>AUTOMACOES</Text>
      {data?.automations?.length > 0 ? (
        data.automations.map((a: any, i: number) => (
          <View key={i} style={[s.card, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{a.name ?? "Automacao"}</Text>
              <Text style={[s.cardStatus, { color: a.enabled ? "#4CAF50" : colors.textMuted }]}>{a.enabled ? "Ativa" : "Inativa"}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={[s.emptyCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>Nenhuma automacao configurada</Text>
        </View>
      )}

      <Text style={[s.section, { color: colors.textSecondary }]}>JOBS AGENDADOS</Text>
      {data?.jobs?.length > 0 ? (
        data.jobs.map((j: any, i: number) => (
          <View key={i} style={[s.card, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{j.name}</Text>
            <Text style={[s.cardText, { color: colors.textSecondary }]}>{j.agent_id} — {j.cron_expression}</Text>
          </View>
        ))
      ) : (
        <View style={[s.emptyCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>Nenhum job agendado</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Workspace Screen ─────────────────────────────────────────

export default function WorkspaceScreen() {
  const { colors } = useTheme();
  const { headerPadding } = useSafeArea();
  const { workspaceId } = useLocalSearchParams<{ workspaceId: string }>();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const info = WORKSPACES[workspaceId || ""];

  const renderDashboard = () => {
    switch (workspaceId) {
      case "health": return <HealthDashboard />;
      case "finance": return <FinanceDashboard />;
      case "marketing": return <MarketingDashboard />;
      case "developer": return <DeveloperDashboard />;
      case "designer": return <DesignerDashboard />;
      case "creator": return <CreatorDashboard />;
      case "teacher": return <TeacherDashboard />;
      case "automation": return <AutomationDashboard />;
      default: return null;
    }
  };

  const hasDashboard = ["health", "finance", "marketing", "developer", "designer", "creator", "teacher", "automation"].includes(workspaceId || "");

  return (
    <NeonBackground style={s.container}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={hasDashboard ? <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={colors.accentGlow} /> : undefined}
      >
        <View
          style={[
            s.header,
            headerPadding,
            { backgroundColor: "rgba(10,4,20,0.55)", borderBottomColor: NEON.glow.red + "40" },
          ]}
        >
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
            <Text style={[s.closeButton, { color: colors.textMuted }]}>✕ {t("workspace.close")}</Text>
          </Pressable>
        </View>

        {info ? (
          <View>
            <View style={s.titleRow}>
              <Text style={s.titleIcon}>{info.icon}</Text>
              <View>
                <Text style={[s.title, { color: colors.textPrimary }]}>{t(info.titleKey)}</Text>
                <Text style={[s.description, { color: colors.textSecondary }]}>{t(info.descriptionKey)}</Text>
              </View>
            </View>

            {renderDashboard()}

            {info.featureKeys.length > 0 && (
              <View style={[s.featuresCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
                <Text style={[s.featuresTitle, { color: colors.textSecondary }]}>{t("workspace.features")}</Text>
                {info.featureKeys.map((key, i) => (
                  <View key={i} style={[s.featureRow, i < info.featureKeys.length - 1 && { borderBottomColor: NEON.glow.red + "30", borderBottomWidth: 1 }]}>
                    <Text style={[s.featureText, { color: colors.textPrimary }]}>{t(key)}</Text>
                    <Text style={[s.featureStatus, { color: hasDashboard ? "#4CAF50" : colors.warning }]}>
                      {hasDashboard ? "Ativo" : t("workspace.comingSoon")}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={s.center}>
            <Text style={s.icon}>🔧</Text>
            <Text style={[s.title, { color: colors.textPrimary }]}>{workspaceId}</Text>
          </View>
        )}
      </ScrollView>
    </NeonBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.xl },
  header: { paddingBottom: SPACING.lg, borderBottomWidth: 1, marginBottom: SPACING.lg },
  closeButton: { fontSize: TYPOGRAPHY.sm, fontWeight: FONT_WEIGHT.medium, padding: SPACING.sm },
  titleRow: { flexDirection: "row", alignItems: "center", gap: SPACING.lg, marginBottom: SPACING.xl },
  titleIcon: { fontSize: 40 },
  title: { fontSize: TYPOGRAPHY.xxl, fontWeight: FONT_WEIGHT.bold },
  description: { fontSize: TYPOGRAPHY.md, marginTop: SPACING.xs },
  center: { alignItems: "center", gap: SPACING.lg, paddingTop: SPACING.xxl },
  icon: { fontSize: 64 },
  section: { fontSize: TYPOGRAPHY.sm, fontWeight: FONT_WEIGHT.medium, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: SPACING.md, marginTop: SPACING.lg },
  statsRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.md },
  statCard: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: "center" },
  statVal: { fontSize: TYPOGRAPHY.lg, fontWeight: FONT_WEIGHT.bold },
  statLbl: { fontSize: TYPOGRAPHY.xs, marginTop: 2 },
  card: { padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm },
  cardTitle: { fontSize: TYPOGRAPHY.md, fontWeight: FONT_WEIGHT.bold },
  cardText: { fontSize: TYPOGRAPHY.sm, marginTop: SPACING.xs },
  cardStatus: { fontSize: TYPOGRAPHY.sm, fontWeight: FONT_WEIGHT.medium, marginTop: SPACING.xs },
  txRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: SPACING.md },
  txDesc: { fontSize: TYPOGRAPHY.md, flex: 1 },
  txAmount: { fontSize: TYPOGRAPHY.md, fontWeight: FONT_WEIGHT.bold },
  featuresCard: { marginTop: SPACING.xl, padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1 },
  featuresTitle: { fontSize: TYPOGRAPHY.sm, fontWeight: FONT_WEIGHT.medium, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: SPACING.xs },
  featureRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: SPACING.md },
  featureText: { fontSize: TYPOGRAPHY.md },
  featureStatus: { fontSize: TYPOGRAPHY.sm, fontWeight: FONT_WEIGHT.medium },
  emptyCard: { padding: SPACING.xl, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: "center", marginVertical: SPACING.md },
  emptyText: { fontSize: TYPOGRAPHY.md, textAlign: "center" },
});
