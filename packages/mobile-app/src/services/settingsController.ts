import * as Linking from "expo-linking";
import { Platform } from "react-native";

export function settingsHandler(text: string): string | null {
  if (Platform.OS !== "android") return null;

  const normalized = text.toLowerCase().replace(/[.,!?;:]/g, "").trim();

  if (/\b(?:wifi|wi-fi|wi fi)\b/.test(normalized)) {
    if (/\b(?:liga|ativar|ativa|ligar|ligando)\b/.test(normalized)) {
      Linking.openURL("android.settings.WIFI_SETTINGS").catch(() => {});
      return "Abrindo configurações de WiFi.";
    }
    if (/\b(?:desliga|desativar|desativa|desligar|desligando)\b/.test(normalized)) {
      Linking.openURL("android.settings.WIFI_SETTINGS").catch(() => {});
      return "Abrindo WiFi. Desligue manualmente.";
    }
  }

  if (/\b(?:bluetooth|bluetoo|bluetti)\b/.test(normalized)) {
    if (/\b(?:liga|ativar|ativa|ligar|ligando)\b/.test(normalized)) {
      Linking.openURL("android.settings.BLUETOOTH_SETTINGS").catch(() => {});
      return "Abrindo configurações de Bluetooth.";
    }
    if (/\b(?:desliga|desativar|desativa|desligar|desligando)\b/.test(normalized)) {
      Linking.openURL("android.settings.BLUETOOTH_SETTINGS").catch(() => {});
      return "Abrindo Bluetooth. Desligue manualmente.";
    }
  }

  if (/\b(?:brilho|luminosidade)\b/.test(normalized)) {
    Linking.openURL("android.settings.DISPLAY_SETTINGS").catch(() => {});
    return "Abrindo configurações de brilho.";
  }

  if (/\b(?:volume|som|sons)\b/.test(normalized)) {
    Linking.openURL("android.settings.SOUND_SETTINGS").catch(() => {});
    return "Abrindo configurações de som.";
  }

  return null;
}
