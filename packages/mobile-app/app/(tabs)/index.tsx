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
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../src/theme/tokens";
import { useAuthStore } from "../../src/stores/authStore";
import { supabase } from "../../src/services/supabaseClient";
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
            toValue: 0.7,
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
            toValue: 0.3,
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
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <View style={[styles.content, headerPadding]}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>
            {t("home.greeting")}, {session?.user?.email?.split("@")[0]}
          </Text>
        </View>

        <View style={styles.centerArea}>
          <Animated.View
            style={[
              styles.orbContainer,
              {
                transform: [{ scale: pulseAnim }],
                shadowColor: colors.accent,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.orbGlow,
                {
                  backgroundColor: colors.accent,
                  opacity: glowAnim,
                },
              ]}
            />
            <View style={[styles.orb, { borderColor: colors.accent }]}>
              <Image
                source={require("../../assets/icon.png")}
                style={styles.orbImage}
                resizeMode="cover"
              />
            </View>
          </Animated.View>

          <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Hampton</Text>
        </View>

        <View style={styles.inputArea}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "20" }]}>
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
              style={[styles.sendButton, { backgroundColor: input.trim() ? colors.accent : colors.surfaceHover }]}
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
          <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "20" }]}>
            <Pressable
              style={[styles.menuItem, { borderBottomColor: colors.surfaceBorder + "10" }]}
              onPress={() => {
                setShowVoiceMenu(false);
                router.push("/voice");
              }}
            >
              <Ionicons name="mic-outline" size={20} color={colors.accent} />
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>{t("voice.title")}</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => setShowVoiceMenu(false)}
            >
              <Ionicons name="close-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.menuItemText, { color: colors.textMuted }]}>{t("common.cancel")}</Text>
            </Pressable>
          </View>
        )}

        {showAgents && (
          <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "20" }]}>
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
                    <Ionicons name="person-outline" size={18} color={colors.accent} />
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
            <Pressable
              style={styles.menuItem}
              onPress={() => setShowAgents(false)}
            >
              <Ionicons name="close-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.menuItemText, { color: colors.textMuted }]}>{t("common.close")}</Text>
            </Pressable>
          </View>
        )}

        {!showAgents && !showVoiceMenu && (
          <View style={styles.suggestions}>
            <Pressable
              style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "14" }]}
              onPress={() => handleSuggestion("chat")}
              accessibilityRole="button"
              accessibilityLabel={t("home.suggestion.chat")}
            >
              <Ionicons name="chatbubble-outline" size={16} color={colors.accent} />
              <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>{t("home.suggestion.chat")}</Text>
            </Pressable>
            <Pressable
              style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "14" }]}
              onPress={() => handleSuggestion("voice")}
              accessibilityRole="button"
              accessibilityLabel={t("home.suggestion.voice")}
            >
              <Ionicons name="mic-outline" size={16} color={colors.accent} />
              <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>{t("home.suggestion.voice")}</Text>
            </Pressable>
            <Pressable
              style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "14" }]}
              onPress={() => handleSuggestion("agents")}
              accessibilityRole="button"
              accessibilityLabel={t("home.suggestion.agents")}
            >
              <Ionicons name="people-outline" size={16} color={colors.accent} />
              <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>{t("home.suggestion.agents")}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: "space-between",
  },
  header: {
    paddingTop: SPACING.xl,
  },
  greeting: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  centerArea: {
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
    justifyContent: "center",
  },
  orbContainer: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  orbGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    overflow: "hidden",
  },
  orbImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  orbLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  inputArea: {
    gap: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.md,
    paddingVertical: SPACING.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
