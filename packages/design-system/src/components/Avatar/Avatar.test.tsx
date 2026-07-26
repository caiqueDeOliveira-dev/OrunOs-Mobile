import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "../Avatar";

describe("Avatar", () => {
  it("shows initials when there's no image", () => {
    render(<Avatar name="Hampton Silva" />);
    expect(screen.getByText("HS")).toBeInTheDocument();
  });

  it("single-word names produce a single initial", () => {
    render(<Avatar name="Hampton" />);
    expect(screen.getByText("H")).toBeInTheDocument();
  });

  it("renders an <img> when src is provided", () => {
    render(<Avatar name="Caique" src="https://example.com/avatar.png" />);
    expect(screen.getByAltText("Caique")).toBeInTheDocument();
  });

  it("applies a gold ring for isCore agents", () => {
    const { container } = render(<Avatar name="Hampton" isCore />);
    expect(container.querySelector(".ring-gold")).toBeInTheDocument();
  });
});
