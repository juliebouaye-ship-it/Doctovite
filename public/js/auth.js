import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ALLOWED_EMAIL,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "/js/supabase-config.js";

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export function isEmailAllowed(email) {
  if (!ALLOWED_EMAIL) return true;
  return email.trim().toLowerCase() === ALLOWED_EMAIL.trim().toLowerCase();
}

export async function requireAuth() {
  if (!supabase) {
    location.href = "/login.html";
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const next = encodeURIComponent(location.pathname);
    location.href = `/login.html?next=${next}`;
    return null;
  }

  return session;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
  location.href = "/login.html";
}

export async function claimWatchIfNeeded(watch) {
  if (!watch || watch.owner_id || !supabase) return watch;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email || "")) return null;

  const { data, error } = await supabase
    .from("watches")
    .update({ owner_id: user.id })
    .eq("id", watch.id)
    .is("owner_id", null)
    .select("*, cabinets(*)")
    .maybeSingle();

  if (error) throw error;
  return data || watch;
}

export async function fetchOwnedWatch() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("watches")
    .select("*, cabinets(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const { data: paused, error: pausedError } = await supabase
      .from("watches")
      .select("*, cabinets(*)")
      .in("status", ["paused", "completed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pausedError) throw pausedError;
    return paused ? await claimWatchIfNeeded(paused) : null;
  }

  return claimWatchIfNeeded(data);
}
