// Orun Home — Automations screen (list + enable/disable + run)

import React from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "../src/components/AppShell";
import { Card, PageHeader, Badge, Toggle } from "../src/components/ui";
import { useHomeStore } from "../src/stores/homeStore";
import { P, TYPE, FW } from "../src/theme/premium";

export default function AutomationsScreen() {
  const automations = useHomeStore((s) => s.automations);
  const toggleAutomation = useHomeStore((s) => s.toggleAutomation);
  const runAutomation = useHomeStore((s) => s.runAutomation);

  const onRun = async (id: string) => {
    const res = await runAutomation(id);
    if (res.success) Alert.alert("Executada", `Automatizacao "${res.data?.name || id}" executada.`);
  };

  return (
    <AppShell>
      <PageHeader
        icon="flash"
        title="Automatizacoes"
        subtitle={`${automations.filter((a) => a.enabled).length} de ${automations.length} ativas`}
        actions={<Badge tone="info">agendadas localmente</Badge>}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {automations.map((automation) => (
            <Card key={automation.id} style={styles.automationCard}>
              <View style={styles.automationRow}>
                <View style={styles.automationIcon}>
                  <Ionicons name="flash" size={16} color={automation.enabled ? P.primary : P.dim} />
                </View>
                <View style={styles.automationInfo}>
                  <Text style={[styles.automationName, { color: automation.enabled ? P.text : P.dim }]}>
                    {automation.name}
                  </Text>
                  <Text style={styles.automationDesc} numberOfLines={1}>
                    {automation.description}
                  </Text>
                  {automation.lastRun && (
                    <Text style={styles.automationRun}>Ultima execucao: {new Date(automation.lastRun).toLocaleString("pt-BR")}</Text>
                  )}
                </View>
                <View style={styles.automationActions}>
                  <Toggle on={automation.enabled} onChange={() => toggleAutomation(automation.id)} />
                  <View style={styles.runBtn}>
                    <Ionicons name="play" size={16} color={P.primary} />
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
  automationCard: {
    padding: 16,
  },
  automationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  automationIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.card2,
  },
  automationInfo: {
    flex: 1,
    minWidth: 0,
  },
  automationName: {
    fontSize: TYPE.sm,
    fontWeight: FW.semibold,
  },
  automationDesc: {
    color: P.sub,
    fontSize: TYPE.xs,
    marginTop: 2,
  },
  automationRun: {
    color: P.dim,
    fontSize: 10,
    marginTop: 4,
  },
  automationActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  runBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.card2,
    borderWidth: 1,
    borderColor: P.border,
  },
});
