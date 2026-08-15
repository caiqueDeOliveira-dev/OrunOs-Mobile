import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";

// Deep link alvo do OAuth do Spotify (orun-os://spotify). A promise do
// expo-auth-session é resolvida internamente; esta rota só existe para o
// expo-router não exibir um 404 e devolver o usuário às configurações.
export default function SpotifyRedirectScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/settings");
    }, 400);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#080607",
      }}
    >
      <Text style={{ color: "#9CA3AF", fontSize: 15 }}>Conectando ao Spotify…</Text>
    </View>
  );
}
