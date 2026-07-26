// This store is maintained for future use when agent-level state management
// is needed across screens (e.g., active agent mood, agent selection persistence).
// Currently, the useChat hook handles per-screen chat state independently.

import { create } from "zustand";
import type { OrunAgent, HamptonMood } from "../types";

interface ChatStore {
  mood: HamptonMood;
  activeAgentId: string;
  activeAgent: OrunAgent | null;
  agents: OrunAgent[];
  setMood: (mood: HamptonMood) => void;
  setActiveAgent: (agentId: string) => void;
  setAgents: (agents: OrunAgent[]) => void;
  setActiveAgentData: (agent: OrunAgent | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  mood: "idle",
  activeAgentId: "hampton",
  activeAgent: null,
  agents: [],

  setMood: (mood) => set({ mood }),
  setActiveAgent: (agentId) => set({ activeAgentId: agentId }),
  setAgents: (agents) => set({ agents }),
  setActiveAgentData: (agent) => set({ activeAgent: agent }),
}));
