// Orun Home — HomeHampton avatar (ported from desktop workspace-home-ia/HomeHampton.tsx)
// Premium circular Hampton avatar: black wolf head, glowing red eyes, red ring
// that pulses while listening/thinking, waveform while speaking.

import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing, StyleSheet, Image, ImageSourcePropType } from "react-native";
import Svg, { Path, Ellipse, G, LinearGradient, Defs, Stop } from "react-native-svg";

export type HamptonState = "idle" | "listening" | "speaking" | "thinking";

const RED = "#C3002F";

export function HomeHampton({
  state,
  size = 190,
  image,
}: {
  state: HamptonState;
  size?: number;
  image?: ImageSourcePropType;
}) {
  const [tick, setTick] = useState(0);
  const listening = state === "listening";
  const thinking = state === "thinking";
  const speaking = state === "speaking";
  const active = state !== "idle";

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const dur = listening || thinking ? 1000 : speaking ? 1600 : 3500;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [state, pulse]);

  const glow = (listening || thinking ? 0.55 : speaking ? 0.42 : 0.28);
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.55] });
  const rippleScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.4] });
  const rippleOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const eyeOpL = 0.55 + Math.sin(tick * 0.14) * 0.4;
  const eyeOpR = 0.55 + Math.sin(tick * 0.14 + 0.6) * 0.4;

  const label = thinking ? "Pensando" : speaking ? "Falando" : listening ? "Ouvindo" : "Pronto";

  return (
    <View style={{ width: size, height: size + 22, alignItems: "center" }}>
      <View style={{ width: size, height: size }}>
        {/* Listening — expanding ripple rings */}
        {listening && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: size,
                borderWidth: 1,
                borderColor: "rgba(195,0,47,0.35)",
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />
        )}

        {/* Ambient glow halo */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -size * 0.1,
            left: -size * 0.1,
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: size * 0.6,
            backgroundColor: `rgba(195,0,47,${glow})`,
            opacity: 0.25,
          }}
        />

        {/* Luminous red ring */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -2,
            left: -2,
            width: size + 4,
            height: size + 4,
            borderRadius: size,
            borderWidth: 1,
            borderColor: `rgba(195,0,47,0.45)`,
            opacity: ringOpacity,
          }}
        />

        {/* Disc */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
            backgroundColor: "#0c0c0f",
            borderWidth: 1,
            borderColor: "#252525",
          }}
        >
          {image ? (
            <Image
              source={image}
              style={{ width: size, height: size }}
              resizeMode="cover"
            />
          ) : (
            <WolfFace size={size} eyeOpL={eyeOpL} eyeOpR={eyeOpR} tick={tick} />
          )}
        </View>

        {/* Speaking — waveform */}
        {speaking && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: size * 0.14,
              left: "50%",
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 3,
              transform: [{ translateX: -21 }],
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <View
                key={i}
                style={{
                  width: 3,
                  height: 4 + Math.abs(Math.sin((tick + i) * 0.28)) * 14,
                  backgroundColor: i % 2 === 0 ? RED : "#8B0021",
                  borderRadius: 2,
                  opacity: 0.75,
                }}
              />
            ))}
          </View>
        )}

        {/* Thinking — vertical beam */}
        {thinking && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -30,
              left: "50%",
              width: 2,
              height: 34,
              backgroundColor: RED,
              borderRadius: 1,
              opacity: 0.8,
              transform: [{ translateX: -1 }],
            }}
          />
        )}
      </View>

      {/* Status label */}
      <Text
        style={{
          marginTop: 6,
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 1.8,
          textTransform: "uppercase",
          color: active ? RED : "#A0A0A0",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function WolfFace({ size, eyeOpL, eyeOpR, tick }: { size: number; eyeOpL: number; eyeOpR: number; tick: number }) {
  const stroke = "#2a2a2f";
  const furGrad = (
    <Defs>
      <LinearGradient id="homeWolfFur" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#1e1e23" />
        <Stop offset="100%" stopColor="#0b0b0e" />
      </LinearGradient>
    </Defs>
  );

  return (
    <Svg viewBox="0 0 200 200" width={size} height={size}>
      {furGrad}
      {/* Ears */}
      <G>
        <Path d="M68 52 L46 10 L92 34 Z" fill="url(#homeWolfFur)" stroke={stroke} strokeWidth="1" />
        <Path d="M132 52 L154 10 L108 34 Z" fill="url(#homeWolfFur)" stroke={stroke} strokeWidth="1" />
        <Path d="M66 46 L56 22 L84 36 Z" fill="#0e0e11" />
        <Path d="M134 46 L144 22 L116 36 Z" fill="#0e0e11" />
      </G>
      {/* Head silhouette */}
      <Path
        d="M100 30 C88 30, 76 38, 68 50 C58 66, 50 86, 48 108 C46 132, 52 154, 64 170 C76 184, 88 190, 100 190 C112 190, 124 184, 136 170 C148 154, 154 132, 152 108 C150 86, 142 66, 132 50 C124 38, 112 30, 100 30 Z"
        fill="url(#homeWolfFur)"
        stroke={stroke}
        strokeWidth="1"
      />
      {/* Muzzle */}
      <Path
        d="M78 150 C78 164, 86 178, 100 178 C114 178, 122 164, 122 150 C122 142, 112 138, 100 138 C88 138, 78 142, 78 150 Z"
        fill="#16161a"
        stroke="#242428"
        strokeWidth="0.8"
      />
      {/* Cheek shading */}
      <Ellipse cx="64" cy="130" rx="16" ry="24" fill="#0a0a0d" opacity="0.35" />
      <Ellipse cx="136" cy="130" rx="16" ry="24" fill="#0a0a0d" opacity="0.35" />
      {/* Eyes — glowing red */}
      <Path d="M58 116 Q74 108, 90 116 Q74 124, 58 116 Z" fill="#08080a" stroke="rgba(195,0,47,0.45)" strokeWidth="1" />
      <Path d="M110 116 Q126 108, 142 116 Q126 124, 110 116 Z" fill="#08080a" stroke="rgba(195,0,47,0.45)" strokeWidth="1" />
      <Ellipse cx="74" cy="116" rx="5" ry="2.6" fill="#ff1f4d" opacity={eyeOpL} />
      <Ellipse cx="126" cy="116" rx="5" ry="2.6" fill="#ff1f4d" opacity={eyeOpR} />
      <Ellipse cx="74" cy="116" rx="2" ry="1.2" fill="#ffb3c2" opacity={0.7 + Math.sin(tick * 0.14) * 0.3} />
      <Ellipse cx="126" cy="116" rx="2" ry="1.2" fill="#ffb3c2" opacity={0.7 + Math.sin(tick * 0.14 + 0.6) * 0.3} />
      {/* Nose */}
      <Path d="M92 148 L100 143 L108 148 L100 155 Z" fill="#000000" stroke="rgba(195,0,47,0.4)" strokeWidth="0.8" />
      {/* Mouth */}
      <Path d="M86 164 Q100 172, 114 164" fill="none" stroke="#232327" strokeWidth="1.2" strokeLinecap="round" />
      {/* Fur texture */}
      <G stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" fill="none" strokeLinecap="round">
        <Path d="M84 96 Q90 92, 96 96" />
        <Path d="M104 96 Q110 92, 116 96" />
        <Path d="M80 60 Q84 56, 88 60" />
        <Path d="M112 60 Q116 56, 120 60" />
        <Path d="M52 128 Q58 126, 62 130" />
        <Path d="M138 130 Q142 126, 148 128" />
      </G>
    </Svg>
  );
}
