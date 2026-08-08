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
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.bgSunken,
            borderColor: error ? colors.danger : colors.surfaceBorder + "33",
            shadowColor: error ? colors.danger : colors.accentGlow,
            shadowOpacity: error ? 0.4 : 0.2,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
            elevation: 3,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.textPrimary }, style]}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          {...rest}
        />
      </View>
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
  field: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: "center",
  },
  input: {
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.md,
  },
  error: {
    fontSize: TYPOGRAPHY.xs,
    marginLeft: SPACING.xs,
  },
});
