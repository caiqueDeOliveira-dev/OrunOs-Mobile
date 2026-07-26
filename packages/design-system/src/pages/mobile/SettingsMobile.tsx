import React from "react";
import { Palette, Volume2, Shield } from "lucide-react";
import { MobileShell } from "../../layouts/MobileShell";
import { MOBILE_TABS, MobileScreenProps } from "./HomeMobile";
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

/**
 * Settings Mobile — mobile counterpart of the desktop Settings screen.
 * Same theme store, same SyncStatusPanel as desktop — stacked vertically
 * instead of the desktop's fixed-width column, since that's all a single
 * column of Panels needs to adapt.
 */
export function SettingsMobile({ activeTab, onTabChange }: MobileScreenProps) {
  const { theme, setTheme } = useThemeStore();

  return (
    <MobileShell title="Configurações" tabs={MOBILE_TABS} activeTab={activeTab} onTabChange={onTabChange}>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 px-4 py-4">
        <Panel title="Aparência">
          <div className="flex items-center gap-3 p-4">
            <Palette size={18} className="text-text-muted" />
            <Select value={theme} onChange={(v) => setTheme(v as OrunThemeName)} options={themeOptions} className="flex-1" />
          </div>
        </Panel>

        <Panel title="Voz">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Volume2 size={18} className="text-text-muted" />
              <span className="text-sm text-text-primary">Wake word por microfone</span>
            </div>
            <Switch checked onChange={() => {}} />
          </div>
        </Panel>

        <SyncStatusPanel
          onRetryFailed={() => {
            toast.info("Reprocessando itens presos", "Chama SyncService.retryFailed() no main process.");
          }}
        />

        <Panel title="Privacidade">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-text-muted" />
              <span className="text-sm text-text-primary">Criptografia do banco</span>
            </div>
            <Switch checked={false} disabled onChange={() => {}} />
          </div>
        </Panel>
      </div>
    </MobileShell>
  );
}
