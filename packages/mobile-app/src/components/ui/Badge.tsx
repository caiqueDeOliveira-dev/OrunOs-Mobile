import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { RADIUS, SPACING, TYPOGRAPHY, FONT_WEIGHT } from "../../theme/tokens";

interface BadgeProps {
  label: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
}

export function Badge({ label, variant = "neutral", size = "sm" }: BadgeProps) {
  const { colors } = useTheme();

  const colorMap = {
    success: { bg: colors.success + "20", text: colors.success },
    warning: { bg: colors.warning + "20", text: colors.warning },
    danger: { bg: colors.danger + "20", text: colors.danger },
    info: { bg: colors.info + "20", text: colors.info },
    neutral: { bg: colors.surfaceActive, text: colors.textSecondary },
  };

  const v = colorMap[variant];
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: v.bg,
          paddingHorizontal: isSmall ? SPACING.sm : SPACING.md,
          paddingVertical: isSmall ? 2 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: v.text,
            fontSize: isSmall ? TYPOGRAPHY.xs : TYPOGRAPHY.sm,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: FONT_WEIGHT.medium,
  },
});
