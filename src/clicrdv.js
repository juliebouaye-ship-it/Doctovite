import {
  API_BASE,
  API_KEY,
  CALENDAR_IDS,
  CALENDAR_NAMES,
  GROUP_ID,
  INTERVENTION_ID,
  SCAN_DAYS,
} from "./config.js";

const WINDOW_DAYS = 7;

// Prestation de controle : la phototherapie a presque toujours des creneaux libres
export const PROBE_INTERVENTION_ID = 5027905;
export const PROBE_CALENDAR_ID = 691747;

function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function baseParams() {
  return new URLSearchParams({
    locale: "fr",
    apikey: API_KEY,
    results: "all",
  });
}

async function apiGet(path, params) {
  const response = await fetch(`${API_BASE}${path}?${params}`, {
    headers: {
      Accept: "application/json",
      Origin: "https://user.clicrdv.com",
    },
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    throw new Error(`API ClicRDV: HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchWindow(
  start,
  nDays,
  {
    interventionId = INTERVENTION_ID,
    calendarIds = CALENDAR_IDS,
  } = {}
) {
  const params = baseParams();
  params.append("intervention_ids[]", String(interventionId));
  params.set("start", formatDateTime(start));
  params.set("nDays", String(nDays));
  for (const id of calendarIds) {
    params.append("calendar_ids[]", String(id));
  }

  const data = await apiGet(`/groups/${GROUP_ID}/availabletimeslots`, params);
  return data.availabletimeslots || [];
}

export async function fetchAllSlots() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const seen = new Set();
  const merged = [];

  for (let offset = 0; offset < SCAN_DAYS; offset += WINDOW_DAYS) {
    const windowDays = Math.min(WINDOW_DAYS, SCAN_DAYS - offset);
    const start = new Date(today);
    start.setDate(start.getDate() + offset);

    const slots = await fetchWindow(start, windowDays);
    for (const slot of slots) {
      const key = `${slot.start}|${(slot.calendar_ids || []).join(",")}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(slot);
      }
    }
  }

  merged.sort((a, b) => a.start.localeCompare(b.start));
  return merged;
}

export async function fetchCalendars() {
  const data = await apiGet(`/groups/${GROUP_ID}/calendars`, baseParams());
  return data.records || [];
}

export async function fetchInterventions() {
  const data = await apiGet(`/groups/${GROUP_ID}/interventions`, baseParams());
  return data.records || [];
}

export function formatSlot(slot) {
  const [datePart, timePart] = slot.start.split(" ");
  const [y, m, d] = datePart.split("-");
  const [hh, mm] = timePart.split(":");
  const doctors = (slot.calendar_ids || [])
    .map((id) => CALENDAR_NAMES[id] || `Agenda ${id}`)
    .join(", ");
  return `${d}/${m}/${y} à ${hh}:${mm} — ${doctors}`;
}
