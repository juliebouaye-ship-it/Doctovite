#!/usr/bin/env node
/**
 * Initialise Supabase : catalogue, watch active, historique local optionnel.
 * Usage : node scripts/migrate-to-supabase.js
 * Requiert SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  API_KEY,
  CALENDAR_IDS,
  CALENDAR_NAMES,
  CHECK_INTERVAL_MINUTES,
  DATA_DIR,
  GROUP_ID,
  INTERVENTION_ID,
  NTFY_TOPIC,
  SCAN_DAYS,
} from "../src/config.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "../src/supabase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(DATA_DIR, "catalog.json");
const checksPath = path.join(DATA_DIR, "checks.json");

if (!isSupabaseConfigured()) {
  console.error("Ajoutez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env");
  process.exit(1);
}

const sb = getSupabaseAdmin();

function loadCatalog() {
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Fichier introuvable : ${catalogPath}`);
  }
  return JSON.parse(fs.readFileSync(catalogPath, "utf8")).cabinets || [];
}

async function upsertCabinet(cabinet) {
  const { error } = await sb.from("cabinets").upsert(
    {
      id: cabinet.id,
      name: cabinet.name,
      city: cabinet.city,
      department: cabinet.department,
      sector: cabinet.sector,
      booking_url: cabinet.booking_url,
      status: cabinet.status || "active",
      interventions: cabinet.interventions || [],
      calendars: cabinet.calendars || [],
      note: cabinet.note || null,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

async function ensureWatch(cabinetId) {
  const { data: existing, error: findError } = await sb
    .from("watches")
    .select("id")
    .eq("cabinet_id", cabinetId)
    .eq("status", "active")
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id;

  const { data, error } = await sb
    .from("watches")
    .insert({
      cabinet_id: cabinetId,
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

async function importChecks(watchId) {
  if (!fs.existsSync(checksPath)) {
    console.log("Pas de checks.json local — historique ignoré.");
    return 0;
  }

  const store = JSON.parse(fs.readFileSync(checksPath, "utf8"));
  const checks = store.checks || [];
  if (!checks.length) return 0;

  const rows = checks.map((check) => ({
    watch_id: watchId,
    checked_at: check.checked_at,
    slot_count: check.slot_count,
    slots: check.slots || [],
    notified: Boolean(check.notified),
    error: check.error,
  }));

  const { error } = await sb.from("checks").insert(rows);
  if (error) throw error;
  return rows.length;
}

async function main() {
  const cabinets = loadCatalog();
  console.log(`→ ${cabinets.length} cabinet(s) à synchroniser`);

  for (const cabinet of cabinets) {
    await upsertCabinet(cabinet);
    console.log(`  ✓ cabinet ${cabinet.id}`);
  }

  const primary = cabinets[0];
  const watchId = await ensureWatch(primary.id);
  console.log(`→ watch active : ${watchId}`);
  console.log(`  Ajoutez dans .env : WATCH_ID=${watchId}`);

  const imported = await importChecks(watchId);
  console.log(`→ ${imported} check(s) importé(s) depuis checks.json local`);

  console.log("\nTerminé. Exécutez aussi supabase/policies.sql si ce n'est pas fait.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
