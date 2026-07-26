import React from "react";
import { CloudCog, AlertTriangle, RotateCw, Radio } from "lucide-react";
import { Panel } from "../Panel";
import { StatusChip } from "../StatusChip";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { useSyncStatusStore } from "../../stores/syncStatusStore";

export interface SyncStatusPanelProps {
  onRetryFailed?: () => void;
  className?: string;
}

function timeAgo(iso: string | null) {
  if (!iso) return "nunca";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  return `há ${hours}h`;
}

/**
 * Shows the hybrid SQLite <-> Supabase sync health: pending items in the
 * outbox, dead letters (items that gave up retrying), last successful
 * cycle, and whether Realtime is active. Reads from `syncStatusStore`,
 * which the renderer keeps updated by polling
 * `SyncService.getSyncStatus()` over IPC — this component has no idea
 * where the data comes from, it just renders it.
 *
 * Used identically in Developer (for debugging) and Settings (for the
 * user-facing "is my data backed up" question) — one implementation,
 * not two.
 */
export function SyncStatusPanel({ onRetryFailed, className }: SyncStatusPanelProps) {
  const status = useSyncStatusStore((s) => s.status);
  const hasDeadLetters = status.deadLetterCount > 0;

  return (
    <Panel
      title="Sincronização (Supabase)"
      actions={
        <StatusChip
          status={status.lastError ? "offline" : status.isRunning ? "connecting" : "online"}
          label={status.lastError ? "Erro no último ciclo" : status.isRunning ? "Sincronizando..." : "Em dia"}
        />
      }
      className={className}
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1 rounded-md bg-bg-sunken px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <CloudCog size={13} /> Pendentes
            </span>
            <span className="text-lg font-semibold text-text-primary">{status.pending}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-md bg-bg-sunken px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <AlertTriangle size={13} /> Presos
            </span>
            <span className={`text-lg font-semibold ${hasDeadLetters ? "text-status-danger" : "text-text-primary"}`}>
              {status.deadLetterCount}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md bg-bg-sunken px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <Radio size={13} /> Realtime
            </span>
            <Badge kind={status.realtimeEnabled ? "success" : "neutral"} className="w-fit">
              {status.realtimeEnabled ? "Ativo" : "Desligado"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Última sincronização bem-sucedida: {timeAgo(status.lastSuccessAt)}</span>
          {hasDeadLetters && (
            <Button variant="secondary" size="xs" icon={<RotateCw size={12} />} onClick={onRetryFailed}>
              Tentar de novo ({status.deadLetterCount})
            </Button>
          )}
        </div>

        {status.lastError && (
          <p className="rounded-md bg-status-danger/10 px-3 py-2 text-xs text-status-danger">
            {status.lastError}
          </p>
        )}
      </div>
    </Panel>
  );
}
