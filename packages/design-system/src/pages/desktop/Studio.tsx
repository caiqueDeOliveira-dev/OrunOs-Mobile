import React from "react";
import { Image as ImageIcon, Video, Music, ArrowRight } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { GlassCard } from "../../components/GlassCard";

const studios = [
  { id: "image", title: "Gerador de Imagem", desc: "Crie imagens a partir de prompts de texto.", icon: <ImageIcon size={22} /> },
  { id: "video", title: "Gerador de Vídeo", desc: "Transforme roteiros e imagens em clipes curtos.", icon: <Video size={22} /> },
  { id: "music", title: "Estúdio de Música", desc: "Componha trilhas e efeitos sonoros com IA.", icon: <Music size={22} /> },
];

export interface StudioProps {
  onOpen?: (id: string) => void;
}

/** Studio — screen 8/20. Hub screen; each card routes to its dedicated generator. */
export function Studio({ onOpen }: StudioProps) {
  return (
    <DesktopShell
      activeId="studio"
      crumbs={[{ label: "Orun OS" }, { label: "Studio" }]}
      contentClassName="p-8"
    >
      <div className="grid grid-cols-3 gap-5">
        {studios.map((s) => (
          <GlassCard
            key={s.id}
            className="group cursor-pointer flex flex-col gap-4 p-6"
            onClick={() => onOpen?.(s.id)}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/15 text-accent">
              {s.icon}
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">{s.title}</h3>
              <p className="mt-1 text-sm text-text-secondary">{s.desc}</p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
              Abrir <ArrowRight size={13} />
            </span>
          </GlassCard>
        ))}
      </div>
    </DesktopShell>
  );
}
