import express from "express";
import cron from "node-cron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildStatus, runCheck } from "./checker.js";
import { getCatalog, saveCabinetRequest } from "./catalog.js";
import { runDiagnostic } from "./diagnostic.js";
import {
  BOOKING_URL,
  CHECK_INTERVAL_MINUTES,
  HOST,
  NTFY_TOPIC,
  PORT,
  SCAN_DAYS,
} from "./config.js";
import { sendNtfy } from "./notify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

function getActiveCabinet() {
  const catalog = getCatalog();
  return (
    catalog.cabinets.find((cabinet) => cabinet.booking_url === BOOKING_URL) ||
    catalog.cabinets[0] || {
      name: "Surveillance active",
      booking_url: BOOKING_URL,
    }
  );
}

app.get("/api/status", async (_req, res) => {
  try {
    const status = await buildStatus();
    res.json({
      ...status,
      cabinet: status.cabinet || getActiveCabinet(),
    });
  } catch (error) {
    res.status(500).json({ detail: String(error) });
  }
});

app.get("/api/catalog", (_req, res) => {
  res.json(getCatalog());
});

app.post("/api/cabinet-requests", (req, res) => {
  const { cabinet_name, city, motif, department = "", details = "", email = "" } =
    req.body || {};

  if (!cabinet_name?.trim() || !city?.trim() || !motif?.trim()) {
    return res.status(400).json({
      detail: "Nom du cabinet, ville et motif sont obligatoires.",
    });
  }

  const entry = saveCabinetRequest({
    cabinet_name: cabinet_name.trim(),
    city: city.trim(),
    motif: motif.trim(),
    department: String(department).trim(),
    details: String(details).trim(),
    email: String(email).trim(),
  });

  res.json({
    message: "Demande enregistrée — merci, on regardera ça.",
    id: entry.id,
  });
});

app.post("/api/check", async (_req, res) => {
  const result = await runCheck(true);
  if (!result.ok) {
    return res.status(500).json({ detail: result.error || "Erreur inconnue" });
  }

  let message = `${result.slot_count} créneau(x) trouvé(s)`;
  if (result.new_slot_count > 0) {
    message += `, ${result.new_slot_count} nouveau(x)`;
  }
  if (result.notified) {
    message += " — notification envoyée";
  }

  res.json({ message, ...result });
});

app.get("/api/diagnostic", async (_req, res) => {
  try {
    const result = await runDiagnostic();
    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: String(error) });
  }
});

app.post("/api/test-ntfy", async (_req, res) => {
  if (!NTFY_TOPIC) {
    return res
      .status(400)
      .json({ detail: "Configurez NTFY_TOPIC dans le fichier .env" });
  }

  try {
    await sendNtfy(
      "Test surveillance RDV",
      "Si vous voyez ce message, ntfy fonctionne.",
      "white_check_mark"
    );
    res.json({
      message: `Notification test envoyée sur le topic ${NTFY_TOPIC}`,
    });
  } catch (error) {
    res.status(500).json({ detail: String(error) });
  }
});

const cronExpr = `*/${CHECK_INTERVAL_MINUTES} * * * *`;
cron.schedule(cronExpr, () => {
  console.log(`[${new Date().toISOString()}] Vérification automatique...`);
  runCheck(true)
    .then((result) => {
      console.log(
        `[${new Date().toISOString()}] ${result.slot_count} créneau(x)${
          result.notified ? " — notification envoyée" : ""
        }`
      );
    })
    .catch((error) => {
      console.error("Erreur scheduler:", error);
    });
});

app.listen(PORT, HOST, () => {
  console.log(`Dashboard: http://${HOST}:${PORT}`);
  console.log(`Checks toutes les ${CHECK_INTERVAL_MINUTES} min · ${SCAN_DAYS} jours`);
  console.log(`ntfy: ${NTFY_TOPIC || "non configuré"}`);
  console.log(`ClicRDV: ${BOOKING_URL}`);
});
