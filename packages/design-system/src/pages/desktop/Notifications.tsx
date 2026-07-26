import React, { useState } from "react";
import { CheckCheck } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { Panel } from "../../components/Panel";
import { NotificationItem } from "../../components/Notification";
import { Button } from "../../components/Button";

const initial = [
  { id: "1", title: "Treino de hoje enviado", description: "Personal Trainer enviou o treino via WhatsApp às 07:00.", timestamp: "08:12", read: false, agentName: "Personal Trainer" },
  { id: "2", title: "Fallback de provedor ativado", description: "OpenRouter atingiu rate limit — trocado para Groq automaticamente.", timestamp: "07:40", read: false, kind: "warning" as const },
  { id: "3", title: "Atualização disponível", description: "Orun OS 1.4.0 pronto para instalar.", timestamp: "Ontem", read: true, kind: "info" as const },
  { id: "4", title: "Testes passaram", description: "19/19 testes concluídos com sucesso após o último build.", timestamp: "Ontem", read: true, kind: "success" as const },
];

/** Notifications — screen 18/20. Notification Center built from NotificationItem rows. */
export function Notifications() {
  const [items, setItems] = useState(initial);

  return (
    <DesktopShell
      activeId="notifications"
      crumbs={[{ label: "Orun OS" }, { label: "Notificações" }]}
      navActions={
        <Button
          variant="ghost"
          size="sm"
          icon={<CheckCheck size={15} />}
          onClick={() => setItems((r) => r.map((i) => ({ ...i, read: true })))}
        >
          Marcar tudo como lido
        </Button>
      }
      contentClassName="p-6 max-w-2xl"
    >
      <Panel>
        <div className="p-2">
          {items.map((n) => (
            <NotificationItem
              key={n.id}
              title={n.title}
              description={n.description}
              timestamp={n.timestamp}
              read={n.read}
              kind={n.kind}
              agentName={n.agentName}
              onClick={() => setItems((r) => r.map((i) => (i.id === n.id ? { ...i, read: true } : i)))}
            />
          ))}
        </div>
      </Panel>
    </DesktopShell>
  );
}
