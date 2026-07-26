import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileShell } from "./MobileShell";

const tabs = [
  { id: "home", label: "Início", icon: <span>H</span> },
  { id: "chat", label: "Chat", icon: <span>C</span> },
];

describe("MobileShell", () => {
  it("renders the title and children", () => {
    render(
      <MobileShell title="Minha Tela" tabs={tabs} activeTab="home" onTabChange={() => {}}>
        <p>conteúdo da tela</p>
      </MobileShell>
    );
    expect(screen.getByText("Minha Tela")).toBeInTheDocument();
    expect(screen.getByText("conteúdo da tela")).toBeInTheDocument();
  });

  it("calls onTabChange when a bottom tab is tapped", async () => {
    const onTabChange = vi.fn();
    render(
      <MobileShell tabs={tabs} activeTab="home" onTabChange={onTabChange}>
        <p>conteúdo</p>
      </MobileShell>
    );
    const chatButton = screen.getByText("Chat").closest("button");
    expect(chatButton).not.toBeNull();
    await userEvent.click(chatButton!);
    expect(onTabChange).toHaveBeenCalledWith("chat");
  });

  it("opens the side drawer and fires the right menu item's callback", async () => {
    const onProjectsClick = vi.fn();
    render(
      <MobileShell
        tabs={tabs}
        activeTab="home"
        onTabChange={() => {}}
        menuItems={[{ label: "Projetos", onClick: onProjectsClick }]}
      >
        <p>conteúdo</p>
      </MobileShell>
    );

    // Drawer content isn't visible until the menu button is tapped.
    expect(screen.queryByText("Projetos")).not.toBeInTheDocument();

    const menuButtons = screen.getAllByRole("button");
    await userEvent.click(menuButtons[0]); // hamburger icon is the first button in the header

    await userEvent.click(screen.getByText("Projetos"));
    expect(onProjectsClick).toHaveBeenCalledTimes(1);
  });
});
