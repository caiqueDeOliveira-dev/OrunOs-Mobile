import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { RADIUS, SPACING, TYPOGRAPHY, FONT_WEIGHT } from "../../theme/tokens";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import type { OrunAgent } from "../../types";

interface AgentCardProps {
  agent: OrunAgent;
  onPress: (agent: OrunAgent) => void;
}

export const AgentCard = memo(function AgentCard({ agent, onPress }: AgentCardProps) {
  const { colors } = useTheme();

  const statusVariant = agent.status === "online" ? "success" : agent.status === "busy" ? "warning" : "neutral";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder + "14",
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={() => onPress(agent)}
    >
      <Avatar
        name={agent.name}
        src={agent.avatarUrl}
        size="lg"
        isCore={agent.isCore}
        status={agent.status}
      />
      <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
        {agent.name}
      </Text>
      <Text style={[styles.role, { color: colors.textMuted }]} numberOfLines={2}>
        {agent.role}
      </Text>
      <Badge label={agent.status} variant={statusVariant} size="sm" />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
    minWidth: 140,
  },
  name: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: "center",
  },
  role: {
    fontSize: TYPOGRAPHY.xs,
    textAlign: "center",
    lineHeight: 16,
  },
});
