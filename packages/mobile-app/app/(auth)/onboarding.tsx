import React, { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../src/theme/tokens";
import { t } from "../../src/i18n";

const ONBOARDING_KEY = "orun-onboarding-done";

const STEPS = [
  { icon: "💬", titleKey: "tab.chat", descKey: "home.connected" },
  { icon: "🤖", titleKey: "tab.agents", descKey: "workspace.features" },
  { icon: "🎤", titleKey: "tab.voice", descKey: "voice.hintStart" },
  { icon: "⚡", titleKey: "automations.title", descKey: "workspace.automation.description" },
];

export async function shouldShowOnboarding(): Promise<boolean> {
  const done = await AsyncStorage.getItem(ONBOARDING_KEY);
  return done !== "true";
}

export async function completeOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
}

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { headerPadding } = useSafeArea();
  const router = useRouter();
  const [step, setStep] = useState(0);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      completeOnboarding();
      router.replace("/");
    }
  }, [step, router]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    completeOnboarding();
    router.replace("/");
  }, [router]);

  const current = STEPS[step];

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <View style={[styles.header, headerPadding]}>
        <Pressable onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>{t("common.close")}</Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={styles.icon}>{current.icon}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t(current.titleKey)}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>{t(current.descKey)}</Text>

        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === step ? colors.accent : colors.surfaceActive,
                  width: i === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.nextButton, { backgroundColor: colors.accent }]}
          onPress={handleNext}
        >
          <Text style={[styles.nextText, { color: colors.textInverted }]}>
            {step < STEPS.length - 1 ? t("common.confirm") : t("auth.signIn")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  skipText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
    padding: SPACING.sm,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.lg,
  },
  icon: {
    fontSize: 80,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: "center",
  },
  desc: {
    fontSize: TYPOGRAPHY.md,
    textAlign: "center",
    lineHeight: 22,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginTop: SPACING.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  nextButton: {
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
