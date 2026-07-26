import React, { useState } from "react";
import { Wand2, Download } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { ChatInput } from "../../components/ChatInput";
import { Card } from "../../components/Card";
import { Progress } from "../../components/Progress";
import { Chip } from "../../components/Chip";
import { Button } from "../../components/Button";

const styles = ["Fotorrealista", "Ilustração", "Anime", "3D Render", "Minimalista"];
const gallery = [1, 2, 3, 4];

/** Image Generator — screen 9/20. Prompt composer (reuses ChatInput) + result grid. */
export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Fotorrealista");
  const [generating, setGenerating] = useState(false);

  return (
    <DesktopShell
      activeId="image"
      crumbs={[{ label: "Orun OS" }, { label: "Studio" }, { label: "Imagem" }]}
      contentClassName="flex flex-col p-6 gap-5"
    >
      <div className="flex flex-wrap gap-2">
        {styles.map((s) => (
          <Chip key={s} selected={s === style} onClick={() => setStyle(s)}>
            {s}
          </Chip>
        ))}
      </div>

      <div className="grid flex-1 min-h-0 grid-cols-4 gap-4 overflow-y-auto">
        {gallery.map((i) => (
          <Card key={i} padding="none" className="flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden">
            {generating ? (
              <Progress variant="circular" value={40 + i * 10} showLabel />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface to-bg-sunken text-text-muted">
                <Wand2 size={22} />
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <ChatInput
            value={prompt}
            onChange={setPrompt}
            onSend={() => setGenerating(true)}
            placeholder="Descreva a imagem que você quer gerar..."
          />
        </div>
        <Button icon={<Download size={15} />} variant="secondary">
          Exportar
        </Button>
      </div>
    </DesktopShell>
  );
}
