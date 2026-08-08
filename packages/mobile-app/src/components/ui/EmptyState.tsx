import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS, NEON } from "../../theme/tokens";
import { LinearGradient } from "expo-linear-gradient";

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconGlow,
          {
            backgroundColor: colors.accent + "18",
            borderColor: NEON.glow.red + "40",
          },
        ]}
      >
        <View style={[styles.iconDot, { backgroundColor: colors.accentGlow }]} />
      </View>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, marginTop: SPACING.md }]}
        >
          <LinearGradient
            colors={[...NEON.gradient.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.action}
          >
            <Text style={[styles.actionText, { color: colors.textInverted }]}>{actionLabel}</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
  },
  iconGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: SPACING.sm,
    shadowColor: "#ff2d6f",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  iconDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  title: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: "center",
  },
  message: {
    fontSize: TYPOGRAPHY.sm,
    textAlign: "center",
  },
  action: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  actionText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
