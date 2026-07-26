import React, { useState } from "react";
import { Menu, Bell } from "lucide-react";
import { BottomNavigation, BottomNavItem } from "../components/BottomNavigation";
import { Drawer } from "../components/Drawer";

export interface MobileMenuItem {
  label: string;
  onClick: () => void;
}

export interface MobileShellProps {
  title?: string;
  tabs: BottomNavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  menuItems?: MobileMenuItem[];
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  /** Extra floating elements (e.g. FloatingButton) rendered above BottomNavigation. */
  floating?: React.ReactNode;
}

/**
 * Single source of truth for the mobile app frame: top bar (menu + title +
 * right action) + BottomNavigation + a left Drawer for secondary
 * destinations that don't fit in the 4-tab bar. Mirrors what DesktopShell
 * does for desktop screens — every mobile screen composes itself inside
 * <MobileShell>...</MobileShell> instead of re-implementing this chrome.
 *
 * Unlike DesktopShell, this is NOT wired to react-router by default: mobile
 * tabs are controlled props (`activeTab`/`onTabChange`), same pattern as
 * BottomNavigation itself, since the mobile app is a separate device
 * experience previewed inside the same codebase rather than sharing desktop
 * URLs. Wire it to your mobile app's own router the same way DesktopShell
 * is wired to react-router-dom, if/when the mobile app grows one.
 */
export function MobileShell({
  title = "Orun OS",
  tabs,
  activeTab,
  onTabChange,
  menuItems = [],
  rightAction,
  children,
  floating,
}: MobileShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative flex h-full w-full flex-col bg-bg-base overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between px-4">
        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-md p-2 text-text-secondary hover:bg-surface-hover"
        >
          <Menu size={20} />
        </button>
        <span className="text-sm font-semibold text-text-primary tracking-tight">{title}</span>
        {rightAction ?? (
          <button className="rounded-md p-2 text-text-secondary hover:bg-surface-hover">
            <Bell size={20} />
          </button>
        )}
      </header>

      <div className="flex-1 min-h-0 flex flex-col">{children}</div>

      {floating}

      <BottomNavigation items={tabs} activeId={activeTab} onSelect={onTabChange} />

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} side="left">
        <div className="p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Menu</h2>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick();
                  setMenuOpen(false);
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </Drawer>
    </div>
  );
}
