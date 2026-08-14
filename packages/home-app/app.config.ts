import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Orun Home",
  slug: "orun-home",
  scheme: "orun-home",
  version: "0.1.0",
  orientation: "default",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#050505",
  },
  android: {
    package: "com.orun.home",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#050505",
    },
    edgeToEdgeEnabled: true,
  },
  ios: {
    bundleIdentifier: "com.orun.home",
    supportsTablet: true,
    requireFullScreen: true,
  },
  plugins: [
    "expo-router",
    "expo-screen-orientation",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#050505",
        image: "./assets/splash.png",
        imageWidth: 220,
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
  ],
  extra: {
    eas: {
      projectId: "1426e091-0702-47ad-9703-482e85529e2c",
    },
    ...Object.fromEntries(
      Object.entries(process.env).filter(([k]) =>
        k.startsWith("EXPO_PUBLIC_"),
      ),
    ),
  },
});
