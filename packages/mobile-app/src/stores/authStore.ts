import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";
import { unregisterBackgroundTask } from "../services/backgroundService";

interface AuthStore {
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<string | null>;
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

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ loading: false, error: error.message });
      return error.message;
    }
    set({ session: data.session, loading: false });
    return null;
  },

  signOut: async () => {
    await unregisterBackgroundTask();
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

/**
 * Returns the current user's ID, or null if not authenticated.
 * Used by services that need to set user_id on new rows.
 */
export function getUserId(): string | null {
  return useAuthStore.getState().session?.user?.id ?? null;
}
