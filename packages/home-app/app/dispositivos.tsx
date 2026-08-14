// Orun Home — Devices screen (per-room device grid)

import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { AppShell } from "../src/components/AppShell";
import { DeviceCard } from "../src/components/DeviceCard";
import { PageHeader, Badge } from "../src/components/ui";
import { useHomeStore } from "../src/stores/homeStore";
import { P, TYPE, FW } from "../src/theme/premium";

export default function DevicesScreen() {
  const rooms = useHomeStore((s) => s.rooms);
  const config = useHomeStore((s) => s.config);
  const toggleDevice = useHomeStore((s) => s.toggleDevice);
  const setBrightness = useHomeStore((s) => s.setBrightness);
  const setTemperature = useHomeStore((s) => s.setTemperature);
  const lockDevice = useHomeStore((s) => s.lockDevice);

  return (
    <AppShell>
      <PageHeader
        icon="grid"
        title="Dispositivos"
        subtitle={`${rooms.flatMap((r) => r.devices).length} dispositivos em ${rooms.length} ambientes`}
        actions={
          config.mode === "ha" ? (
            <Badge tone={config.connected ? "ok" : "warn"}>{config.connected ? "Home Assistant" : "HA sem conexao"}</Badge>
          ) : (
            <Badge tone="ok">Local</Badge>
          )
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {rooms.map((room) => (
          <View key={room.id} style={styles.roomSection}>
            <Text style={styles.roomTitle}>{room.name}</Text>
            <View style={styles.grid}>
              {room.devices.map((device) => (
                <View key={device.id} style={styles.deviceCell}>
                  <DeviceCard
                    device={device}
                    onToggle={() => toggleDevice(device.id)}
                    onBrightness={(v) => setBrightness(device.id, v)}
                    onTemp={(v) => setTemperature(device.id, v)}
                    onLock={(locked) => lockDevice(device.id, locked)}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  roomSection: {
    marginBottom: 24,
  },
  roomTitle: {
    color: P.text,
    fontSize: TYPE.lg,
    fontWeight: FW.semibold,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  deviceCell: {
    width: "23%",
    minWidth: 220,
    flexGrow: 1,
  },
});
