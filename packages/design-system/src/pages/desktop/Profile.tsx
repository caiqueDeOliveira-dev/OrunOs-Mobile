import React from "react";
import { Edit3, Shield, Clock } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { Card } from "../../components/Card";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { StatusChip } from "../../components/StatusChip";

const agentRoster = [
  { name: "Hampton", role: "Núcleo", status: "online" as const, isCore: true },
  { name: "Nutricionista", role: "Saúde", status: "online" as const },
  { name: "Personal Trainer", role: "Saúde", status: "online" as const },
  { name: "Dev Agent", role: "Developer", status: "busy" as const },
];

/** Profile — screen 17/20. */
export function Profile() {
  return (
    <DesktopShell
      activeId="profile"
      crumbs={[{ label: "Orun OS" }, { label: "Perfil" }]}
      contentClassName="p-6 flex flex-col gap-5 max-w-2xl"
    >
      <Card className="flex items-center gap-5">
        <Avatar name="Caique" size="xl" status="online" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-text-primary">Caique</h1>
            <Badge kind="info">Grupo Orun Soluções Tecnológicas</Badge>
          </div>
          <p className="mt-1 text-sm text-text-secondary">Fundador e único usuário do Orun OS</p>
        </div>
        <Button variant="secondary" size="sm" icon={<Edit3 size={14} />}>Editar</Button>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="flex items-center gap-3">
          <Clock size={18} className="text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Tempo de uso hoje</p>
            <p className="text-sm font-semibold text-text-primary">2h 14min</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <Shield size={18} className="text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Segurança da conta</p>
            <StatusChip status="online" label="Chaves protegidas via keychain" />
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-text-primary">Agentes (18 no total)</h3>
        <div className="flex flex-wrap gap-4">
          {agentRoster.map((a) => (
            <div key={a.name} className="flex flex-col items-center gap-1.5">
              <Avatar name={a.name} size="md" status={a.status} isCore={a.isCore} />
              <span className="text-xs text-text-secondary">{a.name}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1.5 justify-center">
            <span className="text-xs text-text-muted">+14 mais</span>
          </div>
        </div>
      </Card>
    </DesktopShell>
  );
}
