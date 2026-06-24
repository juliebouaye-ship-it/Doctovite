import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "public", "js", "supabase-config.js");

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_ANON_KEY || "";

if (!url || !key) {
  console.warn(
    "Attention : SUPABASE_URL ou SUPABASE_ANON_KEY manquant — supabase-config.js sera vide."
  );
}

const content = `// Généré automatiquement par scripts/build-config.js — ne pas éditer manuellement.
// Ce fichier est gitignore ; les valeurs viennent des env vars Netlify au build.
export const SUPABASE_URL = ${JSON.stringify(url)};
export const SUPABASE_ANON_KEY = ${JSON.stringify(key)};
`;

fs.writeFileSync(outPath, content, "utf8");
console.log("Écrit :", outPath);
