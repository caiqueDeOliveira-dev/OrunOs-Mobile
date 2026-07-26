import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../theme/ThemeProvider";
import { SPACING, TYPOGRAPHY, FONT_WEIGHT, RADIUS } from "../../theme/tokens";
import { t } from "../../i18n";

interface CameraCaptureProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
}

export function CameraCapture({ visible, onClose, onCapture }: CameraCaptureProps) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const cameraRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  async function handleCapture() {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        onCapture(photo.uri);
        onClose();
      }
    } catch (err) {
      console.warn("[camera] Capture failed:", err);
    }
  }

  function toggleFacing() {
    Haptics.selectionAsync();
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={[styles.permissionContainer, { backgroundColor: colors.bgBase }]}>
          <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
            {t("camera.title")}
          </Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            {t("camera.permission")}
          </Text>
          <Pressable
            style={[styles.permissionButton, { backgroundColor: colors.accent }]}
            onPress={requestPermission}
          >
            <Text style={[styles.permissionButtonText, { color: colors.textInverted }]}>
              {t("common.confirm")}
            </Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.textMuted }]}>{t("common.cancel")}</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          onCameraReady={() => setReady(true)}
        />

        <View style={[styles.controls, { backgroundColor: colors.bgBase }]}>
          <Pressable
            style={[styles.controlButton, { backgroundColor: colors.surface }]}
            onPress={onClose}
          >
            <Text style={[styles.controlText, { color: colors.textPrimary }]}>
              {t("common.close")}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.captureButton,
              { borderColor: colors.textPrimary },
              !ready && { opacity: 0.4 },
            ]}
            onPress={handleCapture}
            disabled={!ready}
          >
            <View style={[styles.captureInner, { backgroundColor: colors.textPrimary }]} />
          </Pressable>

          <Pressable
            style={[styles.controlButton, { backgroundColor: colors.surface }]}
            onPress={toggleFacing}
          >
            <Text style={[styles.controlText, { color: colors.textPrimary }]}>🔄</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  controlButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    minWidth: 80,
    alignItems: "center",
  },
  controlText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  permissionTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  permissionText: {
    fontSize: TYPOGRAPHY.md,
    textAlign: "center",
  },
  permissionButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  permissionButtonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  cancelText: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: SPACING.sm,
  },
});
