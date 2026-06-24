import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "/js/supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function renderCatalog(cabinets) {
  const grid = document.getElementById("catalog-grid");
  if (!cabinets?.length) {
    grid.innerHTML = '<p class="empty">Aucun cabinet indexé pour le moment.</p>';
    return;
  }

  grid.innerHTML = cabinets
    .map((cabinet) => {
      const interventions = cabinet.interventions || [];
      const featured = interventions.filter((item) => item.featured);
      const others = interventions.filter((item) => !item.featured);
      const motifs = featured.length ? featured : interventions;

      return `
        <article class="card cabinet-card">
          <div class="cabinet-meta">
            <span class="tag">${cabinet.sector || "Santé"}</span>
            <span class="tag tag-muted">${cabinet.city || ""} (${cabinet.department || ""})</span>
            <span class="tag tag-muted">${cabinet.status === "active" ? "Surveillé" : cabinet.status || ""}</span>
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
            <a class="button button-primary" href="/dashboard.html">Mon espace</a>
            ${cabinet.booking_url ? `<a class="button button-secondary" href="${cabinet.booking_url}" target="_blank" rel="noopener">ClicRDV</a>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadCatalog() {
  const { data, error } = await supabase
    .from("cabinets")
    .select("*")
    .order("name");

  if (error) throw error;
  renderCatalog(data);
}

document.getElementById("request-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const messageEl = document.getElementById("request-message");
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());

  messageEl.textContent = "Envoi en cours…";

  const { error } = await supabase.from("cabinet_requests").insert([data]);

  if (error) {
    messageEl.textContent = error.message || "Erreur lors de l'envoi.";
    return;
  }

  messageEl.textContent = "Demande envoyée — merci ! On revient vers vous rapidement.";
  form.reset();
});

loadCatalog().catch((err) => {
  console.error("[landing] Erreur chargement catalogue :", err);
  document.getElementById("catalog-grid").innerHTML =
    '<p class="empty">Impossible de charger le catalogue.</p>';
});
