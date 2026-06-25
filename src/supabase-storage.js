import {
  API_KEY,
  CALENDAR_IDS,
  CALENDAR_NAMES,
  CHECK_INTERVAL_MINUTES,
  GROUP_ID,
  INTERVENTION_ID,
  NTFY_TOPIC,
  SCAN_DAYS,
} from "./config.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase.js";
import { slotKey } from "./storage.js";

const WATCH_ID = process.env.WATCH_ID || "";

export function supabaseEnabled() {
  return isSupabaseConfigured();
}

export async function getActiveWatch() {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  if (WATCH_ID) {
    const { data, error } = await sb
      .from("watches")
      .select("*, cabinets(*)")
      .eq("id", WATCH_ID)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  const { data, error } = await sb
    .from("watches")
    .select("*, cabinets(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getKnownSlotKeysForWatch(watchId) {
  const sb = getSupabaseAdmin();
  if (!sb || !watchId) return new Set();

  const { data, error } = await sb
    .from("known_slots")
    .select("slot_key")
    .eq("watch_id", watchId);
  if (error) throw error;
  return new Set((data || []).map((row) => row.slot_key));
}

export async function rememberSlotsForWatch(watchId, slots) {
  const sb = getSupabaseAdmin();
  if (!sb || !watchId || !slots.length) return;

  const rows = slots.map((slot) => ({
    watch_id: watchId,
    slot_key: slotKey(slot),
    first_seen_at: new Date().toISOString(),
  }));

  const { error } = await sb
    .from("known_slots")
    .upsert(rows, { onConflict: "watch_id,slot_key", ignoreDuplicates: true });
  if (error) throw error;
}

export async function saveCheckForWatch(
  watchId,
  slotCount,
  slots,
  { notified = false, error = null } = {}
) {
  const sb = getSupabaseAdmin();
  if (!sb || !watchId) return null;

  const { data, error: insertError } = await sb
    .from("checks")
    .insert({
      watch_id: watchId,
      checked_at: new Date().toISOString(),
      slot_count: slotCount,
      slots,
      notified,
      error,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;
  return data.id;
}

export async function getRecentChecksForWatch(watchId, limit = 20) {
  const sb = getSupabaseAdmin();
  if (!sb || !watchId) return [];

  const { data, error } = await sb
    .from("checks")
    .select("*")
    .eq("watch_id", watchId)
    .order("checked_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function buildStatusFromSupabase() {
  const watch = await getActiveWatch();
  if (!watch) return null;

  const history = await getRecentChecksForWatch(watch.id, 20);
  const latest = history[0] || null;

  return {
    now: new Date().toISOString(),
    check_interval_minutes: watch.check_interval_minutes ?? CHECK_INTERVAL_MINUTES,
    scan_days: watch.scan_days ?? SCAN_DAYS,
    ntfy_configured: Boolean(watch.ntfy_topic || NTFY_TOPIC),
    watch_status: watch.status,
    cabinet: watch.cabinets || null,
    latest: latest
      ? {
          checked_at: latest.checked_at,
          slot_count: latest.slot_count,
          slots: latest.slots || [],
          notified: latest.notified,
          error: latest.error,
        }
      : null,
    history: history.map((row) => ({
      checked_at: row.checked_at,
      slot_count: row.slot_count,
      notified: row.notified,
      error: row.error,
    })),
  };
}

export async function ensureDefaultWatch(cabinet) {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase non configuré");

  const { data: existing, error: findError } = await sb
    .from("watches")
    .select("id")
    .eq("cabinet_id", cabinet.id)
    .eq("status", "active")
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id;

  const { data, error } = await sb
    .from("watches")
    .insert({
      cabinet_id: cabinet.id,
      status: "active",
      group_id: GROUP_ID,
      api_key: API_KEY,
      intervention_id: INTERVENTION_ID,
      calendar_ids: CALENDAR_IDS,
      calendar_names: CALENDAR_NAMES,
      ntfy_topic: NTFY_TOPIC || null,
      check_interval_minutes: CHECK_INTERVAL_MINUTES,
      scan_days: SCAN_DAYS,
      label: "Veille principale",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
