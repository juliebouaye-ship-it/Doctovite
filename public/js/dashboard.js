import {
  fetchOwnedWatch,
  requireAuth,
  signOut,
  supabase,
} from "/js/auth.js";

const isLocalDev =
  location.hostname === "127.0.0.1" || location.hostname === "localhost";

let currentWatch = null;

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

function updateWatchControls(_watch) {
  // Étape 1 : boutons masqués (#watch-controls hidden). Étape 2 : afficher selon statut.
}

function renderStatus(data) {
  const cabinetName = data.cabinet?.name || "votre cabinet";
  document.getElementById("watch-summary").textContent =
    `Vous suivez ${cabinetName}. On garde un œil sur les créneaux pour vous.`;

  if (data.cabinet?.booking_url) {
    document.getElementById("booking-link").href = data.cabinet.booking_url;
  }

  const isActive = data.watch_status === "active";
  document.getElementById("watch-status").textContent = isActive
    ? "Veille active"
    : "En pause";
  document.getElementById("watch-status").className =
    "cocon-value " + (isActive ? "value-ok" : "value-warn");
  document.getElementById("watch-hint").textContent = isActive
    ? `Vérification automatique toutes les ${data.check_interval_minutes} minutes`
    : "Les scans sont suspendus — le VPS peut encore tourner (voir doc).";

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
    slotsEl.innerHTML = isActive
      ? '<p class="empty">Aucune place libre pour l\'instant — on continue de surveiller pour vous.</p>'
      : '<p class="empty">Veille en pause — reprenez quand vous voulez relancer la surveillance.</p>';
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
      "La veille est en pause dans votre cocon. Pensez à éteindre le VPS si vous n'en avez plus besoin (voir doc/VEILLE.md).";
  }

  updateWatchControls(currentWatch);
}

async function loadChecksForWatch(watchId) {
  const { data, error } = await supabase
    .from("checks")
    .select("checked_at, slot_count, slots, notified, error")
    .eq("watch_id", watchId)
    .order("checked_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

async function loadFromSupabase() {
  const watch = await fetchOwnedWatch();
  if (!watch) return null;

  currentWatch = watch;
  const checks = await loadChecksForWatch(watch.id);
  const latest = checks[0] || null;

  return {
    check_interval_minutes: watch.check_interval_minutes,
    scan_days: watch.scan_days,
    ntfy_configured: Boolean(watch.ntfy_topic),
    watch_status: watch.status,
    cabinet: watch.cabinets,
    latest,
    history: checks,
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
}

async function setWatchStatus(status) {
  if (!currentWatch) return;

  const payload =
    status === "active"
      ? { status: "active", started_at: new Date().toISOString(), ended_at: null }
      : { status: "paused", ended_at: new Date().toISOString() };

  const { error } = await supabase
    .from("watches")
    .update(payload)
    .eq("id", currentWatch.id);

  if (error) throw error;
  await refresh();
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

async function init() {
  const session = await requireAuth();
  if (!session) return;

  setGreeting();
  await refresh();
  setInterval(refresh, 60_000);
}

document.getElementById("logout-btn").addEventListener("click", () => signOut());

document.getElementById("pause-watch").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await setWatchStatus("paused");
  } catch (error) {
    alert(error.message || "Impossible de mettre en pause.");
  } finally {
    button.disabled = false;
  }
});

document.getElementById("resume-watch").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await setWatchStatus("active");
  } catch (error) {
    alert(error.message || "Impossible de reprendre la veille.");
  } finally {
    button.disabled = false;
  }
});

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

init();
