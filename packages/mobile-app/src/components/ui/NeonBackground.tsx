import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NEON } from "../../theme/tokens";

interface NeonBackgroundProps {
  children?: any;
  style?: StyleProp<ViewStyle>;
}

/**
 * NeonBackground — deep gradient backdrop with two ambient neon glows
 * (blood red + gold) for the futuristic look. Drop behind screen content.
 */
export function NeonBackground({ children, style }: NeonBackgroundProps) {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={[...NEON.gradient.background]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, styles.glowRed]} />
      <View style={[styles.glow, styles.glowGold]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  glow: {
    position: "absolute",
    borderRadius: 300,
    opacity: 0.32,
  },
  glowRed: {
    width: 320,
    height: 320,
    top: -120,
    right: -100,
    backgroundColor: "#ff1e56",
    shadowColor: "#ff2d6f",
    shadowOpacity: 0.9,
    shadowRadius: 60,
    elevation: 20,
  },
  glowGold: {
    width: 260,
    height: 260,
    bottom: -80,
    left: -90,
    backgroundColor: "#ffd166",
    shadowColor: "#ffd166",
    shadowOpacity: 0.6,
    shadowRadius: 50,
    elevation: 14,
  },
});
