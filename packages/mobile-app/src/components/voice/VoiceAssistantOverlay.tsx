// Orun OS — Voice assistant overlay
//
// Global floating button so the assistant is reachable from every screen:
// tap to wake it manually, long-press to stop, and a live status card while
// it's listening / capturing / speaking. With the wake word enabled the
// assistant also activates hands-free ("Ok Orun").

import React, { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet, Modal } from "react-native";
import * as Haptics from "expo-haptics";
import { NEON, SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../theme/tokens";
import { useSafeArea } from "../../hooks/useSafeArea";
import {
  getAssistantSnapshot,
  startAssistant,
  stopAssistant,
  manualWake,
  subscribeAssistant,
  type AssistantSnapshot,
  type AssistantState,
} from "../../services/voiceAssistant";

const STATE_LABELS: Record<AssistantState, string> = {
  off: "Assistente desligado",
  idle: "Toque para falar",
  listening: "Ouvindo... diga Ok Orun",
  waking: "Acordando...",
  greeting: "Orun está falando...",
  capturing: "Ouvindo seu comando...",
  transcribing: "Entendendo...",
  thinking: "Pensando...",
  speaking: "Orun está falando...",
};

const ACTIVE_STATES: AssistantState[] = [
  "waking",
  "greeting",
  "capturing",
  "transcribing",
  "thinking",
  "speaking",
];

const PULSE_STATES: AssistantState[] = ["listening", "capturing", "speaking"];

export default function VoiceAssistantOverlay() {
  const { bottom } = useSafeArea();
  const [snapshot, setSnapshot] = useState<AssistantSnapshot>(getAssistantSnapshot);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => subscribeAssistant(setSnapshot), []);

  useEffect(() => {
    if (PULSE_STATES.includes(snapshot.state)) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => {
        loop.stop();
        pulse.setValue(1);
      };
    }
  }, [snapshot.state]);

  const { state, transcript, reply, wakeAvailable, error } = snapshot;
  const active = ACTIVE_STATES.includes(state) || state === "listening";

  async function handleTap() {
    if (state === "off") {
      await startAssistant();
      return;
    }
    if (ACTIVE_STATES.includes(state) || state === "listening") {
      await stopAssistant();
      return;
    }
    // idle — manual wake
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await manualWake();
  }

  const orbColor =
    state === "capturing" || state === "listening"
      ? colorsFor(state).accent
      : state === "speaking" || state === "greeting"
        ? colorsFor(state).success
        : state === "off"
          ? "#3a3545"
          : colorsFor(state).accent;

  return (
    <>
      <Pressable
        onPress={handleTap}
        onLongPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          void stopAssistant();
        }}
        hitSlop={12}
        style={[styles.fab, { bottom: bottom + 64, right: SPACING.lg }]}
        accessibilityLabel="Assistente de voz"
      >
        <Animated.View
          style={[
            styles.fabOrb,
            {
              backgroundColor: orbColor,
              borderColor: orbColor + "88",
              transform: [{ scale: pulse }],
              shadowColor: orbColor,
            },
          ]}
        >
          <View style={styles.micGlyph}>
            <View style={[styles.micCap, { borderColor: "#fff" }]} />
            <View style={[styles.micBody, { backgroundColor: "#fff" }]} />
          </View>
        </Animated.View>
      </Pressable>

      {(active || (state === "idle" && !wakeAvailable)) && (
        <Modal transparent visible animationType="fade" onRequestClose={() => {}}>
          <Pressable style={styles.modalBackdrop} onPress={() => void stopAssistant()}>
            <View
              style={[
                styles.card,
                {
                  bottom: bottom + 140,
                  backgroundColor: "rgba(10,4,20,0.92)",
                  borderColor: NEON.glow.red + "40",
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colorsFor(state).accent }]}>
                {STATE_LABELS[state]}
              </Text>

              {transcript && (
                <Text style={[styles.cardText, { color: "#e9e4f2" }]}>"{transcript}"</Text>
              )}
              {reply && <Text style={[styles.cardText, { color: "#e9e4f2" }]}>{reply}</Text>}
              {error && (
                <Text style={[styles.cardError, { color: colorsFor(state).danger }]}>{error}</Text>
              )}
              {!wakeAvailable && state !== "off" && (
                <Text style={[styles.cardHint, { color: "#9a93b0" }]}>
                  Microfone indisponível — verifique as permissões.
                </Text>
              )}
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

// Small helper — keep colors local to the component to avoid theme churn.
function colorsFor(state: AssistantState) {
  switch (state) {
    case "speaking":
    case "greeting":
      return { accent: "#3ddc97", success: "#3ddc97", danger: "#ff4d6d" };
    case "off":
      return { accent: "#3a3545", success: "#3a3545", danger: "#ff4d6d" };
    case "idle":
      return { accent: NEON.glow.red, success: NEON.glow.red, danger: "#ff4d6d" };
    default:
      return { accent: "#ff2d6f", success: "#3ddc97", danger: "#ff4d6d" };
  }
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: SPACING.lg,
    zIndex: 100,
  },
  fabOrb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 10,
  },
  micGlyph: {
    alignItems: "center",
    justifyContent: "center",
  },
  micCap: {
    width: 10,
    height: 6,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  micBody: {
    width: 14,
    height: 18,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  cardText: {
    fontSize: TYPOGRAPHY.md,
    lineHeight: 22,
  },
  cardError: {
    fontSize: TYPOGRAPHY.sm,
  },
  cardHint: {
    fontSize: TYPOGRAPHY.xs,
  },
});
