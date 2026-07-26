import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Settings, ChevronDown } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { Dock } from "../../components/Dock";
import { GlassCard } from "../../components/GlassCard";
import { ChatInput } from "../../components/ChatInput";
import type { OrunAgent } from "../../types";

const agents: OrunAgent[] = [
  { id: "hampton", name: "Hampton", role: "Núcleo", status: "online", isCore: true },
  { id: "nutri", name: "Nutricionista", role: "Saúde", status: "online" },
  { id: "trainer", name: "Personal Trainer", role: "Saúde", status: "online" },
  { id: "dev", name: "Dev Agent", role: "Developer", status: "busy" },
  { id: "finance", name: "Finanças", role: "Finance", status: "offline" },
];

/** Home Desktop — screen 1/20. Composed entirely from DesktopShell + design-system primitives. */
export function HomeDesktop() {
  const [prompt, setPrompt] = useState("");

  return (
    <DesktopShell
      activeId="home"
      crumbs={[{ label: "Orun OS" }, { label: "Início" }]}
      navActions={
        <>
          <button className="rounded-md p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary">
            <Bell size={17} />
          </button>
          <button className="rounded-md p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary">
            <Settings size={17} />
          </button>
          <button className="flex items-center gap-1.5 rounded-md pl-1 pr-2 py-1 hover:bg-surface-hover">
            <div className="h-7 w-7 rounded-full bg-surface-active" />
            <span className="text-sm text-text-secondary">Caique</span>
            <ChevronDown size={14} className="text-text-muted" />
          </button>
        </>
      }
      contentClassName="relative flex flex-col items-center justify-center gap-8 px-8"
    >
      <motion.div
        className="absolute h-[420px] w-[420px] rounded-full bg-accent/20 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <GlassCard glow className="relative z-10 flex flex-col items-center gap-3 px-10 py-8 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-text-muted">Bem-vindo de volta</span>
        <h1 className="text-2xl font-semibold text-text-primary">Caique</h1>
        <p className="max-w-sm text-sm text-text-secondary">
          Hampton está online e pronto. Todos os agentes estão sincronizados.
        </p>
      </GlassCard>

      <div className="relative z-10 w-full max-w-xl">
        <ChatInput
          value={prompt}
          onChange={setPrompt}
          onSend={() => setPrompt("")}
          onAttach={() => {}}
          onVoiceStart={() => {}}
          placeholder="Fale com o Hampton..."
        />
      </div>

      <div className="relative z-10">
        <Dock agents={agents} activeId="hampton" onSelect={() => {}} />
      </div>
    </DesktopShell>
  );
}
