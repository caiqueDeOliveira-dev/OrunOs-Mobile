import React from "react";
import { Palette, Key, Volume2, Shield } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { Panel } from "../../components/Panel";
import { Switch } from "../../components/Switch";
import { Select } from "../../components/Select";
import { SyncStatusPanel } from "../../components/SyncStatusPanel";
import { toast } from "../../components/Toast";
import { useThemeStore } from "../../theme/ThemeProvider";
import type { OrunThemeName } from "../../theme/tokens";

const themeOptions: { value: OrunThemeName; label: string }[] = [
  { value: "bloodred", label: "Blood Red (padrão)" },
  { value: "dark", label: "Dark" },
  { value: "premium", label: "Premium / Luxury" },
  { value: "minimal", label: "Minimal" },
];

const ttsEngines = [
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "google", label: "Google Cloud TTS" },
  { value: "azure", label: "Azure TTS" },
  { value: "xtts", label: "XTTS v2" },
  { value: "piper", label: "Piper" },
  { value: "bark", label: "Bark" },
  { value: "f5", label: "F5-TTS" },
];

/** Settings — screen 16/20. Theme, providers, voice, and privacy — mirrors README's known limitations honestly. */
export function Settings() {
  const { theme, setTheme } = useThemeStore();

  return (
    <DesktopShell
      activeId="settings"
      crumbs={[{ label: "Orun OS" }, { label: "Configurações" }]}
      contentClassName="p-6 flex flex-col gap-5 max-w-2xl"
    >
      <Panel title="Aparência">
        <div className="flex items-center gap-3 p-4">
          <Palette size={18} className="text-text-muted" />
          <Select value={theme} onChange={(v) => setTheme(v as OrunThemeName)} options={themeOptions} className="flex-1" />
        </div>
      </Panel>

      <Panel title="Voz">
        <div className="flex items-center gap-3 p-4">
          <Volume2 size={18} className="text-text-muted" />
          <Select value="elevenlabs" onChange={() => {}} options={ttsEngines} label="Motor de TTS padrão" className="flex-1" />
        </div>
      </Panel>

      <Panel title="Chaves de API">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Key size={18} className="text-text-muted" />
            <span className="text-sm text-text-primary">Armazenamento seguro via keychain do sistema</span>
          </div>
          <Switch checked disabled onChange={() => {}} />
        </div>
      </Panel>

      <SyncStatusPanel
        onRetryFailed={() => {
          // TODO: call window.orunAPI.retrySyncFailed() (main process -> SyncService.retryFailed())
          toast.info("Reprocessando itens presos", "Isso chama SyncService.retryFailed() no main process.");
        }}
      />

      <Panel title="Privacidade">
        <div className="divide-y divide-surface-border/8">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-text-muted" />
              <div>
                <p className="text-sm text-text-primary">Wake word e ditado por microfone</p>
                <p className="text-xs text-text-muted">Áudio é enviado ao Google — não é local</p>
              </div>
            </div>
            <Switch checked onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm text-text-primary">Criptografia do banco de conversas</p>
              <p className="text-xs text-text-muted">Atualmente não criptografado</p>
            </div>
            <Switch checked={false} disabled onChange={() => {}} />
          </div>
        </div>
      </Panel>
    </DesktopShell>
  );
}
