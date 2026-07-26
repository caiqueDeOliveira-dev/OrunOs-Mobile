import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { RADIUS, TYPOGRAPHY, FONT_WEIGHT } from "../../theme/tokens";

interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  isCore?: boolean;
  status?: "online" | "busy" | "offline";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColorForName(name: string): string {
  const palette = ["#8b0014", "#1a6b3c", "#2563eb", "#9333ea", "#d97706", "#0891b2"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({ name, size = "md", isCore = false, status }: AvatarProps) {
  const { colors } = useTheme();

  const sizeMap = { sm: 32, md: 40, lg: 56 };
  const fontSizeMap = { sm: 11, md: 14, lg: 18 };
  const s = sizeMap[size];
  const bgColor = getColorForName(name);

  return (
    <View style={{ width: s, height: s }}>
      <View
        style={[
          styles.avatar,
          {
            width: s,
            height: s,
            borderRadius: s / 2,
            backgroundColor: bgColor,
            borderWidth: isCore ? 2 : 0,
            borderColor: isCore ? colors.gold : "transparent",
          },
        ]}
      >
        <Text
          style={[
            styles.initials,
            {
              color: colors.textInverted,
              fontSize: fontSizeMap[size],
            },
          ]}
        >
          {getInitials(name)}
        </Text>
      </View>
      {status && (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                status === "online" ? colors.success : status === "busy" ? colors.warning : colors.textMuted,
              width: size === "sm" ? 8 : 10,
              height: size === "sm" ? 8 : 10,
              borderRadius: size === "sm" ? 4 : 5,
              borderWidth: 2,
              borderColor: colors.bgBase,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: FONT_WEIGHT.bold,
  },
  statusDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
  },
});
