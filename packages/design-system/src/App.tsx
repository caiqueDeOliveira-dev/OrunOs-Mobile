import React, { useEffect, useState, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Smartphone, Monitor, Mic, Palette } from "lucide-react";
import { useThemeStore } from "./theme/ThemeProvider";
import { useSyncStatusStore } from "./stores/syncStatusStore";
import { idToPath } from "./layouts/DesktopShell";
import { Loader } from "./components/Loader";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { lazyWithRetry, clearChunkRetryFlag } from "./utils/lazyWithRetry";
import type { OrunThemeName } from "./theme/tokens";

// Every screen is lazy-loaded: each is its own chunk, fetched only when its
// route (or mobile tab) is actually visited. This is what fixed Vite's
// "chunk larger than 500kB" build warning — the previous single bundle
// pulled in Three.js (via HamptonScene, used by Home/Chat/Voice Mode) even
// for people who only ever open Settings.
const HomeDesktop = lazyWithRetry(() => import("./pages/desktop/HomeDesktop").then((m) => ({ default: m.HomeDesktop })));
const Chat = lazyWithRetry(() => import("./pages/desktop/Chat").then((m) => ({ default: m.Chat })));
const VoiceMode = lazyWithRetry(() => import("./pages/desktop/VoiceMode").then((m) => ({ default: m.VoiceMode })));
const Projects = lazyWithRetry(() => import("./pages/desktop/Projects").then((m) => ({ default: m.Projects })));
const Developer = lazyWithRetry(() => import("./pages/desktop/Developer").then((m) => ({ default: m.Developer })));
const Memory = lazyWithRetry(() => import("./pages/desktop/Memory").then((m) => ({ default: m.Memory })));
const Studio = lazyWithRetry(() => import("./pages/desktop/Studio").then((m) => ({ default: m.Studio })));
const ImageGenerator = lazyWithRetry(() => import("./pages/desktop/ImageGenerator").then((m) => ({ default: m.ImageGenerator })));
const VideoGenerator = lazyWithRetry(() => import("./pages/desktop/VideoGenerator").then((m) => ({ default: m.VideoGenerator })));
const MusicStudio = lazyWithRetry(() => import("./pages/desktop/MusicStudio").then((m) => ({ default: m.MusicStudio })));
const Health = lazyWithRetry(() => import("./pages/desktop/Health").then((m) => ({ default: m.Health })));
const Finance = lazyWithRetry(() => import("./pages/desktop/Finance").then((m) => ({ default: m.Finance })));
const Automation = lazyWithRetry(() => import("./pages/desktop/Automation").then((m) => ({ default: m.Automation })));
const Research = lazyWithRetry(() => import("./pages/desktop/Research").then((m) => ({ default: m.Research })));
const Settings = lazyWithRetry(() => import("./pages/desktop/Settings").then((m) => ({ default: m.Settings })));
const Profile = lazyWithRetry(() => import("./pages/desktop/Profile").then((m) => ({ default: m.Profile })));
const Notifications = lazyWithRetry(() => import("./pages/desktop/Notifications").then((m) => ({ default: m.Notifications })));
const Updates = lazyWithRetry(() => import("./pages/desktop/Updates").then((m) => ({ default: m.Updates })));
const PluginManager = lazyWithRetry(() => import("./pages/desktop/PluginManager").then((m) => ({ default: m.PluginManager })));

const HomeMobile = lazyWithRetry(() => import("./pages/mobile/HomeMobile").then((m) => ({ default: m.HomeMobile })));
const ChatMobile = lazyWithRetry(() => import("./pages/mobile/ChatMobile").then((m) => ({ default: m.ChatMobile })));
const StudioMobile = lazyWithRetry(() => import("./pages/mobile/StudioMobile").then((m) => ({ default: m.StudioMobile })));
const SettingsMobile = lazyWithRetry(() => import("./pages/mobile/SettingsMobile").then((m) => ({ default: m.SettingsMobile })));

const themeOrder: OrunThemeName[] = ["bloodred", "dark", "premium", "minimal"];

const mobileScreens: Record<string, React.ComponentType<{ activeTab: string; onTabChange: (id: string) => void }>> = {
  home: HomeMobile,
  chat: ChatMobile,
  studio: StudioMobile,
  settings: SettingsMobile,
};

/** Studio's onOpen navigates to the chosen generator's real route. */
function StudioRoute() {
  const navigate = useNavigate();
  return <Studio onOpen={(id) => navigate(idToPath(id))} />;
}

/** Voice Mode is a real route (`/voice`); closing it goes back to Home. */
function VoiceModeRoute() {
  const navigate = useNavigate();
  return <VoiceMode onClose={() => navigate("/")} />;
}

function RouteFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg-base">
      <Loader variant="spinner" size="lg" />
    </div>
  );
}

/**
 * Preview shell for the whole design system. Real routing via
 * react-router-dom — every screen has a real URL (`/chat`, `/settings`,
 * etc.), the browser back/forward buttons work, and each screen's own
 * Sidebar (inside DesktopShell) navigates through the router, not a
 * hand-rolled state machine.
 *
 * Wrapped in <HashRouter> at the entry point (main.tsx) instead of
 * <BrowserRouter> — a packaged Electron app loads from `file://`, where
 * BrowserRouter's history API breaks on refresh/relaunch. Hash routing
 * (`#/chat`) works everywhere, including plain static file serving.
 *
 * Every screen import above is `React.lazy` — each screen is its own chunk,
 * loaded on first visit rather than all bundled together up front.
 */
export function App() {
  const { theme, setTheme } = useThemeStore();
  const [mobilePreview, setMobilePreview] = useState(false);
  const [mobileTab, setMobileTab] = useState("home");
  const navigate = useNavigate();

  useEffect(() => {
    // The app mounted and rendered without a lazy chunk failure — clear any
    // leftover retry flag from a previous session so a future deploy gets
    // its own fresh one-time retry instead of being silently blocked.
    clearChunkRetryFlag();

    // Preview-only mock data — in the real Electron app this comes from
    // polling SyncService.getSyncStatus() over IPC (see orun-supabase-sync
    // README). Never fake this in production code, only here for the demo.
    useSyncStatusStore.getState().setStatus({
      pending: 2,
      deadLetterCount: 1,
      lastSuccessAt: new Date(Date.now() - 3 * 60_000).toISOString(),
      lastError: null,
      isRunning: false,
      realtimeEnabled: false,
    });
  }, []);

  if (mobilePreview) {
    const MobileScreen = mobileScreens[mobileTab] ?? HomeMobile;
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-sunken">
        <div className="relative h-[812px] w-[375px] overflow-hidden rounded-[2.5rem] border-4 border-surface-active shadow-panel [transform:translateZ(0)]">
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <MobileScreen activeTab={mobileTab} onTabChange={setMobileTab} />
            </Suspense>
          </ErrorBoundary>
        </div>
        <DevToolbar
          mobilePreview={mobilePreview}
          setMobilePreview={setMobilePreview}
          onOpenVoiceMode={() => navigate("/voice")}
          theme={theme}
          setTheme={setTheme}
        />
      </div>
    );
  }

  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomeDesktop />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/voice" element={<VoiceModeRoute />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/developer" element={<Developer />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/studio" element={<StudioRoute />} />
            <Route path="/image" element={<ImageGenerator />} />
            <Route path="/video" element={<VideoGenerator />} />
            <Route path="/music" element={<MusicStudio />} />
            <Route path="/health" element={<Health />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/research" element={<Research />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/plugins" element={<PluginManager />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <DevToolbar
        mobilePreview={mobilePreview}
        setMobilePreview={setMobilePreview}
        onOpenVoiceMode={() => navigate("/voice")}
        theme={theme}
        setTheme={setTheme}
      />
    </>
  );
}

function DevToolbar({
  mobilePreview,
  setMobilePreview,
  onOpenVoiceMode,
  theme,
  setTheme,
}: {
  mobilePreview: boolean;
  setMobilePreview: (v: boolean) => void;
  onOpenVoiceMode: () => void;
  theme: OrunThemeName;
  setTheme: (t: OrunThemeName) => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border/10 bg-bg-elevated/90 backdrop-blur-glass px-2 py-1.5 shadow-panel">
      <button
        onClick={() => setMobilePreview(!mobilePreview)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        title="Alternar preview Desktop/Mobile"
      >
        {mobilePreview ? <Monitor size={14} /> : <Smartphone size={14} />}
        {mobilePreview ? "Desktop" : "Mobile"}
      </button>
      <button
        onClick={onOpenVoiceMode}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        title="Abrir Voice Mode"
      >
        <Mic size={14} /> Voice Mode
      </button>
      <button
        onClick={() => {
          const next = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length];
          setTheme(next);
        }}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        title="Ciclar tema"
      >
        <Palette size={14} /> {theme}
      </button>
    </div>
  );
}
