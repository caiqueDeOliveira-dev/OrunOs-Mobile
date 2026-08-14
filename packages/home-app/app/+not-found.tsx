// Orun Home — 404 fallback (expo-router +not-found)

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { P, TYPE, FW, RADIUS } from "../src/theme/premium";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>
        <Ionicons name="alert-circle-outline" size={40} color={P.primary} />
      </View>
      <Text style={styles.title}>Tela nao encontrada</Text>
      <Text style={styles.sub}>Essa pagina nao existe no Orun Home.</Text>
      <Pressable style={styles.btn} onPress={() => router.replace("/" as never)}>
        <Text style={styles.btnText}>Voltar para o inicio</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.bg,
    gap: 12,
    padding: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(195,0,47,0.14)",
  },
  title: {
    color: P.text,
    fontSize: TYPE.lg,
    fontWeight: FW.semibold,
  },
  sub: {
    color: P.sub,
    fontSize: TYPE.sm,
    textAlign: "center",
  },
  btn: {
    marginTop: 8,
    backgroundColor: P.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  btnText: {
    color: "#fff",
    fontSize: TYPE.sm,
    fontWeight: FW.semibold,
  },
});
