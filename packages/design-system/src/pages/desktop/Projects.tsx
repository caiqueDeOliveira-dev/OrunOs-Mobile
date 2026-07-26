import React from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { Badge } from "../../components/Badge";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { Progress } from "../../components/Progress";

interface ProjectTask {
  id: string;
  title: string;
  tag: string;
  progress: number;
  assignee: string;
}

const columns: { id: string; title: string; tasks: ProjectTask[] }[] = [
  {
    id: "backlog",
    title: "Backlog",
    tasks: [
      { id: "1", title: "Wake word 100% local (offline)", tag: "Privacidade", progress: 0, assignee: "Dev Agent" },
      { id: "2", title: "Criptografar banco SQLite", tag: "Segurança", progress: 10, assignee: "Dev Agent" },
    ],
  },
  {
    id: "progress",
    title: "Em progresso",
    tasks: [
      { id: "3", title: "Design System — 20 telas", tag: "UI", progress: 65, assignee: "Hampton" },
      { id: "4", title: "Migrar WhatsApp p/ API oficial", tag: "Automação", progress: 30, assignee: "Dev Agent" },
    ],
  },
  {
    id: "done",
    title: "Concluído",
    tasks: [
      { id: "5", title: "Fallback automático entre provedores", tag: "Core", progress: 100, assignee: "Dev Agent" },
      { id: "6", title: "Sumarização de contexto via IA", tag: "Core", progress: 100, assignee: "Dev Agent" },
    ],
  },
];

/** Projects — screen 5/20. Kanban board built from Card, Chip, Badge, Avatar, Progress. */
export function Projects() {
  return (
    <DesktopShell
      activeId="projects"
      crumbs={[{ label: "Orun OS" }, { label: "Projetos" }]}
      navActions={<Button size="sm" icon={<Plus size={15} />}>Novo projeto</Button>}
      contentClassName="p-6"
    >
      <div className="grid grid-cols-3 gap-5 h-full">
        {columns.map((col) => (
          <div key={col.id} className="flex flex-col gap-3 min-h-0">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-text-primary">{col.title}</h3>
              <Badge kind="neutral">{col.tasks.length}</Badge>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {col.tasks.map((task) => (
                <Card key={task.id} interactive padding="sm" className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-text-primary leading-snug">{task.title}</p>
                    <button className="shrink-0 text-text-muted hover:text-text-primary">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                  <Chip>{task.tag}</Chip>
                  <Progress value={task.progress} />
                  <div className="flex items-center justify-between">
                    <Avatar name={task.assignee} size="xs" isCore={task.assignee === "Hampton"} />
                    <span className="text-xs text-text-muted">{task.progress}%</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DesktopShell>
  );
}
