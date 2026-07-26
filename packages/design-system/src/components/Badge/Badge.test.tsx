import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>Novo</Badge>);
    expect(screen.getByText("Novo")).toBeInTheDocument();
  });

  it("defaults to the neutral kind", () => {
    render(<Badge>Padrão</Badge>);
    expect(screen.getByText("Padrão").className).toMatch(/text-text-secondary/);
  });

  it("renders a dot indicator when dot is true", () => {
    const { container } = render(<Badge dot>Com ponto</Badge>);
    expect(container.querySelector("span > span")).toBeInTheDocument();
  });
});
