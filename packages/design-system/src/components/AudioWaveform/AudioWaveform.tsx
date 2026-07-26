import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export interface AudioWaveformProps {
  active?: boolean;
  bars?: number;
  color?: "accent" | "gold";
  className?: string;
}

interface BarSpec {
  height: number;
  duration: number;
}

function neutralBars(count: number): BarSpec[] {
  return Array.from({ length: count }, () => ({ height: 0.5, duration: 1.5 }));
}

/**
 * Animated bar visualizer — Voice Mode listening/speaking state, Music Studio
 * playback.
 *
 * The per-bar randomness (height, animation duration) is generated inside a
 * `useEffect`, not during render — calling `Math.random()` while rendering
 * is an impure operation React explicitly flags (react-hooks/purity), since
 * it can produce inconsistent output across renders/StrictMode's double
 * render. Render starts from stable, neutral values and the "shuffled"
 * look is applied once after mount instead.
 */
export function AudioWaveform({ active = true, bars = 24, color = "accent", className }: AudioWaveformProps) {
  const [barSpecs, setBarSpecs] = useState<BarSpec[]>(() => neutralBars(bars));

  useEffect(() => {
    // Intentional one-time visual randomization on mount/`bars` change —
    // not syncing with any external system, so the usual "derive it during
    // render instead" advice doesn't give a cleaner alternative here: the
    // whole point is *not* calling Math.random() during render (see the
    // module doc comment above). Cheap, runs at most twice under
    // StrictMode's double-invoke, and only affects decorative animation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBarSpecs(
      Array.from({ length: bars }, () => ({
        height: 0.2 + Math.random() * 0.8,
        duration: 1 + Math.random(),
      }))
    );
  }, [bars]);

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {barSpecs.map((bar, i) => (
        <motion.span
          key={i}
          className={cn("w-1 rounded-full", color === "accent" ? "bg-accent" : "bg-gold")}
          style={{ height: `${bar.height * 100}%` }}
          animate={active ? { scaleY: [0.4, 1, 0.3, bar.height + 0.2, 0.5] } : { scaleY: 0.15 }}
          transition={{ duration: bar.duration, repeat: Infinity, ease: "easeInOut", delay: i * 0.03 }}
        />
      ))}
    </div>
  );
}
