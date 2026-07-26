import React, { useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { Panel } from "../../components/Panel";
import { Card } from "../../components/Card";
import { Progress } from "../../components/Progress";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";

const changelog = [
  { version: "1.4.0", date: "12 jul 2026", notes: ["Fallback automático entre 6 provedores", "Sumarização de contexto via IA"] },
  { version: "1.3.2", date: "02 jul 2026", notes: ["Correção de ordenação de mensagens (rowid)", "19 testes automatizados"] },
  { version: "1.3.0", date: "20 jun 2026", notes: ["Integração com n8n via webhook", "7 motores de TTS suportados"] },
];

/** Updates — screen 19/20. Reflects the real electron-updater in-app update button. */
export function Updates() {
  const [downloading, setDownloading] = useState(false);

  return (
    <DesktopShell
      activeId="updates"
      crumbs={[{ label: "Orun OS" }, { label: "Atualizações" }]}
      contentClassName="p-6 flex flex-col gap-5 max-w-2xl"
    >
      <Card className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">Versão atual: 1.3.2</h3>
            <Badge kind="warning">Atualização disponível</Badge>
          </div>
          <p className="mt-1 text-sm text-text-secondary">Orun OS 1.4.0 está pronto para instalar.</p>
        </div>
        {downloading ? (
          <Progress variant="circular" value={62} showLabel />
        ) : (
          <Button icon={<Download size={15} />} onClick={() => setDownloading(true)}>
            Baixar e instalar
          </Button>
        )}
      </Card>

      <Panel title="Histórico de versões">
        <div className="divide-y divide-surface-border/8">
          {changelog.map((c) => (
            <div key={c.version} className="px-4 py-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-status-success" />
                <span className="text-sm font-semibold text-text-primary">v{c.version}</span>
                <span className="text-xs text-text-muted">{c.date}</span>
              </div>
              <ul className="mt-2 ml-6 list-disc space-y-1 text-sm text-text-secondary">
                {c.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
    </DesktopShell>
  );
}
