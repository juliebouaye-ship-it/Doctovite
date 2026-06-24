function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR");
}

function renderCatalog(catalog) {
  const grid = document.getElementById("catalog-grid");
  if (!catalog.cabinets?.length) {
    grid.innerHTML = '<p class="empty">Aucun cabinet indexé pour le moment.</p>';
    return;
  }

  grid.innerHTML = catalog.cabinets
    .map((cabinet) => {
      const featured = cabinet.interventions?.filter((item) => item.featured) || [];
      const others = cabinet.interventions?.filter((item) => !item.featured) || [];
      const motifs = featured.length ? featured : cabinet.interventions || [];

      return `
        <article class="card cabinet-card">
          <div class="cabinet-meta">
            <span class="tag">${cabinet.sector || "Santé"}</span>
            <span class="tag tag-muted">${cabinet.city} (${cabinet.department})</span>
            <span class="tag tag-muted">${cabinet.status === "active" ? "Surveillé" : cabinet.status}</span>
          </div>
          <h3>${cabinet.name}</h3>
          <p class="empty">${cabinet.note || ""}</p>
          <div>
            <strong>Motifs suivis</strong>
            <ul>
              ${motifs.map((item) => `<li>${item.name}</li>`).join("")}
              ${others.length ? `<li>+ ${others.length} autre(s) motif(s)</li>` : ""}
            </ul>
          </div>
          <div>
            <strong>${cabinet.calendars?.length || 0} praticien(s)</strong>
          </div>
          <div class="hero-actions" style="margin-top:auto;">
            <a class="button button-primary" href="/dashboard.html">Voir la veille</a>
            <a class="button button-secondary" href="${cabinet.booking_url}" target="_blank" rel="noopener">ClicRDV</a>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadCatalog() {
  const response = await fetch("/api/catalog");
  const catalog = await response.json();
  renderCatalog(catalog);
}

document.getElementById("request-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const messageEl = document.getElementById("request-message");
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());

  messageEl.textContent = "Envoi en cours…";
  const response = await fetch("/api/cabinet-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok) {
    messageEl.textContent = result.detail || "Erreur lors de l'envoi.";
    return;
  }

  messageEl.textContent = result.message;
  form.reset();
});

loadCatalog().catch(() => {
  document.getElementById("catalog-grid").innerHTML =
    '<p class="empty">Impossible de charger le catalogue.</p>';
});
