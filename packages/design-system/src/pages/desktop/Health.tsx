import React from "react";
import { Flame, Dumbbell, Apple } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { Card } from "../../components/Card";
import { Progress } from "../../components/Progress";
import { Avatar } from "../../components/Avatar";
import { Badge } from "../../components/Badge";

const stats = [
  { label: "Calorias hoje", value: 1420, goal: 2100, icon: <Flame size={16} className="text-status-warning" /> },
  { label: "Treinos na semana", value: 3, goal: 5, icon: <Dumbbell size={16} className="text-status-info" /> },
  { label: "Refeições registradas", value: 2, goal: 4, icon: <Apple size={16} className="text-status-success" /> },
];

/** Health — screen 12/20. Dashboard for the two agents with real specialized behavior. */
export function Health() {
  return (
    <DesktopShell
      activeId="health"
      crumbs={[{ label: "Orun OS" }, { label: "Saúde" }]}
      contentClassName="p-6 flex flex-col gap-5"
    >
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              {s.icon}
              {s.label}
            </div>
            <p className="text-2xl font-semibold text-text-primary">
              {s.value} <span className="text-sm font-normal text-text-muted">/ {s.goal}</span>
            </p>
            <Progress value={(s.value / s.goal) * 100} />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="flex items-start gap-4">
          <Avatar name="Nutricionista" size="lg" status="online" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text-primary">Nutricionista</h3>
              <Badge kind="success">Ativo via WhatsApp</Badge>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              Última análise: foto do almoço recebida às 12:30 — estimativa de 640 kcal.
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-4">
          <Avatar name="Personal Trainer" size="lg" status="online" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text-primary">Personal Trainer</h3>
              <Badge kind="info">Treino diário agendado</Badge>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              Próximo envio automático via node-cron: hoje às 07:00.
            </p>
          </div>
        </Card>
      </div>
    </DesktopShell>
  );
}
