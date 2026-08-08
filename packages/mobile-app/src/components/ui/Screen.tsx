import React from "react";
import { View, Text, StyleSheet, ScrollView, StyleProp, ViewStyle } from "react-native";
import { NeonBackground } from "./NeonBackground";
import { useSafeArea } from "../../hooks/useSafeArea";
import { useTheme } from "../../theme/ThemeProvider";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT } from "../../theme/tokens";

interface ScreenProps {
  title?: string;
  subtitle?: string;
  children?: any;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  headerRight?: any;
}

/**
 * Screen — consistent Neon/Glass screen shell: gradient backdrop,
 * safe-area header with title/subtitle, and optional scroll container.
 */
export function Screen({ title, subtitle, children, scroll = false, contentStyle, headerRight }: ScreenProps) {
  const { colors } = useTheme();
  const { headerPadding } = useSafeArea();

  const header =
    title || headerRight ? (
      <View style={[styles.header, headerPadding]}>
        <View style={styles.headerLeft}>
          {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}
          {subtitle && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
        </View>
        {headerRight}
      </View>
    ) : null;

  return (
    <NeonBackground>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]}>{children}</View>
      )}
    </NeonBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerLeft: { flex: 1 },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
});
