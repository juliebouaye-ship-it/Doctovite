import { BOOKING_URL, NTFY_SERVER, NTFY_TOPIC } from "./config.js";
import { formatSlot } from "./clicrdv.js";

function encodedHeader(value) {
  return `base64:${Buffer.from(value, "utf8").toString("base64")}`;
}

export async function sendNtfy(title, message, tags = "calendar") {
  if (!NTFY_TOPIC) {
    throw new Error("NTFY_TOPIC n'est pas configuré dans le fichier .env");
  }

  const response = await fetch(`${NTFY_SERVER}/${NTFY_TOPIC}`, {
    method: "POST",
    headers: {
      "Title-Encoded": encodedHeader(title),
      Tags: tags,
      Priority: "high",
      Click: BOOKING_URL,
    },
    body: message,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`ntfy: HTTP ${response.status}`);
  }

  return { status: "sent", topic: NTFY_TOPIC };
}

export async function notifySlots(slots) {
  const lines = slots.slice(0, 10).map(formatSlot);
  if (slots.length > 10) {
    lines.push(`... et ${slots.length - 10} autre(s) créneau(x)`);
  }

  const message = `${lines.join("\n")}\n\nRéserver : ${BOOKING_URL}`;
  await sendNtfy(
    `RDV grains de beauté — ${slots.length} créneau(x)`,
    message,
    "calendar,white_check_mark"
  );
}
