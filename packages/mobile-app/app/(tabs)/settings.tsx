import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Switch, StyleSheet, Alert } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useSafeArea } from "../../src/hooks/useSafeArea";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../src/theme/tokens";
import { useAuthStore } from "../../src/stores/authStore";
import { setLocale, getLocale, t, type Locale } from "../../src/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeName } from "../../src/theme/tokens";

const THEMES: { name: ThemeName; label: string }[] = [
  { name: "bloodred", label: "Blood Red" },
  { name: "dark", label: "Dark" },
  { name: "premium", label: "Premium" },
  { name: "minimal", label: "Minimal" },
];

const LANGUAGES: { code: Locale; label: string }[] = [
  { code: "pt-BR", label: "Português" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

const BIOMETRIC_KEY = "orun-biometric-enabled";
const NOTIFICATIONS_KEY = "orun-notifications-enabled";
const LANGUAGE_KEY = "orun-language";

export default function SettingsScreen() {
  const { colors, themeName, setTheme, themeMode, setThemeMode } = useTheme();
  const { headerPadding } = useSafeArea();
  const { signOut } = useAuthStore();
  const router = useRouter();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentLang, setCurrentLang] = useState<Locale>(getLocale());

  useEffect(() => {
    AsyncStorage.getItem(BIOMETRIC_KEY).then((v) => setBiometricEnabled(v === "true"));
    AsyncStorage.getItem(NOTIFICATIONS_KEY).then((v) => {
      if (v !== null) setNotificationsEnabled(v === "true");
    });
    AsyncStorage.getItem(LANGUAGE_KEY).then((v) => {
      if (v && LANGUAGES.some((l) => l.code === v)) {
        setCurrentLang(v as Locale);
        setLocale(v as Locale);
      }
    });
  }, []);

  async function toggleBiometric(next: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (next) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert(t("settings.biometricUnavailable"), t("settings.biometricNotSupported"));
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("settings.biometricPrompt"),
      });
      if (!result.success) return;
    }
    setBiometricEnabled(next);
    AsyncStorage.setItem(BIOMETRIC_KEY, String(next));
  }

  async function toggleNotifications(next: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (next) {
      Alert.alert(t("settings.notificationsDenied"), t("settings.notificationsDeniedBody"));
      return;
    }
    setNotificationsEnabled(next);
    AsyncStorage.setItem(NOTIFICATIONS_KEY, String(next));
  }

  function handleLanguageChange(code: Locale) {
    Haptics.selectionAsync();
    setCurrentLang(code);
    setLocale(code);
    AsyncStorage.setItem(LANGUAGE_KEY, code);
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgBase }]} contentContainerStyle={styles.content}>
      <View style={headerPadding}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t("settings.title")}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "14" }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t("settings.theme")}</Text>
        <View style={styles.themeGrid}>
          {THEMES.map((th) => (
            <Pressable
              key={th.name}
              style={[
                styles.themeOption,
                {
                  backgroundColor: themeName === th.name ? colors.accent : colors.bgSunken,
                  borderColor: themeName === th.name ? colors.accent : colors.surfaceBorder + "20",
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setTheme(th.name);
              }}
            >
              <Text
                style={[
                  styles.themeLabel,
                  { color: themeName === th.name ? colors.textInverted : colors.textPrimary },
                ]}
              >
                {th.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[
              styles.themeOption,
              {
                backgroundColor: themeMode === "system" ? colors.accent : colors.bgSunken,
                borderColor: themeMode === "system" ? colors.accent : colors.surfaceBorder + "20",
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setThemeMode("system");
            }}
          >
            <Text
              style={[
                styles.themeLabel,
                { color: themeMode === "system" ? colors.textInverted : colors.textPrimary },
              ]}
            >
              Auto
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "14" }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t("settings.language")}</Text>
        <View style={styles.themeGrid}>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              style={[
                styles.themeOption,
                {
                  backgroundColor: currentLang === lang.code ? colors.accent : colors.bgSunken,
                  borderColor: currentLang === lang.code ? colors.accent : colors.surfaceBorder + "20",
                },
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text
                style={[
                  styles.themeLabel,
                  { color: currentLang === lang.code ? colors.textInverted : colors.textPrimary },
                ]}
              >
                {lang.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "14" }]}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t("settings.notifications")}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: colors.surfaceActive, true: colors.accent }}
            thumbColor={colors.textPrimary}
          />
        </View>
        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder + "14" }]} />
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t("settings.biometric")}</Text>
          <Switch
            value={biometricEnabled}
            onValueChange={toggleBiometric}
            trackColor={{ false: colors.surfaceActive, true: colors.accent }}
            thumbColor={colors.textPrimary}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "14" }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t("settings.about")}</Text>
        <Text style={[styles.version, { color: colors.textMuted }]}>{t("settings.version", { version: "0.2.0" })}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder + "14" }]}>
        <Pressable
          style={styles.row}
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/providers");
          }}
          accessibilityRole="button"
          accessibilityLabel={t("providers.title")}
        >
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t("providers.title")}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <Pressable
        style={[styles.signOutButton, { borderColor: colors.danger + "40" }]}
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert(
            t("settings.signOut"),
            t("settings.signOutConfirm"),
            [
              { text: t("common.cancel"), style: "cancel" },
              { text: t("settings.signOut"), style: "destructive", onPress: () => signOut() },
            ]
          );
        }}
        accessibilityRole="button"
        accessibilityLabel={t("settings.signOut")}
      >
        <Text style={[styles.signOutText, { color: colors.danger }]}>{t("settings.signOut")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: SPACING.xl,
    paddingTop: 0,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: FONT_WEIGHT.bold,
    paddingBottom: SPACING.lg,
  },
  section: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  themeOption: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minWidth: 80,
    alignItems: "center",
  },
  themeLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: {
    fontSize: TYPOGRAPHY.md,
  },
  divider: {
    height: 1,
  },
  version: {
    fontSize: TYPOGRAPHY.sm,
  },
  signOutButton: {
    alignItems: "center",
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: SPACING.lg,
  },
  signOutText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: FONT_WEIGHT.medium,
  },
});
