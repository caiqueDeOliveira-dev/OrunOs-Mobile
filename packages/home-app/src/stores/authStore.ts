// Orun Home — auth store (mirrors mobile-app authStore; same Supabase project).

import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";

interface AuthStore {
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  loading: true,
  error: null,

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ session: data.session, loading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },

  restoreSession: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, loading: false });
  },
}));

supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.setState({ session, loading: false });
});

export function getUserId(): string | null {
  return useAuthStore.getState().session?.user?.id ?? null;
}
