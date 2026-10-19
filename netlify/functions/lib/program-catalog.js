// Single source of truth for which programs the inquiry form will accept.
// The same JSON files drive the public pages (public/data/*.json), so adding
// a program there automatically makes it a valid inquiry target here. The
// requires are static so Netlify's bundler packages the JSON with the function.
const groups = require("../../../public/data/programs.json");
const intensives = require("../../../public/data/intensives.json");

const GENERAL_GROUP_ID = "general-groups";

const catalog = new Map();

catalog.set(GENERAL_GROUP_ID, {
  id: GENERAL_GROUP_ID,
  kind: "group",
  title: "General group interest (not sure yet)",
  schedule: "",
  dates: [],
});

for (const g of groups) {
  if (!g || !g.id || !g.title) continue;
  catalog.set(String(g.id), {
    id: String(g.id),
    kind: "group",
    title: String(g.title),
    schedule: g.schedule ? String(g.schedule) : "",
    dates: [],
  });
}

for (const i of intensives) {
  if (!i || !i.id || !i.title) continue;
  catalog.set(String(i.id), {
    id: String(i.id),
    kind: "intensive",
    title: String(i.title),
    schedule: "",
    dates: Array.isArray(i.dates)
      ? i.dates.filter((d) => d && d.date).map((d) => ({
          date: String(d.date),
          time: d.time ? String(d.time) : "",
          format: d.format ? String(d.format) : "",
        }))
      : [],
  });
}

// Map lookup (not a plain object) so ids like "constructor" or "__proto__"
// can never resolve to something unexpected.
function findProgram(id) {
  return typeof id === "string" ? catalog.get(id) || null : null;
}

module.exports = { findProgram, GENERAL_GROUP_ID };
