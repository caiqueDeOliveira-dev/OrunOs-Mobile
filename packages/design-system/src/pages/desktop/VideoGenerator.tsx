import React, { useState } from "react";
import { Film, Play } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { ChatInput } from "../../components/ChatInput";
import { Panel } from "../../components/Panel";
import { Progress } from "../../components/Progress";
import { Select } from "../../components/Select";
import { Button } from "../../components/Button";

const durations = [
  { value: "4", label: "4 segundos" },
  { value: "8", label: "8 segundos" },
  { value: "16", label: "16 segundos" },
];

/** Video Generator — screen 10/20. Render queue + preview panel. */
export function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("8");
  const [renderProgress, setRenderProgress] = useState(0);

  return (
    <DesktopShell
      activeId="video"
      crumbs={[{ label: "Orun OS" }, { label: "Studio" }, { label: "Vídeo" }]}
      contentClassName="grid grid-cols-3 gap-5 p-6"
    >
      <Panel title="Preview" className="col-span-2">
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-bg-sunken">
          {renderProgress > 0 && renderProgress < 100 ? (
            <Progress variant="circular" value={renderProgress} showLabel size={72} />
          ) : (
            <div className="flex flex-col items-center gap-2 text-text-muted">
              <Film size={28} />
              <span className="text-sm">Nenhum vídeo renderizado ainda</span>
            </div>
          )}
          {renderProgress === 100 && (
            <Button variant="secondary" icon={<Play size={14} />}>
              Reproduzir
            </Button>
          )}
        </div>
      </Panel>

      <Panel title="Configuração">
        <div className="flex flex-col gap-4 p-4">
          <Select value={duration} onChange={setDuration} options={durations} label="Duração" />
          <ChatInput
            value={prompt}
            onChange={setPrompt}
            onSend={() => setRenderProgress(35)}
            placeholder="Descreva a cena do vídeo..."
          />
        </div>
      </Panel>
    </DesktopShell>
  );
}
