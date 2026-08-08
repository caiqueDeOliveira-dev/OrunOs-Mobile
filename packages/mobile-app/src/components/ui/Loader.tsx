import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { NEON } from "../../theme/tokens";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
}

export function Loader({ size = "md" }: LoaderProps) {
  const { colors } = useTheme();
  const sizeMap = { sm: 16, md: 24, lg: 36 };
  const s = sizeMap[size];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.glowRing,
          {
            width: s * 2.4,
            height: s * 2.4,
            borderRadius: s * 1.2,
            backgroundColor: colors.accent + "18",
            borderColor: NEON.glow.red + "40",
          },
        ]}
      >
        <ActivityIndicator color={colors.accentGlow} size={size === "sm" ? "small" : "large"} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  glowRing: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#ff2d6f",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});
