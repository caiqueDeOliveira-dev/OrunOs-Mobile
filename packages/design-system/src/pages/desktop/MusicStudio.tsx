import React, { useState } from "react";
import { Play, Pause, Music2 } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { AudioWaveform } from "../../components/AudioWaveform";
import { ChatInput } from "../../components/ChatInput";
import { Panel } from "../../components/Panel";
import { Chip } from "../../components/Chip";
import { Button } from "../../components/Button";

const moods = ["Épico", "Lo-fi", "Ambiente", "Eletrônico", "Cinemático"];
const tracks = [
  { id: "1", name: "Tema de abertura", duration: "1:24" },
  { id: "2", name: "Trilha de fundo — foco", duration: "3:02" },
];

/** Music Studio — screen 11/20. Waveform player + prompt-based composition. */
export function MusicStudio() {
  const [prompt, setPrompt] = useState("");
  const [playing, setPlaying] = useState(false);
  const [mood, setMood] = useState("Épico");

  return (
    <DesktopShell
      activeId="music"
      crumbs={[{ label: "Orun OS" }, { label: "Studio" }, { label: "Música" }]}
      contentClassName="flex flex-col gap-5 p-6"
    >
      <div className="flex flex-wrap gap-2">
        {moods.map((m) => (
          <Chip key={m} selected={m === mood} onClick={() => setMood(m)}>
            {m}
          </Chip>
        ))}
      </div>

      <Panel title="Player">
        <div className="flex flex-col items-center gap-5 p-8">
          <AudioWaveform active={playing} bars={40} className="h-20 w-full max-w-lg" />
          <Button
            variant="primary"
            glow
            icon={playing ? <Pause size={16} /> : <Play size={16} />}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? "Pausar" : "Reproduzir"}
          </Button>
        </div>
      </Panel>

      <Panel title="Faixas geradas" className="flex-1">
        <div className="divide-y divide-surface-border/8">
          {tracks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <Music2 size={16} className="text-text-muted" />
              <span className="flex-1 text-sm text-text-primary">{t.name}</span>
              <span className="text-xs text-text-muted">{t.duration}</span>
            </div>
          ))}
        </div>
      </Panel>

      <ChatInput
        value={prompt}
        onChange={setPrompt}
        onSend={() => setPrompt("")}
        placeholder="Descreva a trilha que você quer compor..."
      />
    </DesktopShell>
  );
}
