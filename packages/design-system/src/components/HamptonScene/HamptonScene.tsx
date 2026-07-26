import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere, Sparkles as DreiSparkles } from "@react-three/drei";
import * as THREE from "three";
import { Loader } from "../Loader";

export type HamptonMood = "idle" | "listening" | "thinking" | "speaking";

export interface HamptonSceneProps {
  mood?: HamptonMood;
  size?: number; // px, square canvas
  className?: string;
}

const moodConfig: Record<HamptonMood, { speed: number; distort: number; color: string }> = {
  idle: { speed: 1.2, distort: 0.35, color: "#a8202a" },
  listening: { speed: 2.2, distort: 0.5, color: "#c42832" },
  thinking: { speed: 3.2, distort: 0.65, color: "#dc323c" },
  speaking: { speed: 4.2, distort: 0.8, color: "#e5424c" },
};

function HamptonCore({ mood }: { mood: HamptonMood }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const config = moodConfig[mood];

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
      meshRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 3]} intensity={1.2} color={config.color} />
      <pointLight position={[-3, -2, -2]} intensity={0.6} color="#4a1015" />
      <Sphere ref={meshRef} args={[1.4, 64, 64]}>
        <MeshDistortMaterial
          color={config.color}
          distort={config.distort}
          speed={config.speed}
          roughness={0.15}
          metalness={0.6}
          emissive={config.color}
          emissiveIntensity={0.25}
        />
      </Sphere>
      <DreiSparkles count={40} scale={4} size={2} speed={0.4} color={config.color} />
    </>
  );
}

/**
 * Hampton — the central intelligence of Orun OS, rendered as a living orb
 * whose distortion/speed react to `mood`. Used in Home Mobile, Voice Mode,
 * and (as an ambient background layer) in Home Desktop.
 *
 * Deliberately abstract rather than figurative: a "core" the whole OS revolves
 * around, not a literal character/avatar.
 */
export function HamptonScene({ mood = "idle", size = 240, className }: HamptonSceneProps) {
  return (
    <div style={{ width: size, height: size }} className={className}>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <Loader variant="pulse" size="lg" />
          </div>
        }
      >
        <Canvas camera={{ position: [0, 0, 4.2], fov: 40 }} gl={{ antialias: true, alpha: true }}>
          <HamptonCore mood={mood} />
        </Canvas>
      </Suspense>
    </div>
  );
}
