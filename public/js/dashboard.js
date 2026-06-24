// Cocon Doctovite — lecture via /api/* en local (worker VPS), état inactif sur Netlify.

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

  document.getElementById("watch-status").textContent = "Veille active";
  document.getElementById("watch-status").className = "cocon-value value-ok";
  document.getElementById("watch-hint").textContent =
    `Vérification automatique toutes les ${data.check_interval_minutes} minutes`;

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
  const successBanner = document.getElementById("success-banner");
  successBanner.hidden = !lastNotified;

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

  document.getElementById("inactive-banner").hidden = true;
}

function showInactiveState() {
  document.getElementById("watch-summary").textContent =
    "Votre espace est prêt. La veille reprendra dès que la surveillance sera rallumée.";

  document.getElementById("watch-status").textContent = "En pause";
  document.getElementById("watch-status").className = "cocon-value value-warn";
  document.getElementById("watch-hint").textContent =
    "Pas de surveillance en cours pour le moment.";

  document.getElementById("last-check").textContent = "—";
  document.getElementById("slot-count").textContent = "—";
  document.getElementById("notify-type").textContent = "—";

  const inactive = document.getElementById("inactive-banner");
  inactive.hidden = false;
  inactive.textContent =
    "La veille est en pause. Votre historique reste ici ; les alertes reprendront quand la surveillance sera active.";

  document.getElementById("current-slots").innerHTML =
    '<p class="empty">La surveillance n\'est pas active en ce moment.</p>';

  document.getElementById("check-now").disabled = true;
  document.getElementById("run-diagnostic").disabled = true;
  document.getElementById("test-ntfy").disabled = true;
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

async function refresh() {
  const response = await fetch("/api/status");
  if (!response.ok) {
    showInactiveState();
    return;
  }
  renderStatus(await response.json());
}

setGreeting();

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

refresh().catch(() => showInactiveState());
