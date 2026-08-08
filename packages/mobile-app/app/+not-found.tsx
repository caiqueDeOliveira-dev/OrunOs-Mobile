import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../src/theme/ThemeProvider";
import { useSafeArea } from "../src/hooks/useSafeArea";
import { NEON, SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../src/theme/tokens";
import { NeonBackground } from "../src/components/ui";
import { t } from "../src/i18n";

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const { headerPadding } = useSafeArea();
  const router = useRouter();

  return (
    <NeonBackground>
      <View style={[styles.container, headerPadding]}>
        <Text style={[styles.emoji, { color: colors.accentGlow, textShadowColor: NEON.glow.red, textShadowRadius: 20 }]}>404</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t("notFound.title")}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {t("notFound.message")}
        </Text>
        <Pressable
          style={[styles.button, { backgroundColor: colors.accent, shadowColor: colors.accentGlow, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 8 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.replace("/");
          }}
        >
          <Text style={[styles.buttonText, { color: colors.textInverted }]}>{t("notFound.backToHome")}</Text>
        </Pressable>
      </View>
    </NeonBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  emoji: {
    fontSize: 64,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: "center",
  },
  title: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: "center",
  },
  message: {
    fontSize: TYPOGRAPHY.md,
    textAlign: "center",
  },
  button: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
