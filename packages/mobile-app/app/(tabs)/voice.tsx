import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { NEON, SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../src/theme/tokens";
import { t } from "../../src/i18n";
import {
  requestMicPermission,
  startRecording,
  stopRecording,
  transcribeAudio,
  speak,
  stopSpeaking,
} from "../../src/services/voiceService";
import { getAssistantSnapshot, stopAssistant } from "../../src/services/voiceAssistant";
import { executeVoiceCommand } from "../../src/services/commandRouter";
import { NeonBackground } from "../../src/components/ui";

type VoiceState = "idle" | "recording" | "processing" | "transcribing" | "speaking" | "error";

const WAVE_HEIGHTS = [
  { min: 6, max: 16 },
  { min: 10, max: 24 },
  { min: 8, max: 20 },
  { min: 12, max: 28 },
  { min: 7, max: 18 },
  { min: 11, max: 26 },
  { min: 9, max: 22 },
];

export default function VoiceScreen() {
  const { colors } = useTheme();
  const { headerPadding } = useSafeArea();
  const [state, setState] = useState<VoiceState>("idle");
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [ttsText, setTtsText] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeaking().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (state === "recording" || state === "speaking") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => {
        pulse.stop();
        pulseAnim.setValue(1);
      };
    }
  }, [state]);

  async function handleStartRecording() {
    const granted = await requestMicPermission();
    if (!granted) {
      setErrorMessage(t("voice.permission"));
      setState("error");
      return;
    }

    try {
      // The always-listening assistant owns the mic; stop it before recording
      // manually so expo-av never has two Recordings prepared at once.
      if (getAssistantSnapshot().state !== "off") {
        await stopAssistant();
      }
      await startRecording();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setState("recording");
      setDuration(0);
      setErrorMessage(null);
      setTranscript(null);
      setTtsText(null);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setErrorMessage(t("voice.error"));
      setState("error");
    }
  }

  async function handleStopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState("transcribing");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const { uri } = await stopRecording();
      const result = await transcribeAudio(uri);

      if (!mountedRef.current) return;

      if (result?.text) {
        setTranscript(result.text);
        setState("processing");

        try {
          const { reply } = await executeVoiceCommand(result.text);
          if (!mountedRef.current) return;
          setTtsText(reply);
          setState("speaking");
          await speak(reply);
          setState("idle");
        } catch {
          if (!mountedRef.current) return;
          setErrorMessage(t("voice.error"));
          setState("error");
        }
      } else {
        setErrorMessage(t("voice.transcriptionFailed"));
        setState("error");
      }
    } catch (err) {
      setErrorMessage(t("voice.error"));
      setState("error");
    }
  }

  async function handleStopTTS() {
    await stopSpeaking();
    setState("idle");
    setTtsText(null);
  }

  function handlePress() {
    if (state === "idle" || state === "error") {
      handleStartRecording();
    } else if (state === "recording") {
      handleStopRecording();
    } else if (state === "speaking") {
      handleStopTTS();
    }
  }

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const stateConfig: Record<VoiceState, { label: string; color: string }> = {
    idle: { label: t("voice.tapToRecord"), color: colors.textMuted },
    recording: { label: t("voice.recording"), color: colors.accent },
    processing: { label: t("voice.processing"), color: colors.warning },
    transcribing: { label: t("voice.transcribing"), color: colors.warning },
    speaking: { label: t("voice.speaking"), color: colors.success },
    error: { label: errorMessage || t("voice.error"), color: colors.danger },
  };

  const config = stateConfig[state];

  return (
    <NeonBackground style={styles.container}>
      <View
        style={[
          styles.header,
          headerPadding,
          {
            backgroundColor: "rgba(10,4,20,0.55)",
            borderBottomColor: NEON.glow.red + "40",
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t("voice.title")}</Text>
      </View>

      <View style={styles.center}>
        <Pressable
          onPress={handlePress}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Animated.View
            style={[
              styles.orb,
              {
                backgroundColor:
                  state === "recording"
                    ? colors.accent
                    : state === "speaking"
                      ? colors.success
                      : "rgba(15,7,24,0.6)",
                shadowColor: colors.accentGlow,
                borderWidth: 2,
                borderColor:
                  state === "recording"
                    ? colors.accent
                    : state === "speaking"
                      ? colors.success
                      : NEON.glow.red + "66",
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[...NEON.gradient.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.orbInner}
            />
          </Animated.View>
        </Pressable>

        <Text style={[styles.stateLabel, { color: config.color }]}>{config.label}</Text>

        {state === "recording" && (
          <>
            <Text style={[styles.timer, { color: colors.textSecondary }]}>
              {formatDuration(duration)}
            </Text>
            <View style={styles.waveform}>
              {WAVE_HEIGHTS.map((h, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      backgroundColor: colors.accent,
                      height: pulseAnim.interpolate({
                        inputRange: [1, 1.15],
                        outputRange: [h.min, h.max],
                      }),
                    },
                  ]}
                />
              ))}
            </View>
          </>
        )}

        {state === "transcribing" && (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            {t("voice.transcribing")}
          </Text>
        )}

        {state === "processing" && transcript && (
          <View style={[styles.transcriptCard, { backgroundColor: "rgba(15,7,24,0.55)", borderColor: NEON.glow.red + "30" }]}>
            <Text style={[styles.transcriptLabel, { color: colors.textSecondary }]}>{t("voice.youSaid")}</Text>
            <Text style={[styles.transcriptText, { color: colors.textPrimary }]}>{transcript}</Text>
          </View>
        )}

        {state === "speaking" && ttsText && (
          <View style={[styles.transcriptCard, { backgroundColor: colors.success + "10", borderColor: colors.success + "30" }]}>
            <Text style={[styles.transcriptLabel, { color: colors.success }]}>{t("voice.response")}</Text>
            <Text style={[styles.transcriptText, { color: colors.textPrimary }]}>{ttsText}</Text>
          </View>
        )}

        {(state === "idle" || state === "error") && (
          <View style={styles.hints}>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {t("voice.hintStart")}
            </Text>
          </View>
        )}
      </View>
    </NeonBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xl,
    paddingBottom: 100,
  },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  orbInner: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  stateLabel: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: FONT_WEIGHT.medium,
  },
  timer: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: FONT_WEIGHT.semibold,
    fontVariant: ["tabular-nums"],
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 40,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  hints: {
    alignItems: "center",
    gap: SPACING.xs,
  },
  hint: {
    fontSize: TYPOGRAPHY.sm,
    textAlign: "center",
  },
  transcriptCard: {
    marginHorizontal: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  transcriptLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: FONT_WEIGHT.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  transcriptText: {
    fontSize: TYPOGRAPHY.md,
    lineHeight: 22,
  },
});
