import { TextStyle } from "react-native";

/**
 * Props to spread on <Text> components to limit font scaling.
 * Pass directly as: <Text {...textScalingProps(1.3)}>...</Text>
 */
export function textScalingProps(maxFontSizeMultiplier = 1.3) {
  return { allowFontScaling: true, maxFontSizeMultiplier } as const;
}
