import React from "react";
import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "../../src/stores/authStore";
import { Loader } from "../../src/components/ui";

export default function AuthLayout() {
  const { session, loading } = useAuthStore();

  if (loading) {
    return <Loader />;
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
