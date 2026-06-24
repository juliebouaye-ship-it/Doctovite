const slug = "clinique-dermatologique-du-confluent";
const apikey = "71a07e028193455a8b8fa1c7da526291";

const probes = [
  `https://api-hads.clicrdv.com/v3/groups/by_urlname/${slug}?apikey=${apikey}&locale=fr`,
  `https://api-hads.clicrdv.com/v3/urlnames/${slug}?apikey=${apikey}&locale=fr`,
  `https://www.clicrdv.com/api/v1/groups?urlname=${slug}&apikey=${apikey}`,
  `https://user.clicrdv.com/api/v3/groups/${slug}?locale=fr`,
];

for (const url of probes) {
  const r = await fetch(url, {
    headers: { Accept: "application/json", Origin: "https://user.clicrdv.com" },
  });
  const text = await r.text();
  console.log(r.status, url.split("?")[0]);
  console.log(text.slice(0, 200));
  console.log("---");
}

// Try resolving group via user frontend API without known apikey
const r2 = await fetch(
  `https://api-hads.clicrdv.com/v3/groups/187459?locale=fr&apikey=${apikey}`,
  { headers: { Accept: "application/json", Origin: "https://user.clicrdv.com" } }
);
const g = await r2.json();
console.log("Known group urlname:", g.urlname, "sector:", g.sector);
