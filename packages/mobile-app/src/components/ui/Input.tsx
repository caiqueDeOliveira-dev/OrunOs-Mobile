import React from "react";
import { TextInput, View, Text, StyleSheet, TextInputProps } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { RADIUS, SPACING, TYPOGRAPHY } from "../../theme/tokens";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: InputProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.bgSunken,
            borderColor: error ? colors.danger : colors.surfaceBorder + "20",
            color: colors.textPrimary,
          },
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        {...rest}
      />
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: "500",
    marginLeft: SPACING.xs,
  },
  input: {
    height: 48,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.md,
  },
  error: {
    fontSize: TYPOGRAPHY.xs,
    marginLeft: SPACING.xs,
  },
});
