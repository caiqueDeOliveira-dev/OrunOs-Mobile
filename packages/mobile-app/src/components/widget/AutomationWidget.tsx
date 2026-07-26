import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { t } from "../../i18n";

interface WidgetProps {
  title: string;
  status: "active" | "paused" | "error";
  lastRun?: string;
  nextRun?: string;
}

export function AutomationWidget({ title, status, lastRun, nextRun }: WidgetProps) {
  const { colors } = useTheme();

  const statusColors = {
    active: "#22C55E",
    paused: "#EAB308",
    error: "#EF4444",
  };

  const statusLabels = {
    active: t("automations.status.active"),
    paused: t("automations.status.paused"),
    error: t("automations.status.error"),
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.dot, { backgroundColor: statusColors[status] }]} />
      </View>
      <Text style={[styles.status, { color: statusColors[status] }]}>
        {statusLabels[status]}
      </Text>
      {lastRun && (
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {t("automations.lastRun")}: {lastRun}
        </Text>
      )}
      {nextRun && (
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {t("automations.nextRun")}: {nextRun}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    minWidth: 150,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  status: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  meta: {
    fontSize: 10,
    marginTop: 2,
  },
});
