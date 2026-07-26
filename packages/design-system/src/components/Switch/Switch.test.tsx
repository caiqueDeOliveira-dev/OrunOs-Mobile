import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "../Switch";

describe("Switch", () => {
  it("reflects the checked state via aria-checked", () => {
    render(<Switch checked onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with the opposite value when clicked", async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("toggling an already-checked switch calls onChange(false)", async () => {
    const onChange = vi.fn();
    render(<Switch checked onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("does not call onChange when disabled", async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} disabled />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders label and description text", () => {
    render(<Switch checked onChange={() => {}} label="Wi-Fi" description="Rede doméstica" />);
    expect(screen.getByText("Wi-Fi")).toBeInTheDocument();
    expect(screen.getByText("Rede doméstica")).toBeInTheDocument();
  });
});
