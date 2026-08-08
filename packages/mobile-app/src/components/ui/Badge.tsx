import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { RADIUS, SPACING, TYPOGRAPHY, FONT_WEIGHT } from "../../theme/tokens";

interface BadgeProps {
  label: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
  glow?: boolean;
}

export function Badge({ label, variant = "neutral", size = "sm", glow = false }: BadgeProps) {
  const { colors } = useTheme();

  const colorMap = {
    success: { bg: colors.success + "22", text: colors.success },
    warning: { bg: colors.warning + "22", text: colors.warning },
    danger: { bg: colors.danger + "22", text: colors.danger },
    info: { bg: colors.info + "22", text: colors.info },
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
          borderColor: glow ? v.text + "55" : "transparent",
          shadowColor: glow ? v.text : "transparent",
          shadowOpacity: glow ? 0.5 : 0,
          shadowRadius: glow ? 6 : 0,
          shadowOffset: { width: 0, height: 0 },
          elevation: glow ? 3 : 0,
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
    borderWidth: 1,
  },
  text: {
    fontWeight: FONT_WEIGHT.medium,
  },
});
