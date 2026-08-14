// Orun Home — System screen (Home Assistant config + satellite status + fullscreen)

import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import { AppShell } from "../src/components/AppShell";
import { Card, PageHeader, Badge, PrimaryButton, GhostButton, SectionHeader } from "../src/components/ui";
import { useHomeStore } from "../src/stores/homeStore";
import { testConnection } from "../src/services/homeAssistant";
import { startSatellite, stopSatellite, getDeviceId, SATELLITE_VERSION } from "../src/services/satelliteController";
import { supabase } from "../src/services/supabaseClient";
import { P, TYPE, FW, RADIUS } from "../src/theme/premium";

export default function SystemScreen() {
  const config = useHomeStore((s) => s.config);
  const saveConfig = useHomeStore((s) => s.saveConfig);
  const [host, setHost] = useState(config.host);
  const [token, setToken] = useState(config.token);
  const [mode, setMode] = useState(config.mode);
  const [fullscreen, setFullscreen] = useState(true);
  const [satellite, setSatellite] = useState<{ status: string; deviceId: string | null; error?: string }>({
    status: "desconhecido",
    deviceId: null,
  });

  const refreshSatellite = useCallback(async () => {
    const deviceId = getDeviceId();
    if (!deviceId) {
      setSatellite({ status: "parado", deviceId: null });
      return;
    }
    try {
      const { data } = await supabase.from("devices").select("online, ultimo_seen").eq("id", deviceId).maybeSingle();
      if (data) {
        const online = data.online ? "conectado" : "desconectado";
        setSatellite({ status: online, deviceId });
      } else {
        setSatellite({ status: "nao registrado", deviceId });
      }
    } catch (e: any) {
      setSatellite({ status: "erro", deviceId, error: String(e?.message || e) });
    }
  }, []);

  useEffect(() => {
    refreshSatellite();
  }, [refreshSatellite]);

  const onSaveConfig = async () => {
    if (mode === "local") {
      await saveConfig({ mode: "local", name: "Orun Home" });
      Alert.alert("Modo local ativo", "Os dispositivos sao controlados por este tablet via satelite Orun.");
      return;
    }
    if (!host) {
      Alert.alert("Host necessario", "Informe o endereco do Home Assistant para usar o modo Home Assistant.");
      return;
    }
    await saveConfig({ host, token, mode, name: "Orun Home" });
    const res = await testConnection();
    Alert.alert(res.connected ? "Conectado" : "Falha na conexao", res.connected ? "Home Assistant conectado." : (res.error || "Sem resposta."));
  };

  const toggleFullscreen = async () => {
    try {
      if (fullscreen) {
        await ScreenOrientation.unlockAsync();
        setFullscreen(false);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setFullscreen(true);
      }
    } catch {
      /* unsupported */
    }
  };

  return (
    <AppShell>
      <PageHeader icon="settings" title="Sistema" subtitle="Configuracao da casa e conexao" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.cols}>
          {/* Left: data source */}
          <View style={styles.colLeft}>
            <SectionHeader
              icon="server"
              title="Fonte de dados"
              right={
                <Badge tone={config.mode === "ha" ? (config.connected ? "ok" : "warn") : "ok"}>
                  {config.mode === "ha" ? (config.connected ? "Home Assistant" : "HA sem conexao") : "Local (tablet)"}
                </Badge>
              }
            />

            <Card style={styles.card}>
              <Text style={styles.label}>Modo</Text>
              <View style={styles.segmented}>
                <Pressable style={[styles.segment, mode === "local" && styles.segmentActive]} onPress={() => setMode("local")}>
                  <Text style={[styles.segmentText, mode === "local" && { color: P.text }]}>Local (tablet)</Text>
                </Pressable>
                <Pressable style={[styles.segment, mode === "ha" && styles.segmentActive]} onPress={() => setMode("ha")}>
                  <Text style={[styles.segmentText, mode === "ha" && { color: P.text }]}>Home Assistant</Text>
                </Pressable>
              </View>

              {mode === "local" ? (
                <View>
                  <View style={styles.infoRow}>
                    <View style={styles.satIcon}>
                      <Ionicons name="phone-portrait" size={16} color={P.success} />
                    </View>
                    <View style={styles.satInfo}>
                      <Text style={styles.infoTitle}>Este tablet e a fonte de dados</Text>
                      <Text style={styles.infoDesc}>
                        Os dispositivos sao controlados localmente e sincronizados com o ecossistema Orun (satelite). Nenhuma dependencia externa.
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.infoHint}>
                    Home Assistant e uma integracao avancada e opcional. Sem ele, o app funciona completo neste tablet.
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.label}>Host</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="http://192.168.1.10:8123"
                    placeholderTextColor={P.dim}
                    autoCapitalize="none"
                    value={host}
                    onChangeText={setHost}
                  />

                  <Text style={styles.label}>Token de acesso</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Long-lived access token"
                    placeholderTextColor={P.dim}
                    secureTextEntry
                    value={token}
                    onChangeText={setToken}
                  />

                  {config.error && <Text style={styles.error}>{config.error}</Text>}

                  <PrimaryButton onPress={onSaveConfig} style={styles.saveBtn}>
                    <Ionicons name="save" size={14} color="#fff" />
                    <Text style={styles.btnText}>Salvar e testar</Text>
                  </PrimaryButton>
                </View>
              )}
            </Card>
          </View>

          {/* Right: Satellite + display */}
          <View style={styles.colRight}>
            <SectionHeader icon="pulse" title="Satelite do ecossistema" />

            <Card style={styles.card}>
              <View style={styles.satRow}>
                <View style={styles.satIcon}>
                  <Ionicons name="pulse" size={16} color={P.primary} />
                </View>
                <View style={styles.satInfo}>
                  <Text style={styles.satLabel}>Dispositivo</Text>
                  <Text style={styles.satValue} numberOfLines={1}>
                    {satellite.deviceId || "nao iniciado"}
                  </Text>
                </View>
                <Badge tone={satellite.status === "conectado" ? "ok" : "warn"}>{satellite.status}</Badge>
              </View>

              <View style={styles.satRow}>
                <View style={styles.satIcon}>
                  <Ionicons name="code-slash" size={16} color={P.info} />
                </View>
                <View style={styles.satInfo}>
                  <Text style={styles.satLabel}>Versao</Text>
                  <Text style={styles.satValue}>Orun Home v{SATELLITE_VERSION}</Text>
                </View>
              </View>

              <View style={styles.satActions}>
                <GhostButton onPress={() => startSatellite().then(refreshSatellite)}>
                  <Text style={styles.btnText}>Reconectar</Text>
                </GhostButton>
                <GhostButton onPress={() => stopSatellite().then(refreshSatellite)}>
                  <Text style={styles.btnText}>Parar</Text>
                </GhostButton>
              </View>
            </Card>

            <SectionHeader icon="expand" title="Tela" />

            <Card style={styles.card}>
              <View style={styles.satRow}>
                <View style={styles.satIcon}>
                  <Ionicons name="phone-landscape" size={16} color={P.violet} />
                </View>
                <View style={styles.satInfo}>
                  <Text style={styles.satLabel}>Fullscreen de lado (landscape)</Text>
                  <Text style={styles.satValue}>{fullscreen ? "Travado em paisagem" : "Orientacao livre"}</Text>
                </View>
                <PrimaryButton onPress={toggleFullscreen}>
                  <Text style={styles.btnText}>{fullscreen ? "Liberar" : "Travar"}</Text>
                </PrimaryButton>
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  cols: {
    flexDirection: "row",
    gap: 20,
  },
  colLeft: {
    flex: 1,
  },
  colRight: {
    flex: 1,
  },
  card: {
    padding: 18,
    gap: 8,
    marginBottom: 18,
  },
  label: {
    color: P.sub,
    fontSize: TYPE.xs,
    fontWeight: FW.medium,
    marginTop: 10,
  },
  input: {
    backgroundColor: P.panel,
    borderWidth: 1,
    borderColor: P.borderHi,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: P.text,
    fontSize: TYPE.sm,
    marginTop: 4,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: P.panel,
    borderRadius: RADIUS.md,
    padding: 4,
    marginTop: 6,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "rgba(195,0,47,0.2)",
  },
  segmentText: {
    color: P.sub,
    fontSize: TYPE.xs,
    fontWeight: FW.medium,
  },
  saveBtn: {
    marginTop: 14,
  },
  btnText: {
    color: "#fff",
    fontSize: TYPE.xs,
    fontWeight: FW.semibold,
  },
  error: {
    color: P.error,
    fontSize: TYPE.xs,
    marginTop: 8,
  },
  satRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  satIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.card2,
  },
  satInfo: {
    flex: 1,
    minWidth: 0,
  },
  satLabel: {
    color: P.dim,
    fontSize: 10,
  },
  satValue: {
    color: P.text,
    fontSize: TYPE.sm,
    fontWeight: FW.medium,
  },
  satActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  infoTitle: {
    color: P.text,
    fontSize: TYPE.sm,
    fontWeight: FW.semibold,
  },
  infoDesc: {
    color: P.sub,
    fontSize: TYPE.xs,
    lineHeight: 16,
    marginTop: 3,
  },
  infoHint: {
    color: P.dim,
    fontSize: TYPE.xs - 1,
    lineHeight: 15,
    marginTop: 12,
  },
});
