import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  isStreaming?: boolean;
}

export type HamptonMood = "idle" | "listening" | "thinking" | "speaking";

interface ChatStore {
  messages: ChatMessage[];
  mood: HamptonMood;
  activeAgentId: string;
  setMood: (mood: HamptonMood) => void;
  setActiveAgent: (agentId: string) => void;
  sendMessage: (content: string) => void;
}

function now() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Chat state shared by the Chat and Voice Mode screens.
 * `sendMessage` currently mocks a streamed reply — swap the body for a real
 * call into the provider layer (services/providers/*) when wiring the
 * Electron IPC bridge to Ollama/Claude/OpenAI/OpenRouter/Groq/GitHub Models.
 */
export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  mood: "idle",
  activeAgentId: "hampton",

  setMood: (mood) => set({ mood }),
  setActiveAgent: (agentId) => set({ activeAgentId: agentId }),

  sendMessage: (content) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      agentId: "user",
      agentName: "Você",
      timestamp: now(),
    };

    const replyId = crypto.randomUUID();
    const agentReply: ChatMessage = {
      id: replyId,
      role: "agent",
      content: "",
      agentId: get().activeAgentId,
      agentName: "Hampton",
      timestamp: now(),
      isStreaming: true,
    };

    set((state) => ({ messages: [...state.messages, userMessage, agentReply], mood: "thinking" }));

    // --- mock streaming reply; replace with real provider stream ---
    const fullReply =
      "Entendido. Estou processando isso — quando os provedores reais estiverem conectados via IPC, essa resposta vem do modelo escolhido para este agente.";
    let i = 0;

    const interval = setInterval(() => {
      i += 3;
      set((state) => ({
        mood: "speaking",
        messages: state.messages.map((m) =>
          m.id === replyId ? { ...m, content: fullReply.slice(0, i), isStreaming: i < fullReply.length } : m
        ),
      }));
      if (i >= fullReply.length) {
        clearInterval(interval);
        set({ mood: "idle" });
      }
    }, 24);
  },
}));
