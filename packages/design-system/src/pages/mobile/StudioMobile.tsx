import React from "react";
import { Image as ImageIcon, Video, Music, ArrowRight } from "lucide-react";
import { MobileShell } from "../../layouts/MobileShell";
import { MOBILE_TABS, MobileScreenProps } from "./HomeMobile";
import { GlassCard } from "../../components/GlassCard";

const studios = [
  { id: "image", title: "Gerador de Imagem", desc: "Crie imagens a partir de prompts de texto.", icon: <ImageIcon size={22} /> },
  { id: "video", title: "Gerador de Vídeo", desc: "Transforme roteiros em clipes curtos.", icon: <Video size={22} /> },
  { id: "music", title: "Estúdio de Música", desc: "Componha trilhas com IA.", icon: <Music size={22} /> },
];

export interface StudioMobileProps extends MobileScreenProps {
  onOpen?: (id: string) => void;
}

/**
 * Studio Mobile — mobile counterpart of the desktop Studio hub. Same three
 * destinations (Image/Video/Music), stacked in a single column instead of
 * the desktop's 3-column grid — the only real difference between the two.
 */
export function StudioMobile({ activeTab, onTabChange, onOpen }: StudioMobileProps) {
  return (
    <MobileShell title="Studio" tabs={MOBILE_TABS} activeTab={activeTab} onTabChange={onTabChange}>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 px-4 py-4">
        {studios.map((s) => (
          <GlassCard
            key={s.id}
            className="flex items-center gap-4 p-5"
            onClick={() => onOpen?.(s.id)}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-primary">{s.title}</h3>
              <p className="mt-0.5 text-xs text-text-secondary">{s.desc}</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-text-muted" />
          </GlassCard>
        ))}
      </div>
    </MobileShell>
  );
}
