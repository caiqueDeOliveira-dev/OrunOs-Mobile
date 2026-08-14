// Orun Home — Dashboard (Home screen, 3-column landscape layout)

import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "../src/components/AppShell";
import { HomeHampton } from "../src/components/HomeHampton";
import { PageHeader, StatCard, Card, SectionHeader, Badge } from "../src/components/ui";
import { useHomeStore } from "../src/stores/homeStore";
import { P, TYPE, FW } from "../src/theme/premium";

export default function HomeScreen() {
  const router = useRouter();
  const rooms = useHomeStore((s) => s.rooms);
  const status = useHomeStore((s) => s.status);
  const automations = useHomeStore((s) => s.automations);
  const scenes = useHomeStore((s) => s.scenes);
  const config = useHomeStore((s) => s.config);
  const toggleDevice = useHomeStore((s) => s.toggleDevice);

  const favorites = rooms.flatMap((r) => r.devices).filter((d) => ["luz_sala", "ar_sala", "porta_entrada", "alarme"].includes(d.id));

  return (
    <AppShell>
      <PageHeader
        icon="home"
        title="Minha Casa"
        subtitle={
          config.mode === "ha" && config.connected
            ? "Conectado ao Home Assistant"
            : config.mode === "ha"
            ? "Home Assistant configurado (sem conexao)"
            : "Controlado por este tablet via satelite Orun"
        }
        actions={
          <Badge tone={status.devices.alerts > 0 ? "warn" : "ok"}>
            {status.devices.alerts > 0 ? `${status.devices.alerts} alerta(s)` : "Tudo normal"}
          </Badge>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Row 1 — stats */}
        <View style={styles.statsRow}>
          <StatCard icon="bulb" label="Luzes" value={`${status.devices.lightsOn}/${status.devices.lights}`} status="ok" tone="ok" />
          <StatCard icon="lock-closed" label="Trancados" value={`${status.devices.locked}/${status.devices.locks}`} status="seguro" tone="ok" />
          <StatCard icon="speedometer" label="Energia" value={status.energy.total} status="agora" tone="neutral" />
          <StatCard icon="flash" label="Automatizacoes" value={`${status.automations.enabled}/${status.automations.total}`} status="ativas" tone="info" onPress={() => router.push("/automacoes" as never)} />
        </View>

        {/* Row 2 — avatar + rooms */}
        <View style={styles.midRow}>
          <Card style={styles.avatarCard}>
            <View style={styles.avatarWrap}>
              <HomeHampton state={status.devices.alerts > 0 ? "thinking" : "idle"} size={150} image={require("../assets/icon.png")} />
            </View>
            <Text style={styles.avatarTitle}>Casa sob controle</Text>
            <Text style={styles.avatarSub}>
              {status.devices.on}/{status.devices.total} dispositivos ligados
            </Text>
          </Card>

          <View style={styles.roomsWrap}>
            <SectionHeader icon="grid" title="Ambientes" />
            <View style={styles.roomsGrid}>
              {rooms.map((room) => (
                <Card key={room.id} hover onPress={() => router.push("/dispositivos" as never)} style={styles.roomCard}>
                  <View style={styles.roomTop}>
                    <View style={styles.roomIcon}>
                      <Ionicons name="home" size={15} color={P.primary} />
                    </View>
                    <Badge tone={room.devices.some((d) => d.state) ? "ok" : "neutral"}>{room.devices.length}</Badge>
                  </View>
                  <Text style={styles.roomName} numberOfLines={1}>
                    {room.name}
                  </Text>
                  <Text style={styles.roomCount}>
                    {room.devices.filter((d) => d.state).length}/{room.devices.length} ligados
                  </Text>
                </Card>
              ))}
            </View>
          </View>
        </View>

        {/* Row 3 — favorites + quick actions */}
        <View style={styles.bottomRow}>
          <View style={styles.favoritesWrap}>
            <SectionHeader icon="star" title="Favoritos" />
            <View style={styles.favoritesGrid}>
              {favorites.map((d) => (
                <Card key={d.id} hover onPress={() => toggleDevice(d.id)} style={styles.favCard}>
                  <Ionicons
                    name={d.type === "lock" ? (d.locked ? "lock-closed" : "lock-open") : d.type === "light" ? "bulb" : d.type === "climate" ? "snow" : "power"}
                    size={18}
                    color={d.state ? P.primary : P.sub}
                  />
                  <Text style={[styles.favName, { color: d.state ? P.text : P.dim }]} numberOfLines={1}>
                    {d.name}
                  </Text>
                  <Text style={styles.favState} numberOfLines={1}>
                    {d.state ? "ligado" : "desligado"}
                  </Text>
                </Card>
              ))}
            </View>
          </View>

          <View style={styles.quickWrap}>
            <SectionHeader icon="sparkles" title="Cenas rapidas" />
            <View style={styles.scenesList}>
              {scenes.slice(0, 2).map((scene) => (
                <Card key={scene.id} hover onPress={() => useHomeStore.getState().activateScene(scene.id)} style={styles.sceneCard}>
                  <View style={styles.sceneIcon}>
                    <Ionicons name="sparkles" size={15} color={P.primary} />
                  </View>
                  <View style={styles.sceneInfo}>
                    <Text style={styles.sceneName} numberOfLines={1}>
                      {scene.name}
                    </Text>
                    <Text style={styles.sceneDesc} numberOfLines={1}>
                      {scene.description}
                    </Text>
                  </View>
                  <Ionicons name="play" size={16} color={P.primary} />
                </Card>
              ))}
            </View>
            <View style={styles.automationStrip}>
              <View style={styles.sceneIcon}>
                <Ionicons name="flash" size={15} color={P.info} />
              </View>
              <View style={styles.sceneInfo}>
                <Text style={styles.sceneName}>
                  {automations.filter((a) => a.enabled).length} automatizacoes ativas
                </Text>
                <Text style={styles.sceneDesc}>
                  {automations.filter((a) => a.lastRun).length} ja executadas
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 24,
    gap: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  midRow: {
    flexDirection: "row",
    gap: 20,
  },
  avatarCard: {
    width: 240,
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 16,
  },
  avatarWrap: {
    height: 172,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTitle: {
    color: P.text,
    fontSize: TYPE.md,
    fontWeight: FW.semibold,
    marginTop: 8,
  },
  avatarSub: {
    color: P.sub,
    fontSize: TYPE.xs,
    marginTop: 4,
  },
  roomsWrap: {
    flex: 1,
  },
  roomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  roomCard: {
    width: "48%",
    padding: 14,
    gap: 8,
  },
  roomTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roomIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(195,0,47,0.14)",
  },
  roomName: {
    color: P.text,
    fontSize: TYPE.sm,
    fontWeight: FW.semibold,
  },
  roomCount: {
    color: P.sub,
    fontSize: TYPE.xs,
  },
  bottomRow: {
    flexDirection: "row",
    gap: 20,
  },
  favoritesWrap: {
    flex: 1,
  },
  favoritesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  favCard: {
    width: "30%",
    flexGrow: 1,
    padding: 12,
    gap: 6,
    alignItems: "flex-start",
  },
  favName: {
    fontSize: TYPE.xs,
    fontWeight: FW.medium,
  },
  favState: {
    fontSize: 10,
    color: P.dim,
  },
  quickWrap: {
    width: 300,
  },
  scenesList: {
    gap: 10,
  },
  sceneCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  sceneIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.card2,
  },
  sceneInfo: {
    flex: 1,
    minWidth: 0,
  },
  sceneName: {
    color: P.text,
    fontSize: TYPE.sm,
    fontWeight: FW.medium,
  },
  sceneDesc: {
    color: P.sub,
    fontSize: TYPE.xs,
    marginTop: 2,
  },
  automationStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: P.panel,
    borderWidth: 1,
    borderColor: P.border,
  },
});
