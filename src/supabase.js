import { createClient } from "@supabase/supabase-js";
import ws from "ws";

let adminClient = null;

function getClientOptions() {
  const options = {
    auth: { persistSession: false, autoRefreshToken: false },
  };

  // Node.js < 22 : WebSocket natif absent, requis par le client Supabase
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor < 22) {
    options.realtime = { transport: ws };
  }

  return options;
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) return null;
  if (!adminClient) {
    adminClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      getClientOptions()
    );
  }
  return adminClient;
}
