import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet,
  RefreshControl, Alert, Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { NEON, SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../src/theme/tokens";
import { t } from "../../src/i18n";
import {
  loadScheduledJobs, createScheduledJob, toggleScheduledJob,
  deleteScheduledJob, loadJobRuns, describeCron,
  type ScheduledJob, type JobRun,
} from "../../src/services/schedulerService";
import { NeonBackground } from "../../src/components/ui";

const AGENTS = [
  { id: "hampton", name: "Hampton" },
  { id: "health", name: "Health" },
  { id: "finance", name: "Finance" },
  { id: "developer", name: "Developer" },
  { id: "teacher", name: "Teacher" },
  { id: "creator", name: "Creator" },
  { id: "designer", name: "Designer" },
  { id: "marketing", name: "Marketing" },
  { id: "automation", name: "Automation" },
  { id: "system", name: "System" },
  { id: "automotive", name: "Automotive" },
];

const CRON_PRESETS = [
  { label: "A cada hora", value: "0 * * * *" },
  { label: "A cada 6 horas", value: "0 */6 * * *" },
  { label: "Todo dia as 9h", value: "0 9 * * *" },
  { label: "Todo dia as 18h", value: "0 18 * * *" },
  { label: "Dias de semana as 9h", value: "0 9 * * 1-5" },
  { label: "Toda segunda as 8h", value: "0 8 * * 1" },
  { label: "Todo dia as meio-dia", value: "0 12 * * *" },
];

export default function SchedulerScreen() {
  const { colors } = useTheme();
  const { headerPadding } = useSafeArea();
  const router = useRouter();
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
  const [runs, setRuns] = useState<JobRun[]>([]);

  // Create form
  const [newAgent, setNewAgent] = useState("hampton");
  const [newName, setNewName] = useState("");
  const [newCron, setNewCron] = useState("0 9 * * *");
  const [newPrompt, setNewPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      const data = await loadScheduledJobs();
      setJobs(data);
    } catch { /* */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const loadRuns = useCallback(async (jobId: string) => {
    try {
      const data = await loadJobRuns(jobId);
      setRuns(data);
    } catch { /* */ }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const handleCreate = async () => {
    if (!newName.trim() || !newPrompt.trim()) return;
    setCreating(true);
    try {
      await createScheduledJob(newAgent, newName.trim(), newCron, newPrompt.trim());
      setShowCreate(false);
      setNewName("");
      setNewPrompt("");
      await loadJobs();
    } catch (err) {
      Alert.alert("Erro", (err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (job: ScheduledJob) => {
    try {
      await toggleScheduledJob(job.id, !job.enabled);
      await loadJobs();
    } catch (err) {
      Alert.alert("Erro", (err as Error).message);
    }
  };

  const handleDelete = async (job: ScheduledJob) => {
    Alert.alert("Excluir", `Excluir "${job.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteScheduledJob(job.id);
            await loadJobs();
          } catch (err) {
            Alert.alert("Erro", (err as Error).message);
          }
        },
      },
    ]);
  };

  const statusColor = (status: string) => {
    if (status === "success") return "#4CAF50";
    if (status === "error") return "#F44336";
    return colors.textMuted;
  };

  return (
    <NeonBackground style={s.container}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadJobs(); }} tintColor={colors.accentGlow} />}
      >
        <View
          style={[
            s.header,
            headerPadding,
            { backgroundColor: "rgba(10,4,20,0.55)", borderBottomColor: NEON.glow.red + "40" },
          ]}
        >
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
            <Text style={[s.closeBtn, { color: colors.textMuted }]}>✕ {t("workspace.close")}</Text>
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.textPrimary }]}>⚡ Agendador</Text>
          <Pressable onPress={() => setShowCreate(true)} style={[s.addBtn, { backgroundColor: colors.accent, shadowColor: colors.accentGlow, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 6 }]}>
            <Text style={s.addBtnText}>+ Novo</Text>
          </Pressable>
        </View>

        {jobs.length === 0 && !loading && (
          <View style={[s.emptyCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
            <Text style={[s.emptyIcon, { color: colors.textMuted }]}>⚡</Text>
            <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>Nenhum job agendado</Text>
            <Text style={[s.emptySubtitle, { color: colors.textSecondary }]}>
              Crie jobs para seus agentes executarem tarefas automaticamente
            </Text>
          </View>
        )}

        {jobs.map((job) => (
          <Pressable
            key={job.id}
            onPress={() => { setSelectedJob(job); loadRuns(job.id); }}
            style={[s.jobCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30", opacity: job.enabled ? 1 : 0.5 }]}
          >
            <View style={s.jobHeader}>
              <View style={s.jobInfo}>
                <Text style={[s.jobName, { color: colors.textPrimary }]}>{job.name}</Text>
                <Text style={[s.jobAgent, { color: colors.accentGlow }]}>{AGENTS.find((a) => a.id === job.agent_id)?.name ?? job.agent_id}</Text>
              </View>
              <View style={s.jobActions}>
                <Pressable onPress={() => handleToggle(job)} style={[s.toggleBtn, { backgroundColor: job.enabled ? "#4CAF50" : colors.surfaceBorder }]}>
                  <Text style={s.toggleText}>{job.enabled ? "ON" : "OFF"}</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(job)} style={s.deleteBtn}>
                  <Text style={[s.deleteText, { color: "#F44336" }]}>✕</Text>
                </Pressable>
              </View>
            </View>
            <Text style={[s.jobCron, { color: colors.textSecondary }]}>{describeCron(job.cron_expression)}</Text>
            <Text style={[s.jobPrompt, { color: colors.textMuted }]} numberOfLines={2}>{job.prompt}</Text>
            {job.last_run_at && (
              <Text style={[s.jobLastRun, { color: colors.textMuted }]}>
                Ultima execucao: {new Date(job.last_run_at).toLocaleString("pt-BR")}
              </Text>
            )}
          </Pressable>
        ))}

        {/* Job Detail Modal */}
        <Modal visible={!!selectedJob} transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={[s.modalContent, { backgroundColor: "#0D0518" }]}>
              <View style={s.modalHeader}>
                <Text style={[s.modalTitle, { color: colors.textPrimary }]}>{selectedJob?.name}</Text>
                <Pressable onPress={() => setSelectedJob(null)}>
                  <Text style={[s.modalClose, { color: colors.textMuted }]}>✕</Text>
                </Pressable>
              </View>
              <Text style={[s.modalCron, { color: colors.accentGlow }]}>
                {selectedJob ? describeCron(selectedJob.cron_expression) : ""}
              </Text>
              <Text style={[s.modalPrompt, { color: colors.textSecondary }]}>{selectedJob?.prompt}</Text>

              <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>HISTORICO</Text>
              {runs.length === 0 ? (
                <Text style={[s.noRuns, { color: colors.textMuted }]}>Nenhuma execucao ainda</Text>
              ) : (
                runs.map((run) => (
                  <View key={run.id} style={[s.runRow, { borderBottomColor: NEON.glow.red + "30" }]}>
                    <View style={[s.runDot, { backgroundColor: statusColor(run.status) }]} />
                    <View style={s.runInfo}>
                      <Text style={[s.runStatus, { color: statusColor(run.status) }]}>
                        {run.status === "success" ? "Sucesso" : run.status === "error" ? "Erro" : "Ignorado"}
                      </Text>
                      <Text style={[s.runTime, { color: colors.textMuted }]}>
                        {new Date(run.ran_at).toLocaleString("pt-BR")}
                        {run.duration_ms ? ` (${run.duration_ms}ms)` : ""}
                      </Text>
                    </View>
                    {run.error_message && (
                      <Text style={[s.runError, { color: "#F44336" }]} numberOfLines={1}>{run.error_message}</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        </Modal>

        {/* Create Modal */}
        <Modal visible={showCreate} transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={[s.modalContent, { backgroundColor: "#0D0518" }]}>
              <View style={s.modalHeader}>
                <Text style={[s.modalTitle, { color: colors.textPrimary }]}>Novo Job</Text>
                <Pressable onPress={() => setShowCreate(false)}>
                  <Text style={[s.modalClose, { color: colors.textMuted }]}>✕</Text>
                </Pressable>
              </View>

              <Text style={[s.label, { color: colors.textSecondary }]}>Agente</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.agentRow}>
                {AGENTS.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => setNewAgent(a.id)}
                    style={[s.agentChip, { backgroundColor: newAgent === a.id ? colors.accent : "rgba(10,4,20,0.6)", borderColor: newAgent === a.id ? colors.accent : NEON.glow.red + "40" }]}
                  >
                    <Text style={[s.agentChipText, { color: newAgent === a.id ? "#fff" : colors.textPrimary }]}>{a.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={[s.label, { color: colors.textSecondary }]}>Nome</Text>
              <TextInput
                style={[s.input, { backgroundColor: "rgba(10,4,20,0.6)", color: colors.textPrimary, borderColor: NEON.glow.red + "40" }]}
                value={newName}
                onChangeText={setNewName}
                placeholder="Ex: Resumo diario"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[s.label, { color: colors.textSecondary }]}>Horario</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.presetRow}>
                {CRON_PRESETS.map((p) => (
                  <Pressable
                    key={p.value}
                    onPress={() => setNewCron(p.value)}
                    style={[s.presetChip, { backgroundColor: newCron === p.value ? colors.accent : "rgba(10,4,20,0.6)", borderColor: newCron === p.value ? colors.accent : NEON.glow.red + "40" }]}
                  >
                    <Text style={[s.presetText, { color: newCron === p.value ? "#fff" : colors.textPrimary }]}>{p.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={[s.label, { color: colors.textSecondary }]}>Prompt</Text>
              <TextInput
                style={[s.input, s.textArea, { backgroundColor: "rgba(10,4,20,0.6)", color: colors.textPrimary, borderColor: NEON.glow.red + "40" }]}
                value={newPrompt}
                onChangeText={setNewPrompt}
                placeholder="O que o agente deve fazer..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />

              <Pressable
                onPress={handleCreate}
                disabled={creating || !newName.trim() || !newPrompt.trim()}
                style={[s.createBtn, { backgroundColor: colors.accent, opacity: creating || !newName.trim() || !newPrompt.trim() ? 0.5 : 1 }]}
              >
                <Text style={s.createBtnText}>{creating ? "Criando..." : "Criar Job"}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </NeonBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.xl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: SPACING.lg, borderBottomWidth: 1, marginBottom: SPACING.xl },
  closeBtn: { fontSize: TYPOGRAPHY.sm, fontWeight: FONT_WEIGHT.medium, padding: SPACING.sm },
  headerTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: FONT_WEIGHT.bold, flex: 1, marginLeft: SPACING.md },
  addBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  addBtnText: { color: "#fff", fontWeight: FONT_WEIGHT.bold, fontSize: TYPOGRAPHY.sm },
  emptyCard: { padding: SPACING.xxl, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: "center", gap: SPACING.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: FONT_WEIGHT.bold },
  emptySubtitle: { fontSize: TYPOGRAPHY.md, textAlign: "center" },
  jobCard: { padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.md },
  jobHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  jobInfo: { flex: 1 },
  jobName: { fontSize: TYPOGRAPHY.lg, fontWeight: FONT_WEIGHT.bold },
  jobAgent: { fontSize: TYPOGRAPHY.sm, marginTop: 2 },
  jobActions: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  toggleBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm },
  toggleText: { color: "#fff", fontSize: TYPOGRAPHY.xs, fontWeight: FONT_WEIGHT.bold },
  deleteBtn: { padding: SPACING.sm },
  deleteText: { fontSize: TYPOGRAPHY.md },
  jobCron: { fontSize: TYPOGRAPHY.sm, marginTop: SPACING.sm },
  jobPrompt: { fontSize: TYPOGRAPHY.sm, marginTop: SPACING.xs },
  jobLastRun: { fontSize: TYPOGRAPHY.xs, marginTop: SPACING.sm },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
  modalTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: FONT_WEIGHT.bold },
  modalClose: { fontSize: TYPOGRAPHY.xl, padding: SPACING.sm },
  modalCron: { fontSize: TYPOGRAPHY.md, fontWeight: FONT_WEIGHT.medium, marginBottom: SPACING.sm },
  modalPrompt: { fontSize: TYPOGRAPHY.md, marginBottom: SPACING.xl },
  sectionTitle: { fontSize: TYPOGRAPHY.sm, fontWeight: FONT_WEIGHT.medium, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: SPACING.md },
  noRuns: { fontSize: TYPOGRAPHY.md, textAlign: "center", paddingVertical: SPACING.xl },
  runRow: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.md, borderBottomWidth: 1, gap: SPACING.md },
  runDot: { width: 8, height: 8, borderRadius: 4 },
  runInfo: { flex: 1 },
  runStatus: { fontSize: TYPOGRAPHY.sm, fontWeight: FONT_WEIGHT.medium },
  runTime: { fontSize: TYPOGRAPHY.xs },
  runError: { fontSize: TYPOGRAPHY.xs, flex: 1 },
  label: { fontSize: TYPOGRAPHY.sm, fontWeight: FONT_WEIGHT.medium, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  agentRow: { flexDirection: "row", marginBottom: SPACING.sm },
  agentChip: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, marginRight: SPACING.sm },
  agentChipText: { fontSize: TYPOGRAPHY.sm },
  presetRow: { flexDirection: "row", marginBottom: SPACING.sm },
  presetChip: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, marginRight: SPACING.sm },
  presetText: { fontSize: TYPOGRAPHY.sm },
  input: { borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.lg, fontSize: TYPOGRAPHY.md },
  textArea: { height: 80, textAlignVertical: "top" },
  createBtn: { marginTop: SPACING.xl, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: "center" },
  createBtnText: { color: "#fff", fontWeight: FONT_WEIGHT.bold, fontSize: TYPOGRAPHY.md },
});
