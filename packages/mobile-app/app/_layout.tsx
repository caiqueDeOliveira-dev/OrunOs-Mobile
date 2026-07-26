import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { useAuthStore } from "../src/stores/authStore";
import { Loader } from "../src/components/ui";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loading, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession().finally(() => {
      SplashScreen.hideAsync();
    });
  }, [restoreSession]);

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <Loader />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
