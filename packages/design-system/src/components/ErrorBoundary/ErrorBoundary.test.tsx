import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): React.ReactElement {
  throw new Error("algo quebrou");
}

describe("ErrorBoundary", () => {
  it("renders children normally when there's no error", () => {
    render(
      <ErrorBoundary>
        <p>tudo certo</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("tudo certo")).toBeInTheDocument();
  });

  it("shows the default fallback and the error message when a child throws", () => {
    // React logs the error to console during the render pass that throws —
    // silence it for this test so the expected failure doesn't look like
    // test noise.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText("Essa tela não carregou corretamente.")).toBeInTheDocument();
    expect(screen.getByText("algo quebrou")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("uses a custom fallback renderer when provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={(error) => <p>Falhou: {error.message}</p>}>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText("Falhou: algo quebrou")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("clicking retry clears the error state (re-render attempt)", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    let shouldThrow = true;
    function MaybeBoom() {
      if (shouldThrow) throw new Error("primeira tentativa falhou");
      return <p>recuperado</p>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <MaybeBoom />
      </ErrorBoundary>
    );

    expect(screen.getByText("primeira tentativa falhou")).toBeInTheDocument();

    shouldThrow = false;
    await userEvent.click(screen.getByRole("button", { name: /Tentar de novo/ }));
    rerender(
      <ErrorBoundary>
        <MaybeBoom />
      </ErrorBoundary>
    );

    expect(screen.getByText("recuperado")).toBeInTheDocument();
    spy.mockRestore();
  });
});
