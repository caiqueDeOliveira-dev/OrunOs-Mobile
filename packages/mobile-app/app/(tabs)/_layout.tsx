import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { TYPOGRAPHY, FONT_WEIGHT } from "../../src/theme/tokens";
import { t } from "../../src/i18n";

export default function TabsLayout() {
  const { colors } = useTheme();
  const { tabBarPadding } = useSafeArea();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgBase,
          borderTopColor: colors.surfaceBorder + "14",
          borderTopWidth: 1,
          height: 60 + tabBarPadding.paddingBottom,
          paddingTop: 8,
          ...tabBarPadding,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: TYPOGRAPHY.xs,
          fontWeight: FONT_WEIGHT.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tab.home"),
          tabBarLabel: t("tab.home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tab.chat"),
          tabBarLabel: t("tab.chat"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: t("tab.agents"),
          tabBarLabel: t("tab.agents"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memory"
        options={{
          title: t("memory.title"),
          tabBarLabel: t("memory.title"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="automations"
        options={{
          title: t("automations.title"),
          tabBarLabel: t("automations.title"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title: t("tab.voice"),
          tabBarLabel: t("tab.voice"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tab.settings"),
          tabBarLabel: t("tab.settings"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
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
