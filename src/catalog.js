import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "./config.js";

const CATALOG_PATH = path.join(DATA_DIR, "catalog.json");
const REQUESTS_PATH = path.join(DATA_DIR, "cabinet-requests.json");

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getCatalog() {
  ensureDataDir();
  if (!fs.existsSync(CATALOG_PATH)) {
    return { cabinets: [] };
  }
  return JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
}

export function saveCabinetRequest(payload) {
  ensureDataDir();
  const requests = fs.existsSync(REQUESTS_PATH)
    ? JSON.parse(fs.readFileSync(REQUESTS_PATH, "utf8"))
    : [];

  const entry = {
    id: requests.length ? requests[0].id + 1 : 1,
    created_at: new Date().toISOString(),
    ...payload,
  };

  requests.unshift(entry);
  fs.writeFileSync(REQUESTS_PATH, JSON.stringify(requests, null, 2), "utf8");
  return entry;
}
