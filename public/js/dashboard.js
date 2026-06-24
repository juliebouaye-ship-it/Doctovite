function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR");
}

function renderStatus(data) {
  document.getElementById("subtitle").textContent =
    `${data.cabinet?.name || "Surveillance active"} · scan ${data.scan_days} j · ${data.check_interval_minutes} min`;

  if (data.cabinet?.booking_url) {
    const link = document.getElementById("booking-link");
    link.href = data.cabinet.booking_url;
  }

  document.getElementById("next-check").textContent =
    `toutes les ${data.check_interval_minutes} min`;

  const ntfyEl = document.getElementById("ntfy-status");
  ntfyEl.textContent = data.ntfy_configured ? "Configuré" : "Non configuré";
  ntfyEl.className = "value " + (data.ntfy_configured ? "value-ok" : "value-err");

  const latest = data.latest;
  document.getElementById("last-check").textContent = latest
    ? formatDate(latest.checked_at)
    : "Jamais";

  const count = latest ? latest.slot_count : 0;
  const countEl = document.getElementById("slot-count");
  countEl.textContent = count;
  countEl.className = "value " + (count > 0 ? "value-ok" : "value-warn");

  const recentAlert = data.history?.some((item) => item.notified);
  document.getElementById("success-banner").hidden = !recentAlert;

  const slotsEl = document.getElementById("current-slots");
  if (!latest || latest.slot_count === 0) {
    slotsEl.innerHTML = '<p class="empty">Aucun créneau pour l\'instant.</p>';
  } else {
    slotsEl.innerHTML = latest.slots
      .map((slot) => {
        const doctors = (slot.calendar_ids || []).join(", ");
        const date = slot.start.replace(" ", " à ").slice(0, 16);
        return `
          <div class="slot-item">
            <strong>${date}</strong><br>
            <span class="tag tag-muted">Agendas ${doctors}</span>
          </div>
        `;
      })
      .join("");
  }

  document.getElementById("history-body").innerHTML = data.history
    .map(
      (item) => `
        <tr>
          <td>${formatDate(item.checked_at)}</td>
          <td>${item.slot_count}</td>
          <td>${item.notified ? "oui" : "non"}</td>
          <td>${
            item.error
              ? `<span class="value-err">${item.error}</span>`
              : '<span class="value-ok">OK</span>'
          }</td>
        </tr>
      `
    )
    .join("");
}

async function refresh() {
  const response = await fetch("/api/status");
  const data = await response.json();
  renderStatus(data);
}

async function runAction(url, message) {
  const messageEl = document.getElementById("message");
  messageEl.textContent = message;
  const response = await fetch(url, { method: "POST" });
  const data = await response.json();
  if (!response.ok) {
    messageEl.textContent = data.detail || "Erreur";
    return;
  }
  messageEl.textContent = data.message || "Terminé.";
  await refresh();
}

function renderDiagnostic(data) {
  const card = document.getElementById("diagnostic-card");
  card.hidden = false;
  document.getElementById("diagnostic-summary").textContent = data.summary;
  const probeLines = (data.probe?.first_slots || [])
    .map((line) => `<div class="slot-item">• ${line}</div>`)
    .join("");
  document.getElementById("diagnostic-details").innerHTML = `
    <p class="empty">Créneaux libres (grains de beauté) : <strong>${data.available_slots.count}</strong></p>
    <p class="empty">${data.occupied_slots_note}</p>
    <p class="empty">Test photothérapie : <strong class="${data.probe?.ok ? "value-ok" : "value-err"}">${data.probe?.slot_count ?? 0} créneau(x)</strong></p>
    ${probeLines}
  `;
}

async function runDiagnostic() {
  const messageEl = document.getElementById("message");
  messageEl.textContent = "Diagnostic en cours (~2 min)…";
  const response = await fetch("/api/diagnostic");
  const data = await response.json();
  if (!response.ok) {
    messageEl.textContent = data.detail || "Erreur diagnostic";
    return;
  }
  renderDiagnostic(data);
  messageEl.textContent = data.summary;
}

document.getElementById("check-now").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await runAction("/api/check", "Vérification en cours (peut prendre ~1 min)…");
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
    await runAction("/api/test-ntfy", "Envoi d'une notification test…");
  } finally {
    button.disabled = false;
  }
});

refresh();
setInterval(refresh, 30000);
