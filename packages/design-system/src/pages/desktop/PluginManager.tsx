import React, { useState } from "react";
import { Puzzle, Search } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { Input } from "../../components/Input";
import { Card } from "../../components/Card";
import { Switch } from "../../components/Switch";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";

const plugins = [
  { id: "1", name: "n8n Connector", desc: "Dispara e recebe webhooks de automações n8n.", enabled: true, installed: true },
  { id: "2", name: "WhatsApp (Baileys)", desc: "Integração não-oficial com WhatsApp.", enabled: true, installed: true, risky: true },
  { id: "3", name: "Notion Sync", desc: "Sincroniza Projetos com um workspace Notion.", enabled: false, installed: false },
  { id: "4", name: "Spotify Control", desc: "Controle de música por voz via Hampton.", enabled: false, installed: false },
];

/** Plugin Manager — screen 20/20. Final screen of the initial roadmap. */
export function PluginManager() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(plugins);
  const filtered = rows.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <DesktopShell
      activeId="plugins"
      crumbs={[{ label: "Orun OS" }, { label: "Plugins" }]}
      contentClassName="p-6 flex flex-col gap-5"
    >
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftIcon={<Search size={16} />}
        placeholder="Buscar plugins..."
        className="max-w-md"
      />

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((p) => (
          <Card key={p.id} className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-active text-text-secondary">
              <Puzzle size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-text-primary">{p.name}</h3>
                {p.risky && <Badge kind="warning">Não testado em produção</Badge>}
                {!p.installed && <Badge kind="neutral">Não instalado</Badge>}
              </div>
              <p className="mt-1 text-sm text-text-secondary">{p.desc}</p>
              <div className="mt-3 flex items-center justify-between">
                {p.installed ? (
                  <Switch
                    checked={p.enabled}
                    onChange={(v) => setRows((r) => r.map((x) => (x.id === p.id ? { ...x, enabled: v } : x)))}
                  />
                ) : (
                  <Button size="sm" variant="secondary">Instalar</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DesktopShell>
  );
}
