import { fetchAllSlots, formatSlot } from "./clicrdv.js";
import {
  CHECK_INTERVAL_MINUTES,
  NTFY_TOPIC,
  SCAN_DAYS,
} from "./config.js";
import { notifySlots } from "./notify.js";
import {
  getKnownSlotKeys,
  getLatestCheck,
  getRecentChecks,
  rememberSlots,
  saveCheck,
  slotKey,
} from "./storage.js";
import {
  buildStatusFromSupabase,
  getActiveWatch,
  getKnownSlotKeysForWatch,
  rememberSlotsForWatch,
  saveCheckForWatch,
  supabaseEnabled,
} from "./supabase-storage.js";

export async function runCheck(sendNotification = true) {
  const watch = supabaseEnabled() ? await getActiveWatch() : null;

  if (supabaseEnabled() && !watch) {
    console.log(`[${new Date().toISOString()}] Veille en pause — scan ignoré`);
    return {
      ok: true,
      skipped: true,
      slot_count: 0,
      new_slot_count: 0,
      notified: false,
      slots: [],
      new_slots: [],
      formatted_slots: [],
    };
  }

  try {
    const slots = await fetchAllSlots();
    const known = watch
      ? await getKnownSlotKeysForWatch(watch.id)
      : getKnownSlotKeys();
    const newSlots = slots.filter((slot) => !known.has(slotKey(slot)));

    let notified = false;
    if (sendNotification && newSlots.length > 0 && NTFY_TOPIC) {
      await notifySlots(newSlots);
      notified = true;
    }

    if (slots.length > 0) {
      if (watch) {
        await rememberSlotsForWatch(watch.id, slots);
      } else {
        rememberSlots(slots);
      }
    }

    let checkId;
    if (watch) {
      checkId = await saveCheckForWatch(watch.id, slots.length, slots, {
        notified,
      });
    } else {
      checkId = saveCheck(slots.length, slots, { notified });
    }

    return {
      ok: true,
      check_id: checkId,
      slot_count: slots.length,
      new_slot_count: newSlots.length,
      notified,
      slots,
      new_slots: newSlots,
      formatted_slots: slots.map(formatSlot),
    };
  } catch (error) {
    if (watch) {
      await saveCheckForWatch(watch.id, 0, [], {
        notified: false,
        error: String(error),
      });
    } else {
      saveCheck(0, [], { notified: false, error: String(error) });
    }
    return {
      ok: false,
      check_id: null,
      slot_count: 0,
      new_slot_count: 0,
      notified: false,
      slots: [],
      new_slots: [],
      error: String(error),
    };
  }
}

export async function buildStatus() {
  if (supabaseEnabled()) {
    const fromSupabase = await buildStatusFromSupabase();
    if (fromSupabase) return fromSupabase;
  }

  return {
    now: new Date().toISOString(),
    check_interval_minutes: CHECK_INTERVAL_MINUTES,
    scan_days: SCAN_DAYS,
    ntfy_configured: Boolean(NTFY_TOPIC),
    ntfy_topic: NTFY_TOPIC || null,
    latest: getLatestCheck(),
    history: getRecentChecks(20),
  };
}
