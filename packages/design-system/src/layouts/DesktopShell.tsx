import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home, MessageSquare, FolderKanban, Code2, Brain, Sparkles, Image as ImageIcon,
  Video, Music, HeartPulse, Wallet, Workflow, Search, Settings, User, Bell,
  RefreshCw, Puzzle, Mic,
} from "lucide-react";
import { Sidebar, SidebarItem } from "../components/Sidebar";
import { Navigation, NavigationCrumb } from "../components/Navigation";
import { StatusChip } from "../components/StatusChip";

export const NAV_ITEMS: SidebarItem[] = [
  { id: "home", label: "Início", icon: <Home size={18} /> },
  { id: "chat", label: "Chat", icon: <MessageSquare size={18} /> },
  { id: "voice", label: "Voice Mode", icon: <Mic size={18} /> },
  { id: "projects", label: "Projetos", icon: <FolderKanban size={18} /> },
  { id: "developer", label: "Developer", icon: <Code2 size={18} /> },
  { id: "memory", label: "Memória", icon: <Brain size={18} /> },
  { id: "studio", label: "Studio", icon: <Sparkles size={18} /> },
  { id: "image", label: "Imagem", icon: <ImageIcon size={18} /> },
  { id: "video", label: "Vídeo", icon: <Video size={18} /> },
  { id: "music", label: "Música", icon: <Music size={18} /> },
  { id: "health", label: "Saúde", icon: <HeartPulse size={18} /> },
  { id: "finance", label: "Finanças", icon: <Wallet size={18} /> },
  { id: "automation", label: "Automação", icon: <Workflow size={18} /> },
  { id: "research", label: "Pesquisa", icon: <Search size={18} /> },
  { id: "settings", label: "Configurações", icon: <Settings size={18} /> },
  { id: "profile", label: "Perfil", icon: <User size={18} /> },
  { id: "notifications", label: "Notificações", icon: <Bell size={18} /> },
  { id: "updates", label: "Atualizações", icon: <RefreshCw size={18} /> },
  { id: "plugins", label: "Plugins", icon: <Puzzle size={18} /> },
];

/** `home` lives at `/`, everything else at `/<id>` — kept in one place. */
export function idToPath(id: string) {
  return id === "home" ? "/" : `/${id}`;
}

export function pathToId(pathname: string) {
  if (pathname === "/" || pathname === "") return "home";
  return pathname.replace(/^\//, "").split("/")[0];
}

export interface DesktopShellProps {
  /** Optional override — by default the active item is derived from the current URL. */
  activeId?: string;
  /** Optional override — by default Sidebar clicks navigate via react-router. */
  onNavigate?: (id: string) => void;
  crumbs: NavigationCrumb[];
  navActions?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}

/**
 * Single source of truth for the desktop app frame: Sidebar (full nav, 19
 * destinations) + Navigation top bar. Every desktop screen composes itself
 * inside <DesktopShell>...</DesktopShell> — the sidebar/nav are never
 * re-implemented per screen.
 *
 * Must render inside a Router (see src/App.tsx, which wraps everything in
 * <HashRouter> — hash routing because a packaged Electron app loads from
 * `file://`, where a plain BrowserRouter's history API breaks on refresh).
 */
export function DesktopShell({
  activeId,
  onNavigate,
  crumbs,
  navActions,
  children,
  contentClassName = "",
}: DesktopShellProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const resolvedActiveId = activeId ?? pathToId(location.pathname);

  return (
    <div className="flex h-screen w-screen bg-bg-base overflow-hidden">
      <Sidebar
        items={NAV_ITEMS}
        activeId={resolvedActiveId}
        onSelect={(id) => (onNavigate ? onNavigate(id) : navigate(idToPath(id)))}
        header={
          <div className="flex items-center gap-2 px-1">
            <div className="h-7 w-7 rounded-md bg-accent shadow-glow" />
            <span className="text-sm font-semibold text-text-primary tracking-tight">Orun OS</span>
          </div>
        }
        footer={<StatusChip status="online" label="6 provedores conectados" />}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <Navigation crumbs={crumbs} actions={navActions} />
        <main className={`flex-1 min-h-0 overflow-y-auto ${contentClassName}`}>{children}</main>
      </div>
    </div>
  );
}
