import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { Card } from "../../components/Card";
import { Panel } from "../../components/Panel";
import { Progress } from "../../components/Progress";
import { Badge } from "../../components/Badge";

const providerUsage = [
  { name: "Claude", cost: 12.4, pct: 38 },
  { name: "OpenAI", cost: 8.1, pct: 25 },
  { name: "Groq", cost: 2.3, pct: 7 },
  { name: "OpenRouter", cost: 9.8, pct: 30 },
];

/** Finance — screen 13/20. Provider spend tracking (from the usage-tracking feature) + a general overview. */
export function Finance() {
  return (
    <DesktopShell
      activeId="finance"
      crumbs={[{ label: "Orun OS" }, { label: "Finanças" }]}
      contentClassName="p-6 flex flex-col gap-5"
    >
      <div className="grid grid-cols-3 gap-4">
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-text-secondary">Gasto total (mês)</span>
          <span className="text-2xl font-semibold text-text-primary">$32.60</span>
          <span className="flex items-center gap-1 text-xs text-status-danger">
            <TrendingUp size={13} /> +12% vs mês anterior
          </span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-text-secondary">Caracteres TTS (mês)</span>
          <span className="text-2xl font-semibold text-text-primary">184.2k</span>
          <span className="flex items-center gap-1 text-xs text-status-success">
            <TrendingDown size={13} /> -6% vs mês anterior
          </span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-text-secondary">Provedor mais usado</span>
          <span className="text-2xl font-semibold text-text-primary">Claude</span>
          <Badge kind="info">38% das requisições</Badge>
        </Card>
      </div>

      <Panel title="Custo por provedor" className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {providerUsage.map((p) => (
            <div key={p.name} className="flex items-center gap-4">
              <span className="w-28 shrink-0 text-sm text-text-primary">{p.name}</span>
              <Progress value={p.pct} className="flex-1" />
              <span className="w-16 shrink-0 text-right text-sm text-text-secondary">${p.cost.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </DesktopShell>
  );
}
