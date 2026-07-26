import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { DesktopShell, idToPath, pathToId } from "./DesktopShell";

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
}

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <DesktopShell crumbs={[{ label: "Orun OS" }]}>
                <div>conteúdo da tela</div>
              </DesktopShell>
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("idToPath / pathToId", () => {
  it("maps 'home' to the root path and back", () => {
    expect(idToPath("home")).toBe("/");
    expect(pathToId("/")).toBe("home");
  });

  it("maps other ids to /<id> and back", () => {
    expect(idToPath("chat")).toBe("/chat");
    expect(pathToId("/chat")).toBe("chat");
  });
});

describe("DesktopShell (routing integration)", () => {
  it("highlights the Sidebar item matching the current URL without an explicit activeId", () => {
    renderAt("/chat");
    // The active Sidebar button gets the accent-colored active styling —
    // simplest reliable check is that exactly one nav button carries it.
    const chatButton = screen.getByRole("button", { name: "Chat" });
    expect(chatButton.className).toMatch(/text-accent/);
  });

  it("navigating via the Sidebar updates the actual URL", async () => {
    renderAt("/");
    await userEvent.click(screen.getByRole("button", { name: "Projetos" }));
    expect(screen.getByTestId("current-path").textContent).toBe("/projects");
  });

  it("an explicit activeId prop overrides the URL-derived one", () => {
    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <DesktopShell activeId="settings" crumbs={[{ label: "Orun OS" }]}>
          <div>conteúdo</div>
        </DesktopShell>
      </MemoryRouter>
    );
    expect(screen.getByRole("button", { name: "Configurações" }).className).toMatch(/text-accent/);
  });
});
