import React from "react";
import { StyleSheet } from "react-native";
import { GlassCard } from "./GlassCard";

interface CardProps {
  title?: string;
  subtitle?: string;
  rightElement?: any;
  variant?: "default" | "elevated";
  children?: any;
  style?: any;
  onPress?: () => void;
}

export function Card({
  title,
  subtitle,
  rightElement,
  children,
  style,
  onPress,
}: CardProps) {
  return (
    <GlassCard
      title={title}
      subtitle={subtitle}
      rightElement={rightElement}
      children={children}
      style={style}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({});
