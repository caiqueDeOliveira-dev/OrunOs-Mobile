import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
}

export function Loader({ size = "md" }: LoaderProps) {
  const { colors } = useTheme();
  const sizeMap = { sm: 16, md: 24, lg: 36 };

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accent} size={size === "sm" ? "small" : "large"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
});
