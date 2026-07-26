import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { RADIUS, SPACING, TYPOGRAPHY, FONT_WEIGHT } from "../../theme/tokens";

interface CardProps {
  title?: string;
  subtitle?: string;
  rightElement?: any;
  variant?: "default" | "elevated";
  children?: any;
  style?: any;
  onPress?: () => void;
}

export function Card({
  title,
  subtitle,
  rightElement,
  variant = "default",
  children,
  style,
  onPress,
}: CardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: variant === "elevated" ? colors.bgElevated : colors.surface,
          borderColor: colors.surfaceBorder + "14",
          opacity: pressed ? 0.9 : 1,
        },
        style,
      ]}
      onPress={onPress}
    >
      {(title || rightElement) && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {title && (
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
          {rightElement}
        </View>
      )}
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: 2,
  },
});
