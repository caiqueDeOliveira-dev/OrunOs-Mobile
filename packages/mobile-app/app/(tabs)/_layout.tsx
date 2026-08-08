import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { TYPOGRAPHY, FONT_WEIGHT, NEON } from "../../src/theme/tokens";
import { t } from "../../src/i18n";

export default function TabsLayout() {
  const { colors } = useTheme();
  const { tabBarPadding } = useSafeArea();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(10,4,20,0.72)",
          borderTopColor: NEON.glow.red + "44",
          borderTopWidth: 1,
          height: 64 + tabBarPadding.paddingBottom,
          paddingTop: 6,
          ...tabBarPadding,
          position: "absolute",
          elevation: 0,
          shadowColor: NEON.glow.red,
          shadowOpacity: 0.25,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarActiveTintColor: colors.accentGlow,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: TYPOGRAPHY.xs,
          fontWeight: FONT_WEIGHT.medium,
        },
        sceneStyle: { backgroundColor: NEON.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tab.home"),
          tabBarLabel: t("tab.home"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tab.chat"),
          tabBarLabel: t("tab.chat"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: t("tab.agents"),
          tabBarLabel: t("tab.agents"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memory"
        options={{
          title: t("memory.title"),
          tabBarLabel: t("memory.title"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "time" : "time-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="automations"
        options={{
          title: t("automations.title"),
          tabBarLabel: t("automations.title"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "flash" : "flash-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title: t("tab.voice"),
          tabBarLabel: t("tab.voice"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "mic" : "mic-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tab.settings"),
          tabBarLabel: t("tab.settings"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="providers"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
