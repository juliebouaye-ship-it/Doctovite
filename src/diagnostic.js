import {
  CALENDAR_IDS,
  CALENDAR_NAMES,
  INTERVENTION_ID,
  SCAN_DAYS,
} from "./config.js";
import {
  fetchAllSlots,
  fetchCalendars,
  fetchInterventions,
  fetchWindow,
  formatSlot,
  PROBE_CALENDAR_ID,
  PROBE_INTERVENTION_ID,
} from "./clicrdv.js";

const WINDOW_DAYS = 7;

async function runProbe() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots = await fetchWindow(today, 14, {
    interventionId: PROBE_INTERVENTION_ID,
    calendarIds: [PROBE_CALENDAR_ID],
  });

  return {
    label: "Photothérapie (test de contrôle API)",
    intervention_id: PROBE_INTERVENTION_ID,
    calendar_id: PROBE_CALENDAR_ID,
    slot_count: slots.length,
    first_slots: slots.slice(0, 5).map(formatSlot),
    ok: slots.length > 0,
  };
}

function buildSummary(availableCount, probe, errors) {
  if (errors.length > 0) {
    return `Erreurs : ${errors.join(" ; ")}`;
  }
  if (probe?.ok) {
    return (
      `API OK — ${availableCount} créneau(x) libre(s) pour grains de beauté, ` +
      `${probe.slot_count} créneau(x) détecté(s) sur le test photothérapie.`
    );
  }
  return (
    `${availableCount} créneau(x) libre(s) pour grains de beauté, ` +
    "mais le test de contrôle API a échoué."
  );
}

export async function runDiagnostic() {
  const started = Date.now();
  const errors = [];

  let calendars = [];
  let interventions = [];
  let targetIntervention = null;
  const windows = [];
  const slots = [];
  let probe = null;

  try {
    calendars = await fetchCalendars();
  } catch (error) {
    errors.push(`Agendas : ${error.message}`);
  }

  try {
    interventions = await fetchInterventions();
    targetIntervention = interventions.find((item) => item.id === INTERVENTION_ID);
  } catch (error) {
    errors.push(`Prestations : ${error.message}`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const seen = new Set();

  for (let offset = 0; offset < SCAN_DAYS; offset += WINDOW_DAYS) {
    const windowDays = Math.min(WINDOW_DAYS, SCAN_DAYS - offset);
    const start = new Date(today);
    start.setDate(start.getDate() + offset);

    try {
      const windowSlots = await fetchWindow(start, windowDays);
      windows.push({
        from: start.toISOString().slice(0, 10),
        days: windowDays,
        available_count: windowSlots.length,
      });

      for (const slot of windowSlots) {
        const key = `${slot.start}|${(slot.calendar_ids || []).join(",")}`;
        if (!seen.has(key)) {
          seen.add(key);
          slots.push(slot);
        }
      }
    } catch (error) {
      errors.push(`Fenêtre ${start.toISOString().slice(0, 10)} : ${error.message}`);
    }
  }

  slots.sort((a, b) => a.start.localeCompare(b.start));

  try {
    probe = await runProbe();
  } catch (error) {
    errors.push(`Test de contrôle : ${error.message}`);
    probe = { ok: false, error: String(error) };
  }

  const elapsedMs = Date.now() - started;
  const apiOk = Boolean(probe?.ok) && errors.length === 0;

  return {
    ok: apiOk,
    elapsed_ms: elapsedMs,
    scan_days: SCAN_DAYS,
    target_intervention: {
      id: INTERVENTION_ID,
      name:
        targetIntervention?.publicname?.trim() ||
        "1ère consultation pour examen des grains de beauté",
    },
    calendars_monitored: CALENDAR_IDS.map((id) => ({
      id,
      name: CALENDAR_NAMES[id] || `Agenda ${id}`,
    })),
    calendars_found: calendars.length,
    available_slots: {
      count: slots.length,
      formatted: slots.slice(0, 20).map(formatSlot),
      windows,
    },
    occupied_slots_note:
      "L'API publique ClicRDV ne donne pas la liste des RDV déjà pris " +
      "(données protégées). On ne peut récupérer que les créneaux LIBRES.",
    probe,
    errors,
    summary: buildSummary(slots.length, probe, errors),
  };
}

export function printDiagnostic(result) {
  console.log("");
  console.log("=== Diagnostic ClicRDV ===");
  console.log(result.summary);
  console.log(`Durée : ${(result.elapsed_ms / 1000).toFixed(1)} s`);
  console.log("");
  console.log(`Prestation surveillée : ${result.target_intervention.name}`);
  console.log(`Médecins : ${result.calendars_monitored.map((c) => c.name).join(", ")}`);
  console.log(`Fenêtre balayée : ${result.scan_days} jours (${result.available_slots.windows.length} requêtes)`);
  console.log("");
  console.log(`Créneaux LIBRES (grains de beauté) : ${result.available_slots.count}`);
  if (result.available_slots.formatted.length > 0) {
    for (const line of result.available_slots.formatted) {
      console.log(`  • ${line}`);
    }
  } else {
    console.log("  (aucun — agenda complet ou pas encore ouvert en ligne)");
  }
  console.log("");
  console.log("Note :", result.occupied_slots_note);
  console.log("");
  if (result.probe) {
    console.log(`Test de contrôle (${result.probe.label}) : ${result.probe.ok ? "OK" : "ÉCHEC"}`);
    console.log(`  ${result.probe.slot_count} créneau(x) libre(s) détecté(s)`);
    for (const line of result.probe.first_slots || []) {
      console.log(`  • ${line}`);
    }
  }
  if (result.errors.length > 0) {
    console.log("");
    console.log("Erreurs :");
    for (const error of result.errors) {
      console.log(`  ! ${error}`);
    }
  }
  console.log("");
}
