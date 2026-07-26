import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusChip } from "../StatusChip";

describe("StatusChip", () => {
  it("shows the default label for each status", () => {
    render(<StatusChip status="online" />);
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("shows a custom label when provided", () => {
    render(<StatusChip status="online" label="6 provedores conectados" />);
    expect(screen.getByText("6 provedores conectados")).toBeInTheDocument();
  });

  it("shows the offline label", () => {
    render(<StatusChip status="offline" />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });
});
