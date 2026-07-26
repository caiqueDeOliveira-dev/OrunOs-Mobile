import React, { useState } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { motion } from "framer-motion";
import { HamptonScene } from "../../components/HamptonScene";
import { AudioWaveform } from "../../components/AudioWaveform";
import { StatusChip } from "../../components/StatusChip";
import { FloatingButton } from "../../components/FloatingButton";
import type { HamptonMood } from "../../stores/chatStore";

export interface VoiceModeProps {
  onClose?: () => void;
}

/**
 * Voice Mode — screen 4/20. Deliberately NOT wrapped in DesktopShell:
 * this is an immersive, distraction-free fullscreen overlay, entered from
 * Chat/Home via the mic action and exited with the close button or Esc.
 */
export function VoiceMode({ onClose }: VoiceModeProps) {
  const [muted, setMuted] = useState(false);
  const mood: HamptonMood = muted ? "idle" : "listening";

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center bg-bg-base overflow-hidden">
      <motion.div
        className="absolute h-[560px] w-[560px] rounded-full bg-accent/15 blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <button
        onClick={onClose}
        className="absolute top-6 right-6 rounded-full p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary"
      >
        <X size={20} />
      </button>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <HamptonScene mood={mood} size={320} />
        <StatusChip status={muted ? "offline" : "online"} label={muted ? "Microfone desativado" : "Ouvindo..."} />
        <AudioWaveform active={!muted} bars={32} className="h-16 w-72" />
      </div>

      <div className="absolute bottom-16 flex items-center gap-4">
        <FloatingButton
          icon={muted ? <MicOff size={24} /> : <Mic size={24} />}
          label={muted ? "Ativar microfone" : "Silenciar microfone"}
          onClick={() => setMuted((m) => !m)}
          glow={!muted}
          style={{ position: "static" }}
          className={muted ? "bg-surface-active text-text-secondary" : undefined}
        />
      </div>
    </div>
  );
}
