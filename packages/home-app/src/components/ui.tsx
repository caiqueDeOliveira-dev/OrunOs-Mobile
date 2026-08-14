// Orun Home — shared premium UI components (ported from desktop premium.tsx).
// Uses the palette in theme/premium.ts so the tablet looks identical to the
// desktop Home IA workspace.

import React from "react";
import { View, Text, Pressable, StyleSheet, type ViewStyle, type TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { P, RADIUS, TYPE, FW, GLOW } from "../theme/premium";

export type Tone = "ok" | "err" | "warn" | "info" | "violet" | "neutral";

export function toneColor(tone: Tone): string {
  switch (tone) {
    case "ok":
      return P.success;
    case "err":
      return P.error;
    case "warn":
      return P.alert;
    case "info":
      return P.info;
    case "violet":
      return P.violet;
    default:
      return P.sub;
  }
}

export function Card({
  children,
  style,
  onPress,
  hover = false,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  hover?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        hover && pressed && { transform: [{ scale: 0.985 }] },
        onPress && { cursor: "pointer" },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Panel({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function PageHeader({
  icon,
  title,
  subtitle,
  onBack,
  actions,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <View style={styles.pageHeader}>
      {onBack && (
        <Pressable onPress={onBack} style={({ pressed }) => [styles.backBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
          <Ionicons name="arrow-back" size={18} color={P.sub} />
        </Pressable>
      )}
      <View style={styles.pageHeaderIcon}>
        <Ionicons name={icon} size={20} color={P.primary} />
      </View>
      <View style={styles.pageHeaderText}>
        <Text style={styles.pageHeaderTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.pageHeaderSub} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {actions && <View style={styles.pageHeaderActions}>{actions}</View>}
    </View>
  );
}

export function SectionHeader({
  icon,
  title,
  right,
  onPress,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Pressable onPress={onPress} disabled={!onPress} style={styles.sectionHeaderLeft}>
        {icon && <Ionicons name={icon} size={14} color={P.primary} />}
        <Text style={styles.sectionHeaderTitle} numberOfLines={1}>
          {title}
        </Text>
        {onPress && <Ionicons name="chevron-forward" size={12} color={P.dim} />}
      </Pressable>
      {right}
    </View>
  );
}

export function StatCard({
  icon,
  label,
  value,
  status,
  tone = "neutral",
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  status?: string;
  tone?: Tone;
  onPress?: () => void;
}) {
  const c = toneColor(tone);
  return (
    <Card hover onPress={onPress} style={styles.statCard}>
      <View style={styles.statLeft}>
        <View style={styles.statIcon}>
          <Ionicons name={icon} size={16} color={P.primary} />
        </View>
        <View style={styles.statTextWrap}>
          <Text style={styles.statLabel} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {value}
          </Text>
        </View>
      </View>
      {status && (
        <View style={styles.statStatus}>
          <View style={[styles.dot, { backgroundColor: c }]} />
          <Text style={[styles.statStatusText, { color: c }]} numberOfLines={1}>
            {status}
          </Text>
        </View>
      )}
    </Card>
  );
}

export function PrimaryButton({
  children,
  onPress,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.primaryBtn, pressed && !disabled && { transform: [{ scale: 0.97 }] }, disabled && styles.disabled, style]}
    >
      {children}
    </Pressable>
  );
}

export function GhostButton({
  children,
  onPress,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.ghostBtn, pressed && !disabled && { transform: [{ scale: 0.97 }] }, disabled && styles.disabled, style]}
    >
      {children}
    </Pressable>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  const c = toneColor(tone);
  return (
    <View style={[styles.badge, { backgroundColor: `${c}1F`, borderColor: `${c}33` }]}>
      <View style={[styles.dotSmall, { backgroundColor: c }]} />
      <Text style={[styles.badgeText, { color: c }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onChange}
      disabled={disabled}
      style={[styles.toggle, { backgroundColor: on ? P.success : P.card2, borderColor: on ? "transparent" : P.borderHi }]}
    >
      <View style={[styles.toggleKnob, { left: on ? 20 : 3 }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: P.card,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: RADIUS.lg,
  },
  panel: {
    backgroundColor: P.panel,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: RADIUS.lg,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.card,
    borderWidth: 1,
    borderColor: P.border,
  },
  pageHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GLOW.primarySoft,
  },
  pageHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  pageHeaderTitle: {
    color: P.text,
    fontSize: TYPE.md,
    fontWeight: FW.semibold,
  },
  pageHeaderSub: {
    color: P.sub,
    fontSize: TYPE.xs - 1,
    marginTop: 2,
  },
  pageHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionHeaderTitle: {
    color: P.text,
    fontSize: TYPE.xs,
    fontWeight: FW.semibold,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  statLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.card2,
  },
  statTextWrap: {
    minWidth: 0,
    flexShrink: 1,
  },
  statLabel: {
    color: P.dim,
    fontSize: 9,
    fontWeight: FW.semibold,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  statValue: {
    color: P.text,
    fontSize: TYPE.sm,
    fontWeight: FW.semibold,
    marginTop: 2,
  },
  statStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  statStatusText: {
    fontSize: 9,
    fontWeight: FW.medium,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: P.primary,
  },
  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: P.card,
    borderWidth: 1,
    borderColor: P.border,
  },
  disabled: {
    opacity: 0.5,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: FW.semibold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
  },
  toggleKnob: {
    position: "absolute",
    top: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
});

export const textStyles: Record<string, TextStyle> = {
  h1: { color: P.text, fontSize: TYPE.xxl, fontWeight: FW.semibold, lineHeight: 30 },
  h2: { color: P.text, fontSize: TYPE.xl, fontWeight: FW.semibold },
  sub: { color: P.sub, fontSize: TYPE.xs },
  dim: { color: P.dim, fontSize: TYPE.xs },
};
