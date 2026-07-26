import React, { Component, ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../theme/tokens";
import { captureError } from "../../services/sentryService";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureError(error, { componentStack: errorInfo.componentStack });
  }

  handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>{this.props.fallbackTitle ?? "Algo deu errado"}</Text>
          <Text style={styles.message}>
            {this.props.fallbackMessage ?? this.state.error?.message ?? "Ocorreu um erro inesperado."}
          </Text>
          <Pressable
            style={styles.button}
            onPress={this.handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
          >
            <Text style={styles.buttonText}>Tentar de novo</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#080607",
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  icon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: "#e8e6e3",
    textAlign: "center",
  },
  message: {
    fontSize: TYPOGRAPHY.sm,
    color: "#888785",
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: "#C0001A",
    borderRadius: RADIUS.md,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: "#ffffff",
  },
});
