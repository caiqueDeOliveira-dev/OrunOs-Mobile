import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, StatusBar } from "react-native";

/**
 * Returns safe area insets that account for notches, home indicators,
 * and status bars across all devices. Never hardcode paddingTop: 60 —
 * use this hook instead.
 */
export function useSafeArea() {
  const insets = useSafeAreaInsets();

  return {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    // Convenience: header padding that clears the status bar + notch
    headerPadding: {
      paddingTop: Math.max(insets.top, StatusBar.currentHeight ?? 0),
    },
    // Convenience: tab bar padding that clears the home indicator
    tabBarPadding: {
      paddingBottom: insets.bottom,
    },
    // Keyboard vertical offset for KeyboardAvoidingView
    // On iOS, KeyboardAvoidingView needs the distance from the top of the screen
    // to the content area (header height). We use header height as the offset.
    keyboardOffset: Platform.OS === "ios" ? insets.top + 44 : 0,
  };
}
