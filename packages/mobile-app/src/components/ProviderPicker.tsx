import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView, Modal, StyleSheet,
} from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../theme/tokens";
import { getAllProviders, setAgentProvider, type ProviderInfo, type ModelInfo } from "../services/providerService";

interface ProviderPickerProps {
  visible: boolean;
  onClose: () => void;
  agentId: string;
  onProviderChanged?: (provider: string, model: string) => void;
}

export function ProviderPicker({ visible, onClose, agentId, onProviderChanged }: ProviderPickerProps) {
  const { colors } = useTheme();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setProviders(getAllProviders());
      setSelectedProvider(null);
    }
  }, [visible]);

  const handleSelect = async (provider: ProviderInfo, model: ModelInfo) => {
    setSaving(true);
    try {
      await setAgentProvider(agentId, provider.id, model.id);
      onProviderChanged?.(provider.id, model.id);
      onClose();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={[s.content, { backgroundColor: colors.surface }]}>
          <View style={s.header}>
            <Text style={[s.title, { color: colors.textPrimary }]}>Trocar Provider</Text>
            <Pressable onPress={onClose}>
              <Text style={[s.close, { color: colors.textMuted }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={s.scroll}>
            {providers.map((provider) => (
              <View key={provider.id}>
                <Pressable
                  onPress={() => setSelectedProvider(selectedProvider === provider.id ? null : provider.id)}
                  style={[s.providerRow, { backgroundColor: colors.bgBase, borderColor: colors.surfaceBorder + "14" }]}
                >
                  <View style={s.providerInfo}>
                    <Text style={[s.providerName, { color: colors.textPrimary }]}>{provider.name}</Text>
                    <Text style={[s.providerCount, { color: colors.textMuted }]}>
                      {provider.models.filter((m) => m.free).length} modelos gratis
                    </Text>
                  </View>
                  <Text style={[s.arrow, { color: colors.textMuted }]}>
                    {selectedProvider === provider.id ? "▼" : "▶"}
                  </Text>
                </Pressable>

                {selectedProvider === provider.id && (
                  <View style={s.modelsList}>
                    {provider.models.map((model) => (
                      <Pressable
                        key={model.id}
                        onPress={() => handleSelect(provider, model)}
                        disabled={saving}
                        style={[s.modelRow, { borderColor: colors.surfaceBorder + "14" }]}
                      >
                        <View style={s.modelInfo}>
                          <View style={s.modelHeader}>
                            <Text style={[s.modelName, { color: colors.textPrimary }]}>{model.name}</Text>
                            {model.free && (
                              <View style={[s.freeBadge, { backgroundColor: "#4CAF50" }]}>
                                <Text style={s.freeText}>GRATIS</Text>
                              </View>
                            )}
                            {!model.free && (
                              <View style={[s.freeBadge, { backgroundColor: colors.textMuted }]}>
                                <Text style={s.freeText}>PAGO</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[s.modelDesc, { color: colors.textSecondary }]}>{model.description}</Text>
                          <Text style={[s.modelId, { color: colors.textMuted }]}>{model.id}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  content: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: "80%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: SPACING.xl, paddingBottom: SPACING.lg },
  title: { fontSize: TYPOGRAPHY.xl, fontWeight: FONT_WEIGHT.bold },
  close: { fontSize: TYPOGRAPHY.xl, padding: SPACING.sm },
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl },
  providerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm },
  providerInfo: { flex: 1 },
  providerName: { fontSize: TYPOGRAPHY.md, fontWeight: FONT_WEIGHT.bold },
  providerCount: { fontSize: TYPOGRAPHY.sm, marginTop: 2 },
  arrow: { fontSize: TYPOGRAPHY.sm },
  modelsList: { marginBottom: SPACING.sm },
  modelRow: { padding: SPACING.lg, paddingLeft: SPACING.xl, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.xs, marginLeft: SPACING.lg },
  modelInfo: {},
  modelHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  modelName: { fontSize: TYPOGRAPHY.md, fontWeight: FONT_WEIGHT.medium },
  freeBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm },
  freeText: { color: "#fff", fontSize: 10, fontWeight: FONT_WEIGHT.bold },
  modelDesc: { fontSize: TYPOGRAPHY.sm, marginTop: SPACING.xs },
  modelId: { fontSize: TYPOGRAPHY.xs, marginTop: 2, fontFamily: "monospace" },
});
