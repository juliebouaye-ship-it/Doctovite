// Cocon Doctovite — lit l'état depuis Supabase (source unique VPS + Netlify).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "/js/supabase-config.js";

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const isLocalDev =
  location.hostname === "127.0.0.1" || location.hostname === "localhost";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLong(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR");
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 18) return "Bonjour";
  return "Bonsoir";
}

function setGreeting() {
  document.getElementById("greeting").textContent = `${getGreeting()} 👋`;
}

function renderStatus(data) {
  const cabinetName = data.cabinet?.name || "votre cabinet";
  document.getElementById("watch-summary").textContent =
    `Vous suivez ${cabinetName}. On garde un œil sur les créneaux pour vous.`;

  if (data.cabinet?.booking_url) {
    document.getElementById("booking-link").href = data.cabinet.booking_url;
  }

  const isActive = data.watch_status !== "paused" && data.watch_status !== "completed";
  document.getElementById("watch-status").textContent = isActive
    ? "Veille active"
    : "En pause";
  document.getElementById("watch-status").className =
    "cocon-value " + (isActive ? "value-ok" : "value-warn");
  document.getElementById("watch-hint").textContent = isActive
    ? `Vérification automatique toutes les ${data.check_interval_minutes} minutes`
    : "Pas de surveillance en cours pour le moment.";

  const notifyEl = document.getElementById("notify-type");
  notifyEl.textContent = data.ntfy_configured
    ? "Appli ntfy sur votre téléphone"
    : "Non configurée";
  notifyEl.className =
    "cocon-value cocon-value-sm " + (data.ntfy_configured ? "value-ok" : "value-warn");

  const latest = data.latest;
  document.getElementById("last-check").textContent = latest
    ? formatDate(latest.checked_at)
    : "Pas encore";

  const count = latest ? latest.slot_count : 0;
  const countEl = document.getElementById("slot-count");
  countEl.textContent = count === 0 ? "Aucune pour l'instant" : String(count);
  countEl.className = "cocon-value " + (count > 0 ? "value-ok" : "");

  const lastNotified = data.history?.find((item) => item.notified);
  document.getElementById("success-banner").hidden = !lastNotified;

  const alertPanel = document.getElementById("last-alert-panel");
  if (lastNotified) {
    alertPanel.hidden = false;
    document.getElementById("last-alert-text").textContent =
      `Envoyée le ${formatDateLong(lastNotified.checked_at)}. Ouvrez l'appli ntfy ou réservez vite sur ClicRDV.`;
  } else {
    alertPanel.hidden = true;
  }

  const slotsEl = document.getElementById("current-slots");
  if (!latest || latest.slot_count === 0) {
    slotsEl.innerHTML =
      '<p class="empty">Aucune place libre pour l\'instant — on continue de surveiller pour vous.</p>';
  } else {
    slotsEl.innerHTML = latest.slots
      .map((slot) => {
        const date = slot.start.replace(" ", " à ").slice(0, 16);
        return `
          <div class="slot-item slot-item-highlight">
            <strong>${date}</strong>
            <span class="tag tag-muted">Créneau disponible</span>
          </div>
        `;
      })
      .join("");
  }

  const inactive = document.getElementById("inactive-banner");
  inactive.hidden = isActive;
  if (!isActive) {
    inactive.textContent =
      "La veille est en pause. Votre historique reste ici ; les alertes reprendront quand la surveillance sera active.";
  }
}

function showEmptyCocon() {
  document.getElementById("watch-summary").textContent =
    "Votre espace est prêt. La veille n'est pas encore configurée dans Supabase.";

  document.getElementById("watch-status").textContent = "En attente";
  document.getElementById("watch-status").className = "cocon-value value-warn";
  document.getElementById("watch-hint").textContent =
    "Lancez la migration Supabase pour connecter le VPS à ce cocon.";

  document.getElementById("last-check").textContent = "—";
  document.getElementById("slot-count").textContent = "—";
  document.getElementById("notify-type").textContent = "—";

  document.getElementById("inactive-banner").hidden = false;
  document.getElementById("inactive-banner").textContent =
    "Pas encore de données Supabase. Le VPS et le cocon ne sont pas encore reliés.";

  document.getElementById("current-slots").innerHTML =
    '<p class="empty">Les vérifications apparaîtront ici une fois la connexion établie.</p>';
}

async function loadFromSupabase() {
  if (!supabase) return null;

  const { data: watch, error: watchError } = await supabase
    .from("watches")
    .select("*, cabinets(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (watchError) throw watchError;
  if (!watch) return null;

  const { data: checks, error: checksError } = await supabase
    .from("checks")
    .select("checked_at, slot_count, slots, notified, error")
    .eq("watch_id", watch.id)
    .order("checked_at", { ascending: false })
    .limit(20);

  if (checksError) throw checksError;

  const latest = checks?.[0] || null;
  return {
    check_interval_minutes: watch.check_interval_minutes,
    scan_days: watch.scan_days,
    ntfy_configured: Boolean(watch.ntfy_topic),
    watch_status: watch.status,
    cabinet: watch.cabinets,
    latest,
    history: checks || [],
  };
}

async function loadFromLocalApi() {
  const response = await fetch("/api/status");
  if (!response.ok) return null;
  const data = await response.json();
  return { ...data, watch_status: "active" };
}

async function refresh() {
  try {
    const fromSupabase = await loadFromSupabase();
    if (fromSupabase) {
      renderStatus(fromSupabase);
      return;
    }
  } catch (error) {
    console.error("[cocon] Supabase :", error);
  }

  if (isLocalDev) {
    try {
      const fromApi = await loadFromLocalApi();
      if (fromApi) {
        renderStatus(fromApi);
        return;
      }
    } catch (error) {
      console.error("[cocon] API locale :", error);
    }
  }

  showEmptyCocon();
}

async function runAction(url, message) {
  const messageEl = document.getElementById("message");
  messageEl.textContent = message;
  const response = await fetch(url, { method: "POST" });
  const data = await response.json();
  if (!response.ok) {
    messageEl.textContent = data.detail || "Une erreur est survenue.";
    return;
  }
  messageEl.textContent = data.message || "C'est fait.";
  await refresh();
}

function renderDiagnostic(data) {
  const card = document.getElementById("diagnostic-card");
  card.hidden = false;
  document.getElementById("diagnostic-summary").textContent = data.summary;
  document.getElementById("diagnostic-details").innerHTML = `
    <p class="empty">Créneaux libres : <strong>${data.available_slots.count}</strong></p>
    <p class="empty">${data.occupied_slots_note}</p>
  `;
}

async function runDiagnostic() {
  const messageEl = document.getElementById("message");
  messageEl.textContent = "Diagnostic en cours (environ 2 minutes)…";
  const response = await fetch("/api/diagnostic");
  const data = await response.json();
  if (!response.ok) {
    messageEl.textContent = data.detail || "Le diagnostic a échoué.";
    return;
  }
  renderDiagnostic(data);
  messageEl.textContent = data.summary;
}

setGreeting();
refresh();

if (isLocalDev) {
  document.getElementById("check-now").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await runAction("/api/check", "Vérification en cours (cela peut prendre une minute)…");
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById("run-diagnostic").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await runDiagnostic();
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById("test-ntfy").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await runAction("/api/test-ntfy", "Envoi d'une notification test sur votre téléphone…");
    } finally {
      button.disabled = false;
    }
  });
} else {
  document.getElementById("check-now").disabled = true;
  document.getElementById("run-diagnostic").disabled = true;
  document.getElementById("test-ntfy").disabled = true;
}

setInterval(refresh, 60_000);
