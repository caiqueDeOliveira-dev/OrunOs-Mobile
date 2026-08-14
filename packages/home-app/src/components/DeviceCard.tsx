// Orun Home — device card (toggle/brightness/temp/lock controls)

import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { P, RADIUS, TYPE, FW } from "../theme/premium";
import type { HomeDevice } from "../types";

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  Lightbulb: "bulb",
  Lamp: "flashlight",
  Snowflake: "snow",
  Tv: "tv",
  Radar: "pulse",
  Bed: "bed",
  Thermometer: "thermometer",
  ThermometerSun: "thermometer",
  Droplets: "water",
  Lock: "lock-closed",
  ChefHat: "restaurant",
  Coffee: "cafe",
  Refrigerator: "cube",
  Flame: "flame",
  Car: "car",
  DoorOpen: "open",
  Cctv: "videocam",
  Circle: "ellipse",
};

export function DeviceCard({
  device,
  roomName,
  onToggle,
  onBrightness,
  onTemp,
  onLock,
}: {
  device: HomeDevice;
  roomName?: string;
  onToggle: () => void;
  onBrightness?: (v: number) => void;
  onTemp?: (v: number) => void;
  onLock?: (locked: boolean) => void;
}) {
  const isLight = device.type === "light";
  const isClimate = device.type === "climate";
  const isLock = device.type === "lock" || device.type === "cover";
  const isSensor = device.type === "sensor" || device.type === "binary_sensor";
  const on = device.state;

  const icon = ICON_MAP[device.icon] || "ellipse";

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: on ? "rgba(195,0,47,0.16)" : P.card2 }]}>
          <Ionicons name={icon} size={18} color={on ? P.primary : P.sub} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {device.name}
          </Text>
          <Text style={styles.value} numberOfLines={1}>
            {isLock && typeof device.value === "string"
              ? device.value
              : isClimate
                ? `${device.temperature ?? device.value}°C`
                : String(device.value)}
          </Text>
          {roomName ? <Text style={styles.room}>{roomName}</Text> : null}
        </View>
        {!isSensor && (
          <Pressable
            onPress={isLock ? (device.locked ? () => onLock?.(false) : () => onLock?.(true)) : onToggle}
            style={[styles.toggleBtn, { backgroundColor: on ? P.primary : P.card2 }]}
          >
            <Ionicons
              name={isLock ? (device.locked ? "lock-closed" : "lock-open") : "power"}
              size={14}
              color={on ? "#fff" : P.sub}
            />
          </Pressable>
        )}
      </View>

      {isLight && typeof onBrightness === "function" && device.brightness != null && (
        <View style={styles.sliderRow}>
          <Ionicons name="sunny" size={12} color={P.dim} />
          <Slider
            style={{ flex: 1, height: 28 }}
            minimumValue={0}
            maximumValue={100}
            value={device.brightness}
            onSlidingComplete={(v) => onBrightness(Math.round(v))}
            minimumTrackTintColor={P.primary}
            maximumTrackTintColor={P.card2}
            thumbTintColor={Platform.OS === "ios" ? P.primary : undefined}
          />
          <Text style={styles.sliderVal}>{device.brightness}%</Text>
        </View>
      )}

      {isClimate && typeof onTemp === "function" && (
        <View style={styles.sliderRow}>
          <Ionicons name="thermometer" size={12} color={P.dim} />
          <Slider
            style={{ flex: 1, height: 28 }}
            minimumValue={16}
            maximumValue={30}
            step={0.5}
            value={device.temperature ?? 23}
            onSlidingComplete={(v) => onTemp(v)}
            minimumTrackTintColor={P.info}
            maximumTrackTintColor={P.card2}
            thumbTintColor={Platform.OS === "ios" ? P.info : undefined}
          />
          <Text style={styles.sliderVal}>{device.temperature ?? device.value}°</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: P.card,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: RADIUS.lg,
    padding: 14,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: P.text,
    fontSize: TYPE.sm,
    fontWeight: FW.medium,
  },
  value: {
    color: P.sub,
    fontSize: TYPE.xs,
    marginTop: 2,
  },
  room: {
    color: P.dim,
    fontSize: 9,
    marginTop: 2,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  sliderVal: {
    color: P.sub,
    fontSize: TYPE.xs,
    minWidth: 34,
    textAlign: "right",
  },
});
