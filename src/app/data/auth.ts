import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseData";

export async function getCurrentSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInAdmin(email: string, password: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOutAdmin(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function subscribeToAuthChanges(
  onAuthChange: (session: Session | null) => void
): () => void {
  if (!supabase) return () => {};

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    onAuthChange(session);
  });

  return () => {
    subscription.unsubscribe();
  };
}

export async function requireAuthenticatedSession(): Promise<void> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Please sign in as admin to continue.");
  }
}