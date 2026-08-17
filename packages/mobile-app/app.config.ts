import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Orun OS",
  slug: "orun-os",
  version: "0.2.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  backgroundColor: "#080607",
  scheme: "orun-os",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#080607",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.orun.os",
    infoPlist: {
      NSFaceIDUsageDescription:
        "Use Face ID para acessar o Orun OS rapidamente.",
      NSCameraUsageDescription:
        "Câmera para enviar fotos aos agentes.",
      NSMicrophoneUsageDescription: "Microfone para entrada de voz.",
      NSSpeechRecognitionUsageDescription:
        "Reconhecimento de fala para conversas por voz.",
    },
  },
  android: {
    package: "com.orun.os",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#080607",
    },
    permissions: [
      "CAMERA",
      "RECORD_AUDIO",
      "USE_BIOMETRIC",
      "USE_FINGERPRINT",
      "android.permission.RECORD_AUDIO",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.USE_BIOMETRIC",
      "android.permission.USE_FINGERPRINT",
      "android.permission.CAMERA",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.WAKE_LOCK",
    ],
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-av",
    [
      "expo-local-authentication",
      {
        faceIDPermission:
          "Permitir Face ID para acessar o Orun OS.",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "Permitir câmera para enviar fotos aos agentes.",
      },
    ],
    "expo-background-fetch",
    "./modules/voice-tile/plugin",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "45c031b2-4383-48cc-ad05-5d15a2f0ead8",
    },
    ...Object.fromEntries(
      Object.entries(process.env).filter(([k]) =>
        k.startsWith("EXPO_PUBLIC_"),
      ),
    ),
  },
};

export default config;
