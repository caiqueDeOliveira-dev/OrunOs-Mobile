// Orun Home — Scenes screen (activate scenes)

import React from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "../src/components/AppShell";
import { Card, PageHeader } from "../src/components/ui";
import { useHomeStore } from "../src/stores/homeStore";
import { P, TYPE, FW, RADIUS } from "../src/theme/premium";

export default function ScenesScreen() {
  const scenes = useHomeStore((s) => s.scenes);
  const activateScene = useHomeStore((s) => s.activateScene);

  const onActivate = async (sceneId: string) => {
    const res = await activateScene(sceneId);
    if (res.success) Alert.alert("Cena ativada", "A cena foi aplicada aos dispositivos.");
    else Alert.alert("Erro", "Nao foi possivel ativar a cena.");
  };

  return (
    <AppShell>
      <PageHeader icon="sparkles" title="Cenas" subtitle="Ambientes prontos com um toque" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {scenes.map((scene) => (
            <Card key={scene.id} hover onPress={() => onActivate(scene.id)} style={styles.sceneCard}>
              <View style={styles.sceneTop}>
                <View style={styles.sceneIcon}>
                  <Ionicons name="sparkles" size={22} color={P.primary} />
                </View>
                <View style={styles.playBtn}>
                  <Ionicons name="play" size={16} color={P.primary} />
                </View>
              </View>
              <Text style={styles.sceneName}>{scene.name}</Text>
              <Text style={styles.sceneDesc} numberOfLines={2}>
                {scene.description}
              </Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  sceneCard: {
    width: "23%",
    minWidth: 220,
    flexGrow: 1,
    padding: 18,
    gap: 10,
  },
  sceneTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sceneIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(195,0,47,0.14)",
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.card2,
    borderWidth: 1,
    borderColor: P.border,
  },
  sceneName: {
    color: P.text,
    fontSize: TYPE.md,
    fontWeight: FW.semibold,
  },
  sceneDesc: {
    color: P.sub,
    fontSize: TYPE.xs,
    lineHeight: 18,
  },
});
