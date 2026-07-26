import { Redirect } from "expo-router";
import { useAuthStore } from "../src/stores/authStore";

export default function Index() {
  const { session } = useAuthStore();

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Redirect href="/(tabs)" />;
}
