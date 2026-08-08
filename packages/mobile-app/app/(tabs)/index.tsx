import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  StyleSheet,
  Animated,
  Keyboard,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS, NEON } from "../../src/theme/tokens";
import { useAuthStore } from "../../src/stores/authStore";
import { supabase } from "../../src/services/supabaseClient";
import { NeonBackground } from "../../src/components/ui/NeonBackground";
import { t } from "../../src/i18n";

interface AgentOption {
  id: string;
  name: string;
  role: string | null;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { headerPadding } = useSafeArea();
  const { session } = useAuthStore();
  const router = useRouter();

  const [input, setInput] = useState("");
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [showAgents, setShowAgents] = useState(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.8,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.35,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  useEffect(() => {
    if (showAgents) {
      supabase
        .from("agents")
        .select("id, name, role")
        .order("name", { ascending: true })
        .then(({ data }) => {
          if (data) setAgents(data);
        });
    }
  }, [showAgents]);

  const handleSubmit = () => {
    const trimmed = input.trim().toLowerCase();
    Keyboard.dismiss();

    if (trimmed === "/voz" || trimmed === "/v") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowVoiceMenu(true);
      setShowAgents(false);
      setInput("");
      return;
    }

    if (trimmed === "/agentes" || trimmed === "/a" || trimmed === "/agent") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowAgents(true);
      setShowVoiceMenu(false);
      setInput("");
      return;
    }

    if (trimmed.startsWith("/")) {
      setInput("");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/chat", params: { message: input.trim() } });
    setInput("");
  };

  const handleSuggestion = (type: "chat" | "voice" | "agents") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === "chat") router.push("/chat");
    if (type === "voice") router.push("/voice");
    if (type === "agents") router.push("/agents");
  };

  const handleAgentPress = (agentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAgents(false);
    router.push(`/chat/${agentId}`);
  };

  return (
    <NeonBackground>
      <View style={styles.content}>
        <View style={headerPadding}>
          <View style={styles.header}>
            <Text style={[styles.greeting, { color: colors.textPrimary }]}>
              {t("home.greeting")}, {session?.user?.email?.split("@")[0]}
            </Text>
            <View style={styles.statusChip}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>Online</Text>
            </View>
          </View>
        </View>

        <View style={styles.centerArea}>
          <Animated.View
            style={[
              styles.orbContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.orbHalo,
                {
                  opacity: glowAnim,
                  shadowColor: NEON.glow.red,
                },
              ]}
            />
            <LinearGradient
              colors={["rgba(255,45,111,0.28)", "rgba(195,0,47,0.08)", "rgba(255,209,102,0.18)"]}
              style={[styles.orbGlow, { opacity: glowAnim.interpolate({ inputRange: [0.3, 0.8], outputRange: [0.25, 0.7] }) }]}
            />
            <View style={[styles.orb, { borderColor: NEON.glow.red + "88" }]}>
              <Image
                source={require("../../assets/icon.png")}
                style={styles.orbImage}
                resizeMode="cover"
              />
            </View>
          </Animated.View>

          <View style={styles.orbLabelWrap}>
            <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Hampton</Text>
            <View style={[styles.orbLine, { backgroundColor: NEON.glow.red + "66" }]} />
          </View>
        </View>

        <View style={styles.inputArea}>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: "rgba(15,7,24,0.6)",
                borderColor: NEON.glow.red + "40",
                shadowColor: NEON.glow.red,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder={t("home.inputPlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSubmit}
              returnKeyType="send"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={[
                styles.sendButton,
                { backgroundColor: input.trim() ? colors.accent : "rgba(255,255,255,0.06)" },
              ]}
              onPress={handleSubmit}
              accessibilityRole="button"
              accessibilityLabel={t("home.send")}
              accessibilityState={{ disabled: !input.trim() }}
            >
              <Ionicons name="arrow-up" size={20} color={input.trim() ? colors.textInverted : colors.textMuted} />
            </Pressable>
          </View>

          <Text style={[styles.hint, { color: colors.textMuted }]}>
            /voz  /agentes
          </Text>
        </View>

        {showVoiceMenu && (
          <View
            style={[
              styles.menu,
              {
                backgroundColor: "rgba(15,7,24,0.85)",
                borderColor: NEON.glow.red + "40",
              },
            ]}
          >
            <Pressable
              style={[styles.menuItem, { borderBottomColor: colors.surfaceBorder + "10" }]}
              onPress={() => {
                setShowVoiceMenu(false);
                router.push("/voice");
              }}
            >
              <Ionicons name="mic-outline" size={20} color={colors.accentGlow} />
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>{t("voice.title")}</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => setShowVoiceMenu(false)}>
              <Ionicons name="close-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.menuItemText, { color: colors.textMuted }]}>{t("common.cancel")}</Text>
            </Pressable>
          </View>
        )}

        {showAgents && (
          <View
            style={[
              styles.menu,
              {
                backgroundColor: "rgba(15,7,24,0.85)",
                borderColor: NEON.glow.red + "40",
              },
            ]}
          >
            {agents.length === 0 ? (
              <View style={styles.menuItem}>
                <Ionicons name="people-outline" size={20} color={colors.textMuted} />
                <Text style={[styles.menuItemText, { color: colors.textMuted }]}>{t("agents.empty")}</Text>
              </View>
            ) : (
              <FlatList
                data={agents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.menuItem, { borderBottomColor: colors.surfaceBorder + "10" }]}
                    onPress={() => handleAgentPress(item.id)}
                  >
                    <Ionicons name="person-outline" size={18} color={colors.accentGlow} />
                    <View style={styles.agentInfo}>
                      <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>{item.name}</Text>
                      {item.role && (
                        <Text style={[styles.agentRole, { color: colors.textMuted }]}>{item.role}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </Pressable>
                )}
                style={styles.agentList}
              />
            )}
            <Pressable style={styles.menuItem} onPress={() => setShowAgents(false)}>
              <Ionicons name="close-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.menuItemText, { color: colors.textMuted }]}>{t("common.close")}</Text>
            </Pressable>
          </View>
        )}

        {!showAgents && !showVoiceMenu && (
          <View style={styles.suggestions}>
            {(
              [
                { type: "chat", icon: "chatbubble-outline", label: t("home.suggestion.chat") },
                { type: "voice", icon: "mic-outline", label: t("home.suggestion.voice") },
                { type: "agents", icon: "people-outline", label: t("home.suggestion.agents") },
              ] as const
            ).map((chip) => (
              <Pressable
                key={chip.type}
                style={[
                  styles.suggestionChip,
                  {
                    backgroundColor: "rgba(15,7,24,0.55)",
                    borderColor: NEON.glow.red + "30",
                  },
                ]}
                onPress={() => handleSuggestion(chip.type)}
                accessibilityRole="button"
                accessibilityLabel={chip.label}
              >
                <Ionicons name={chip.icon} size={16} color={colors.accentGlow} />
                <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>{chip.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </NeonBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: "space-between",
  },
  header: {
    paddingTop: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: FONT_WEIGHT.bold,
    flex: 1,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: "rgba(15,7,24,0.6)",
    borderWidth: 1,
    borderColor: NEON.glow.red + "33",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  centerArea: {
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
    justifyContent: "center",
  },
  orbContainer: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  orbHalo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 46,
    elevation: 16,
  },
  orbGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  orb: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 2,
    overflow: "hidden",
  },
  orbImage: {
    width: 124,
    height: 124,
    borderRadius: 62,
  },
  orbLabelWrap: {
    alignItems: "center",
    gap: SPACING.sm,
  },
  orbLabel: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  orbLine: {
    width: 56,
    height: 1.5,
    borderRadius: 1,
  },
  inputArea: {
    gap: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    height: 54,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.md,
    paddingVertical: SPACING.sm,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: TYPOGRAPHY.xs,
    textAlign: "center",
    paddingBottom: SPACING.xs,
  },
  suggestions: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  suggestionChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  menu: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    maxHeight: 280,
    marginBottom: SPACING.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "transparent",
  },
  menuItemText: {
    fontSize: TYPOGRAPHY.md,
    flex: 1,
  },
  agentInfo: {
    flex: 1,
  },
  agentRole: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2,
  },
  agentList: {
    maxHeight: 200,
  },
});
