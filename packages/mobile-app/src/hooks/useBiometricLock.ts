import { useState, useEffect, useCallback } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { t } from "../i18n";

const BIOMETRIC_KEY = "orun-biometric-enabled";
const BIOMETRIC_PROMPTED_KEY = "orun-biometric-session-prompted";

export function useBiometricLock() {
  const [isLocked, setIsLocked] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkBiometric();
  }, []);

  async function checkBiometric() {
    try {
      const stored = await AsyncStorage.getItem(BIOMETRIC_KEY);
      const alreadyPrompted = await AsyncStorage.getItem(BIOMETRIC_PROMPTED_KEY);

      if (stored !== "true" || alreadyPrompted === "true") {
        setIsLocked(false);
        setChecking(false);
        return;
      }

      setBiometricEnabled(true);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsLocked(false);
        setChecking(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("settings.biometricPrompt"),
        cancelLabel: t("common.cancel"),
        disableDeviceFallback: false,
      });

      await AsyncStorage.setItem(BIOMETRIC_PROMPTED_KEY, "true");
      setIsLocked(!result.success);
      setChecking(false);
    } catch {
      setIsLocked(false);
      setChecking(false);
    }
  }

  const unlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  return { isLocked, biometricEnabled, checking, unlock };
}
