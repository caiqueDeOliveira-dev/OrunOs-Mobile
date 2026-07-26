import React, { useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { Input } from "../../components/Input";
import { Card } from "../../components/Card";
import { Loader } from "../../components/Loader";
import { Badge } from "../../components/Badge";

const sources = [
  { title: "Electron — Multi-platform build docs", domain: "electronjs.org" },
  { title: "Baileys — WhatsApp Web API (unofficial)", domain: "github.com" },
  { title: "SQLite rowid vs autoincrement ordering", domain: "sqlite.org" },
];

/** Research — screen 15/20. Search + source list; wire to the real web-search tool layer later. */
export function Research() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <DesktopShell
      activeId="research"
      crumbs={[{ label: "Orun OS" }, { label: "Pesquisa" }]}
      contentClassName="p-6 flex flex-col gap-5"
    >
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && setLoading(true)}
        leftIcon={<Search size={16} />}
        placeholder="Pesquisar na web..."
        className="max-w-lg"
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Loader variant="dots" size="sm" /> Pesquisando...
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-w-2xl">
          {sources.map((s) => (
            <Card key={s.title} interactive padding="sm" className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text-primary">{s.title}</p>
                <Badge kind="neutral" className="mt-1">{s.domain}</Badge>
              </div>
              <ExternalLink size={15} className="shrink-0 text-text-muted" />
            </Card>
          ))}
        </div>
      )}
    </DesktopShell>
  );
}
