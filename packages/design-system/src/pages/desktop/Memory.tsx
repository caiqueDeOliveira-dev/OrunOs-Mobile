import React, { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { Input } from "../../components/Input";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";

const memories = [
  { id: "1", title: "Preferência de tema", summary: "Usuário prefere o tema Blood Red como padrão.", kind: "Preferência" },
  { id: "2", title: "Projeto Orun OS", summary: "Contexto completo do app Electron, stack e limitações conhecidas.", kind: "Projeto" },
  { id: "3", title: "Rotina de treino", summary: "Resumo semanal gerado pelo Personal Trainer a partir do WhatsApp.", kind: "Saúde" },
  { id: "4", title: "Bug de ordenação de mensagens", summary: "Corrigido trocando created_at por rowid no SQLite.", kind: "Developer" },
];

/** Memory — screen 7/20. Browse/search what Hampton remembers, with AI-summarized context. */
export function Memory() {
  const [query, setQuery] = useState("");
  const filtered = memories.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <DesktopShell
      activeId="memory"
      crumbs={[{ label: "Orun OS" }, { label: "Memória" }]}
      contentClassName="p-6 flex flex-col gap-5"
    >
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftIcon={<Search size={16} />}
        placeholder="Buscar na memória do Hampton..."
        className="max-w-md"
      />

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((m) => (
          <Card key={m.id} padding="md" className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold text-text-primary">{m.title}</h3>
              <Badge kind="neutral">{m.kind}</Badge>
            </div>
            <p className="text-sm text-text-secondary">{m.summary}</p>
            <div className="mt-2 flex justify-end">
              <Button variant="ghost" size="xs" icon={<Trash2 size={13} />}>
                Esquecer
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </DesktopShell>
  );
}
