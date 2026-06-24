const urls = [
  "https://user.clicrdv.com/clinique-dermatologique-du-confluent",
  "https://user.clicrdv.com/dr-thuillier",
];

for (const url of urls) {
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
  });
  const t = await r.text();
  const apikeys = [...t.matchAll(/apikey[=:"'\s]+([a-f0-9]{32})/gi)].map((m) => m[1]);
  const groupIds = [...t.matchAll(/group[_-]?id[=:"'\s]+(\d+)/gi)].map((m) => m[1]);
  console.log("\n===", url, "===");
  console.log("status", r.status, "len", t.length);
  console.log("apikeys", [...new Set(apikeys)]);
  console.log("groupIds", [...new Set(groupIds)]);
  const sector = t.match(/sector['":\s]+([^'"]+)/i);
  console.log("sector snippet", sector?.[1]?.slice(0, 80));
}
