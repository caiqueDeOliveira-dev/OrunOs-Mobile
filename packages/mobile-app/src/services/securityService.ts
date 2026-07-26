import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Haptics from "expo-haptics";

let isDeviceRooted = false;

export async function checkDeviceSecurity(): Promise<{
  rooted: boolean;
  warning: string | null;
}> {
  if (Platform.OS === "android" || Platform.OS === "ios") {
    try {
      isDeviceRooted = await Device.isRootedExperimentalAsync();
    } catch {
      isDeviceRooted = false;
    }
  }

  return {
    rooted: isDeviceRooted,
    warning: isDeviceRooted
      ? Platform.OS === "ios"
        ? "Este dispositivo parece estar com jailbreak. Algumas funcionalidades podem ser limitadas por segurança."
        : "Este dispositivo parece estar com root. Algumas funcionalidades podem ser limitadas por segurança."
      : null,
  };
}

export function isRooted(): boolean {
  return isDeviceRooted;
}

export async function showSecurityWarning(): Promise<boolean> {
  const { Alert } = require("react-native");
  return new Promise((resolve) => {
    Alert.alert(
      "Aviso de Segurança",
      "Detectamos que este dispositivo pode estar comprometido (root/jailbreak). " +
        "Use o Orun OS por sua conta e risco. Deseja continuar?",
      [
        {
          text: "Sair",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Continuar",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resolve(true);
          },
        },
      ]
    );
  });
}
