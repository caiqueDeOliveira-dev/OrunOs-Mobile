import React from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet, PressableProps, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeProvider";
import { NEON, RADIUS, TYPOGRAPHY, FONT_WEIGHT } from "../../theme/tokens";

interface ButtonProps extends PressableProps {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  label: string;
  gradient?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  label,
  gradient = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();

  const variantStyles = {
    primary: { bg: colors.accent, text: colors.textInverted },
    secondary: { bg: colors.surface, text: colors.textPrimary },
    ghost: { bg: "transparent", text: colors.textSecondary },
    danger: { bg: colors.danger, text: colors.textInverted },
    outline: { bg: "transparent", text: colors.textPrimary },
  };

  const sizeStyles = {
    sm: { height: 44, px: 12, fontSize: TYPOGRAPHY.sm },
    md: { height: 44, px: 16, fontSize: TYPOGRAPHY.md },
    lg: { height: 52, px: 20, fontSize: TYPOGRAPHY.lg },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const useGradient = gradient && variant === "primary";

  const content = loading ? (
    <ActivityIndicator color={v.text} size="small" />
  ) : (
    <Text style={[styles.label, { color: v.text, fontSize: s.fontSize }]}>{label}</Text>
  );

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          height: s.height,
          paddingHorizontal: s.px,
          backgroundColor: useGradient ? undefined : variant === "outline" ? "transparent" : v.bg,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: colors.surfaceBorder + "20",
          opacity: disabled || loading ? 0.5 : pressed ? 0.85 : 1,
          shadowColor: useGradient ? colors.accentGlow : undefined,
          shadowOpacity: useGradient ? 0.45 : 0,
          shadowRadius: useGradient ? 14 : 0,
          shadowOffset: { width: 0, height: 0 },
          elevation: useGradient ? 8 : 0,
        },
        style as ViewStyle,
      ]}
      {...rest}
    >
      {useGradient ? (
        <LinearGradient
          colors={[...NEON.gradient.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    overflow: "hidden",
  },
  gradientFill: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  label: {
    fontWeight: FONT_WEIGHT.semibold,
  },
});
