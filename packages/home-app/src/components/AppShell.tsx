// Orun Home — sidebar navigation (landscape layout: left rail + content)

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { P, RADIUS, TYPE, FW } from "../theme/premium";
import { HomeHampton } from "./HomeHampton";
import { useHomeStore } from "../stores/homeStore";

const NAV_ITEMS: { route: string; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { route: "/", icon: "home", label: "Home" },
  { route: "/dispositivos", icon: "grid", label: "Dispositivos" },
  { route: "/cenarios", icon: "sparkles", label: "Cenarios" },
  { route: "/automacoes", icon: "flash", label: "Automatizacoes" },
  { route: "/assistente", icon: "chatbubble-ellipses", label: "Assistente" },
  { route: "/sistema", icon: "settings", label: "Sistema" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const rooms = useHomeStore((s) => s.rooms);
  const devicesOn = rooms.flatMap((r) => r.devices).filter((d) => d.state).length;

  return (
    <View style={styles.root}>
      {/* Left rail */}
      <View style={styles.sidebar}>
        <View style={styles.logoWrap}>
          <View style={styles.logo}>
            <HomeHampton state="idle" size={64} image={require("../../assets/icon.png")} />
          </View>
          <Text style={styles.logoText}>ORUN HOME</Text>
          <Text style={styles.logoSub}>
            {devicesOn} dispositivo(s) ligado(s)
          </Text>
        </View>

        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.route;
            return (
              <Pressable
                key={item.route}
                onPress={() => router.push(item.route as never)}
                style={[styles.navItem, active && styles.navItemActive]}
              >
                <Ionicons name={item.icon} size={18} color={active ? P.primary : P.sub} />
                <Text style={[styles.navLabel, active && { color: P.text }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sidebarFooter}>
          <Text style={styles.footerText}>Orun Home v0.1.0</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: P.bg,
  },
  sidebar: {
    width: 190,
    backgroundColor: P.panel,
    borderRightWidth: 1,
    borderRightColor: P.border,
    paddingVertical: 20,
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  logoWrap: {
    alignItems: "center",
    gap: 6,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.card,
    borderWidth: 1,
    borderColor: P.border,
    overflow: "hidden",
  },
  logoText: {
    color: P.text,
    fontSize: TYPE.sm,
    fontWeight: FW.bold,
    letterSpacing: 2,
    marginTop: 4,
  },
  logoSub: {
    color: P.dim,
    fontSize: 9,
    textAlign: "center",
  },
  nav: {
    gap: 6,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  navItemActive: {
    backgroundColor: "rgba(195,0,47,0.14)",
  },
  navLabel: {
    color: P.sub,
    fontSize: TYPE.sm,
    fontWeight: FW.medium,
  },
  sidebarFooter: {
    alignItems: "center",
  },
  footerText: {
    color: P.dim,
    fontSize: 9,
  },
  content: {
    flex: 1,
    padding: 24,
  },
});
