import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const BASE_DIR = path.resolve(__dirname, "..");
export const DATA_DIR = path.join(BASE_DIR, "data");
export const DB_PATH = path.join(DATA_DIR, "checks.json");

export const GROUP_ID = 187459;
export const API_KEY = "71a07e028193455a8b8fa1c7da526291";
export const INTERVENTION_ID = 5016905;
export const CALENDAR_IDS = [690685, 690687, 690689, 691103];
export const BOOKING_URL =
  "https://user.clicrdv.com/clinique-dermatologique-du-confluent";
export const API_BASE = "https://api-hads.clicrdv.com/v3";

export const NTFY_TOPIC = process.env.NTFY_TOPIC || "";
export const NTFY_SERVER = (process.env.NTFY_SERVER || "https://ntfy.sh").replace(
  /\/$/,
  ""
);
export const CHECK_INTERVAL_MINUTES = Number(
  process.env.CHECK_INTERVAL_MINUTES || "15"
);
export const SCAN_DAYS = Number(process.env.SCAN_DAYS || "90");
export const PORT = Number(process.env.PORT || "8080");
export const HOST = process.env.HOST || "127.0.0.1";

export const CALENDAR_NAMES = {
  690685: "Dr Anne KOGGE",
  690687: "Dr Sophie VILDY",
  690689: "Dr Muriel HELLO",
  691103: "Dr Justine DAGUZE",
};
