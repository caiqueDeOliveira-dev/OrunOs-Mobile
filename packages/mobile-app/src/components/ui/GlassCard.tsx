import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeProvider";
import { NEON, RADIUS, SPACING, TYPOGRAPHY, FONT_WEIGHT } from "../../theme/tokens";

interface GlassCardProps {
  title?: string;
  subtitle?: string;
  rightElement?: any;
  children?: any;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
  glowColor?: string;
  onPress?: () => void;
}

/**
 * GlassCard — glassmorphism surface (real blur) with optional neon glow edge.
 * Core building block of the Neon/Glass redesign.
 */
export function GlassCard({
  title,
  subtitle,
  rightElement,
  children,
  style,
  glow = false,
  glowColor,
  onPress,
}: GlassCardProps) {
  const { colors } = useTheme();
  const glowColorResolved = glowColor ?? colors.accentGlow;

  const surface = (
    <BlurView
      intensity={NEON.glass.blur}
      tint={NEON.glass.tint}
      style={styles.cardBlur}
    >
      <LinearGradient
        colors={[...NEON.gradient.card]}
        style={styles.card}
      >
        {glow && <View style={[styles.glowEdge, { backgroundColor: glowColorResolved }]} />}
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
      </LinearGradient>
    </BlurView>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }, style]}
      >
        {surface}
      </Pressable>
    );
  }

  return <View style={style}>{surface}</View>;
}

const styles = StyleSheet.create({
  cardBlur: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    overflow: "hidden",
  },
  glowEdge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    opacity: 0.6,
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
