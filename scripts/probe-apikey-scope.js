// Test if one apikey works across groups, and discover via slug API call from SPA
const slug = "dr-thuillier";
const knownKey = "71a07e028193455a8b8fa1c7da526291";
const knownGroup = 187459;

// Intercept pattern: SPA likely calls groups endpoint on load
// Try common booking bootstrap endpoints
const candidates = [
  `https://api-hads.clicrdv.com/v3/booking/${slug}?locale=fr`,
  `https://api-hads.clicrdv.com/v3/booking/groups/${slug}?locale=fr`,
  `https://api-hads.clicrdv.com/v3/groups/find?urlname=${slug}&locale=fr`,
];

for (const url of candidates) {
  const r = await fetch(url, {
    headers: { Accept: "application/json", Origin: "https://user.clicrdv.com" },
  });
  console.log(r.status, url);
  console.log((await r.text()).slice(0, 180));
  console.log("---");
}

// Wrong group with known apikey?
const r2 = await fetch(
  `https://api-hads.clicrdv.com/v3/groups/1?locale=fr&apikey=${knownKey}`,
  { headers: { Accept: "application/json", Origin: "https://user.clicrdv.com" } }
);
console.log("group 1 with confluent key:", r2.status, (await r2.text()).slice(0, 120));

const r3 = await fetch(
  `https://api-hads.clicrdv.com/v3/groups/${knownGroup}?locale=fr&apikey=${knownKey}`,
  { headers: { Accept: "application/json", Origin: "https://user.clicrdv.com" } }
);
console.log("own group:", r3.status);
