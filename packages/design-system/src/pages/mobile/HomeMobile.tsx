import React from "react";
import { motion } from "framer-motion";
import { Home, MessageSquare, Sparkles, Settings2, Mic } from "lucide-react";
import { BottomNavItem } from "../../components/BottomNavigation";
import { FloatingButton } from "../../components/FloatingButton";
import { GlassCard } from "../../components/GlassCard";
import { StatusChip } from "../../components/StatusChip";
import { Avatar } from "../../components/Avatar";
import { HamptonScene } from "../../components/HamptonScene";
import { MobileShell } from "../../layouts/MobileShell";

export const MOBILE_TABS: BottomNavItem[] = [
  { id: "home", label: "Início", icon: <Home size={20} /> },
  { id: "chat", label: "Chat", icon: <MessageSquare size={20} /> },
  { id: "studio", label: "Studio", icon: <Sparkles size={20} /> },
  { id: "settings", label: "Config", icon: <Settings2 size={20} /> },
];

export interface MobileScreenProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

/**
 * Home Mobile — screen 2/20.
 * Same design language as Home Desktop (same tokens, same components),
 * adapted to a single-column, thumb-reachable layout. Hampton's 3D core
 * is the visual anchor. Chrome (top bar, bottom nav, side drawer) now
 * lives in <MobileShell>, shared with every other mobile screen.
 */
export function HomeMobile({ activeTab, onTabChange }: MobileScreenProps) {
  return (
    <MobileShell
      tabs={MOBILE_TABS}
      activeTab={activeTab}
      onTabChange={onTabChange}
      menuItems={[
        { label: "Projetos", onClick: () => {} },
        { label: "Memória", onClick: () => {} },
        { label: "Automação", onClick: () => {} },
      ]}
      floating={
        <FloatingButton icon={<Mic size={22} />} label="Falar com Hampton" style={{ right: 20, bottom: 84 }} />
      }
    >
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center gap-6 px-6 pt-4 pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative"
        >
          <HamptonScene mood="idle" size={220} />
        </motion.div>

        <GlassCard glow className="w-full max-w-sm flex flex-col items-center gap-2 px-6 py-5 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-text-muted">Olá, Caique</span>
          <StatusChip status="online" label="Hampton está ouvindo" />
        </GlassCard>

        <div className="grid w-full max-w-sm grid-cols-3 gap-3">
          {["Nutricionista", "Personal Trainer", "Dev Agent"].map((name) => (
            <button
              key={name}
              className="flex flex-col items-center gap-1.5 rounded-lg bg-surface/60 px-2 py-3 hover:bg-surface-hover transition-colors"
            >
              <Avatar name={name} size="sm" status="online" />
              <span className="text-[11px] text-text-secondary text-center leading-tight">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
