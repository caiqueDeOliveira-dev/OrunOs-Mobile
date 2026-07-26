import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Image } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../src/theme/tokens";
import { Input } from "../../src/components/ui";
import { useAuthStore } from "../../src/stores/authStore";
import { t } from "../../src/i18n";

export default function SignUpScreen() {
  const { colors } = useTheme();
  const { headerPadding, keyboardOffset } = useSafeArea();
  const { signUp, loading, error } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSignUp() {
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError(t("auth.fillAllFields"));
      return;
    }

    if (password !== confirmPassword) {
      setLocalError(t("auth.passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      setLocalError(t("auth.passwordTooShort"));
      return;
    }

    const err = await signUp(email.trim(), password);
    if (!err) {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
        <View style={[styles.inner, headerPadding]}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t("auth.checkEmail")}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("auth.checkEmailBody")}
          </Text>
          <Pressable
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={() => router.replace("/(auth)/sign-in")}
          >
            <Text style={[styles.buttonText, { color: colors.textInverted }]}>{t("auth.signIn")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bgBase }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardOffset}
    >
      <View style={[styles.inner, headerPadding]}>
        <Image
          source={require("../../assets/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t("auth.signUp")}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t("auth.signUpSubtitle")}
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
          <Input
            placeholder={t("auth.confirmPassword")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {(localError || error) && (
            <Text style={[styles.error, { color: colors.danger }]}>{localError || error}</Text>
          )}

          <Pressable
            style={[
              styles.button,
              {
                backgroundColor: colors.accent,
                opacity: loading ? 0.6 : 1,
              },
            ]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverted} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.textInverted }]}>{t("auth.signUp")}</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => router.replace("/(auth)/sign-in")}>
          <Text style={[styles.link, { color: colors.accent }]}>
            {t("auth.hasAccount")} {t("auth.signIn")}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xxl,
  },
  icon: {
    width: 80,
    height: 80,
    marginBottom: SPACING.xl,
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
