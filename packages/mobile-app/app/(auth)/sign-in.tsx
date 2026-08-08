import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Image } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { NEON, SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../src/theme/tokens";
import { Input, NeonBackground } from "../../src/components/ui";
import { useAuthStore } from "../../src/stores/authStore";
import { t } from "../../src/i18n";

export default function SignInScreen() {
  const { colors } = useTheme();
  const { headerPadding, keyboardOffset } = useSafeArea();
  const { signIn, loading, error } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardOffset}
    >
      <NeonBackground style={styles.inner}>
        <View style={headerPadding} />
        <View style={styles.center}>
          <View style={[styles.iconWrap, { borderColor: NEON.glow.red + "55", shadowColor: NEON.glow.red, shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 8 }]}>
            <Image
              source={require("../../assets/icon.png")}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t("auth.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("auth.subtitle")}
          </Text>

          <View style={styles.form}>
            <Input
              placeholder={t("auth.email")}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              placeholder={t("auth.password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: "rgba(15,7,24,0.6)",
                  borderColor: NEON.glow.red + "66",
                  shadowColor: NEON.glow.red,
                  shadowOpacity: loading ? 0.2 : 0.5,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 8,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              onPress={() => signIn(email, password)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.accentGlow} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.accentGlow }]}>{t("auth.signIn")}</Text>
              )}
            </Pressable>
          </View>

          <Pressable onPress={() => router.replace("/(auth)/sign-up")}>
            <Text style={[styles.link, { color: colors.accentGlow }]}>
              {t("auth.noAccount")} {t("auth.signUp")}
            </Text>
          </Pressable>
        </View>
      </NeonBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xxl,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  icon: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    marginBottom: SPACING.xl,
    textAlign: "center",
  },
  form: {
    width: "100%",
    gap: SPACING.sm,
  },
  error: {
    fontSize: TYPOGRAPHY.sm,
    textAlign: "center",
    marginTop: SPACING.xs,
  },
  button: {
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.md,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  link: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: SPACING.xl,
  },
});
