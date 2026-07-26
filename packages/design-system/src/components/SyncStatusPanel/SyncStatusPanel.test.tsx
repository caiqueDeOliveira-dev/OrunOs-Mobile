import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SyncStatusPanel } from "../SyncStatusPanel";
import { useSyncStatusStore } from "../../stores/syncStatusStore";

const emptyStatus = {
  pending: 0,
  deadLetterCount: 0,
  lastSuccessAt: null,
  lastError: null,
  isRunning: false,
  realtimeEnabled: false,
};

describe("SyncStatusPanel", () => {
  beforeEach(() => {
    useSyncStatusStore.setState({ status: emptyStatus });
  });

  it("shows zeroed counts before any status has been reported", () => {
    render(<SyncStatusPanel />);
    expect(screen.getByText("Em dia")).toBeInTheDocument();
    expect(screen.getByText("nunca", { exact: false })).toBeInTheDocument();
  });

  it("does not show the retry button when there are no dead letters", () => {
    render(<SyncStatusPanel />);
    expect(screen.queryByText(/Tentar de novo/)).not.toBeInTheDocument();
  });

  it("shows pending/dead-letter counts and the retry button once there's something stuck", () => {
    useSyncStatusStore.getState().setStatus({
      ...emptyStatus,
      pending: 3,
      deadLetterCount: 2,
    });
    render(<SyncStatusPanel />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/Tentar de novo \(2\)/)).toBeInTheDocument();
  });

  it("calls onRetryFailed when the retry button is clicked", async () => {
    useSyncStatusStore.getState().setStatus({ ...emptyStatus, deadLetterCount: 1 });
    const onRetryFailed = vi.fn();
    render(<SyncStatusPanel onRetryFailed={onRetryFailed} />);
    await userEvent.click(screen.getByText(/Tentar de novo/));
    expect(onRetryFailed).toHaveBeenCalledTimes(1);
  });

  it("shows the last error message when present", () => {
    useSyncStatusStore.getState().setStatus({ ...emptyStatus, lastError: "network down" });
    render(<SyncStatusPanel />);
    expect(screen.getByText("network down")).toBeInTheDocument();
    expect(screen.getByText("Erro no último ciclo")).toBeInTheDocument();
  });
});
