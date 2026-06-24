import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, DB_PATH } from "./config.js";

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readStore() {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    return { checks: [], knownSlots: {} };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeStore(store) {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function slotKey(slot) {
  return `${slot.start}|${(slot.calendar_ids || []).join(",")}`;
}

export function getKnownSlotKeys() {
  return new Set(Object.keys(readStore().knownSlots));
}

export function rememberSlots(slots) {
  const store = readStore();
  const now = new Date().toISOString();
  for (const slot of slots) {
    const key = slotKey(slot);
    if (!store.knownSlots[key]) {
      store.knownSlots[key] = now;
    }
  }
  writeStore(store);
}

export function saveCheck(slotCount, slots, { notified = false, error = null } = {}) {
  const store = readStore();
  const check = {
    id: store.checks.length ? store.checks[0].id + 1 : 1,
    checked_at: new Date().toISOString(),
    slot_count: slotCount,
    slots,
    notified,
    error,
  };
  store.checks.unshift(check);
  store.checks = store.checks.slice(0, 200);
  writeStore(store);
  return check.id;
}

export function getRecentChecks(limit = 50) {
  return readStore().checks.slice(0, limit);
}

export function getLatestCheck() {
  const checks = getRecentChecks(1);
  return checks[0] || null;
}
