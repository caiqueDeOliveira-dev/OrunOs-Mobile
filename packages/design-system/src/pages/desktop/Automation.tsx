import React, { useState } from "react";
import { Workflow, Plus, AlertTriangle } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { Panel } from "../../components/Panel";
import { Switch } from "../../components/Switch";
import { StatusChip } from "../../components/StatusChip";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";

const automations = [
  { id: "1", name: "Análise de foto de refeição (WhatsApp)", desc: "Baileys — recebe foto, estima calorias, responde.", enabled: true, risky: true },
  { id: "2", name: "Envio diário de treino", desc: "node-cron às 07:00, via WhatsApp.", enabled: true, risky: true },
  { id: "3", name: "Webhook n8n — resumo semanal", desc: "Dispara automação autônoma toda segunda-feira.", enabled: false, risky: false },
];

/** Automation — screen 14/20. Toggle-controlled automation list; known-risk items flagged honestly. */
export function Automation() {
  const [rows, setRows] = useState(automations);

  return (
    <DesktopShell
      activeId="automation"
      crumbs={[{ label: "Orun OS" }, { label: "Automação" }]}
      navActions={<Button size="sm" icon={<Plus size={14} />}>Nova automação</Button>}
      contentClassName="p-6"
    >
      <Panel
        title="Automações ativas"
        actions={<StatusChip status="online" label="n8n conectado" />}
      >
        <div className="divide-y divide-surface-border/8">
          {rows.map((a, i) => (
            <div key={a.id} className="flex items-center gap-4 px-4 py-4">
              <Workflow size={18} className="shrink-0 text-text-muted" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">{a.name}</p>
                  {a.risky && (
                    <Badge kind="warning" dot>
                      <AlertTriangle size={11} className="mr-0.5" /> Viola ToS do WhatsApp
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-text-muted">{a.desc}</p>
              </div>
              <Switch
                checked={a.enabled}
                onChange={(v) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, enabled: v } : x)))}
              />
            </div>
          ))}
        </div>
      </Panel>
    </DesktopShell>
  );
}
