import React, { useState } from "react";
import { Play, Terminal } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { Panel } from "../../components/Panel";
import { Select } from "../../components/Select";
import { Button } from "../../components/Button";
import { StatusChip } from "../../components/StatusChip";
import { Badge } from "../../components/Badge";
import { SyncStatusPanel } from "../../components/SyncStatusPanel";
import { toast } from "../../components/Toast";

const agentModelRows = [
  { agent: "Hampton (núcleo)", provider: "claude", model: "claude-sonnet-5" },
  { agent: "Nutricionista", provider: "openai", model: "gpt-4.1" },
  { agent: "Personal Trainer", provider: "groq", model: "llama-3.3-70b" },
  { agent: "Dev Agent", provider: "ollama", model: "qwen2.5-coder:32b" },
];

const providers = [
  { value: "ollama", label: "Ollama (local)" },
  { value: "claude", label: "Anthropic Claude" },
  { value: "openai", label: "OpenAI" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "groq", label: "Groq" },
  { value: "github", label: "GitHub Models" },
];

const mockLogs = [
  "[12:04:01] provider:ollama status=ok latency=42ms",
  "[12:04:03] agent:dev model=qwen2.5-coder:32b loaded",
  "[12:04:10] fallback triggered: openrouter -> groq (rate limit)",
  "[12:04:14] sqlite: message ordering by rowid (fix confirmed)",
  "[12:04:22] test suite: 19/19 passing",
];

/** Developer — screen 6/20. Console log panel + per-agent model assignment table. */
export function Developer() {
  const [rows, setRows] = useState(agentModelRows);

  return (
    <DesktopShell
      activeId="developer"
      crumbs={[{ label: "Orun OS" }, { label: "Developer" }]}
      navActions={<Button size="sm" icon={<Play size={14} />}>Rodar testes</Button>}
      contentClassName="p-6"
    >
      <div className="flex flex-col gap-5 h-full">
        <div className="grid grid-cols-2 gap-5">
          <Panel title="Atribuição de modelos por agente" bordered>
            <div className="divide-y divide-surface-border/8">
              {rows.map((row, i) => (
                <div key={row.agent} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-sm text-text-primary">{row.agent}</span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={row.provider}
                      onChange={(v) =>
                        setRows((r) => r.map((x, idx) => (idx === i ? { ...x, provider: v } : x)))
                      }
                      options={providers}
                      className="w-44"
                    />
                    <Badge kind="info">{row.model}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Console"
            actions={<StatusChip status="online" label="18 agentes ativos" />}
            bordered
          >
            <div className="flex items-center gap-2 border-b border-surface-border/8 px-4 py-2 text-xs text-text-muted">
              <Terminal size={14} />
              orun-os --logs --follow
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs text-text-secondary space-y-1.5">
              {mockLogs.map((log, i) => (
                <p key={i}>{log}</p>
              ))}
            </div>
          </Panel>
        </div>

        {/* Sync health — driven by SyncService.getSyncStatus() over IPC (see orun-supabase-sync README) */}
        <SyncStatusPanel
          onRetryFailed={() => {
            // TODO: call window.orunAPI.retrySyncFailed() (main process -> SyncService.retryFailed())
            toast.info("Reprocessando itens presos", "Isso chama SyncService.retryFailed() no main process.");
          }}
        />
      </div>
    </DesktopShell>
  );
}
