import type { Session } from "@supabase/supabase-js";

import { requireSupabase, supabase } from "@/services/supabase";

export async function signUp(email: string, password: string, fullName?: string) {
  return requireSupabase().auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName?.trim() || undefined,
      },
    },
  });
}

export async function signIn(email: string, password: string) {
  return requireSupabase().auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return requireSupabase().auth.signOut();
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  if (!supabase) {
    return { data: { subscription: { unsubscribe: () => undefined } } };
  }

  return supabase.auth.onAuthStateChange((_, session) => callback(session));
}
