// Generate js/changelog.js (the published, relay-style ES module) from the
// app's working source, changelog.json. This keeps a machine-readable changelog
// at /js/changelog.js — matching the convention used across the other Polecat
// properties (e.g. relay.polecat.live/js/changelog.js) — always in sync with the
// in-app "What's new" panel, with zero hand-maintenance.
//
// Run it after editing changelog.json (the hourly self-improve loop does this):
//   node scripts/gen-changelog.mjs
//
// Output shape (newest first):
//   export const CHANGELOG = [ { v, title, ts, items }, ... ]
// where `ts` is an ISO-8601 UTC string derived from each entry's Central time,
// so any consumer can format it to the reader's local zone.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(readFileSync(join(root, 'changelog.json'), 'utf8'));
const entries = Array.isArray(src.entries) ? src.entries : [];

// Convert a wall-clock Central time (date "YYYY-MM-DD", time "HH:MM CT") to a
// real UTC instant, honouring US DST at that date. Two passes settle the offset
// across a DST boundary. Missing time defaults to noon CT (safe from rollover).
function ctToUtcISO(dateStr, timeStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
  if (!m) return '';
  const [, y, mo, d] = m.map(Number);
  const hm = /(\d{1,2}):(\d{2})/.exec(timeStr || '') || [null, '12', '00'];
  const h = Number(hm[1]), mi = Number(hm[2]);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  const offsetMin = (instant) => {
    const p = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago', hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(instant).reduce((a, x) => (a[x.type] = x.value, a), {});
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return (asUTC - instant.getTime()) / 60000;
  };
  let ts = wall;
  for (let i = 0; i < 2; i++) ts = wall - offsetMin(new Date(ts)) * 60000;
  return new Date(ts).toISOString();
}

const n = entries.length;
const out = entries.map((e, i) => ({
  v: n - i,                                  // newest gets the highest version
  title: String(e.title || ''),
  ts: ctToUtcISO(e.date, e.time),
  items: Array.isArray(e.items) ? e.items.map(String) : [],
}));

const body = out.map(e =>
  '  {\n' +
  `    v: ${e.v},\n` +
  `    title: ${JSON.stringify(e.title)},\n` +
  `    ts: ${JSON.stringify(e.ts)},\n` +
  '    items: [\n' +
  e.items.map(it => `      ${JSON.stringify(it)},\n`).join('') +
  '    ],\n' +
  '  },'
).join('\n');

const header =
  '// AUTO-GENERATED — do not edit by hand. Source: changelog.json.\n' +
  '// Regenerate with:  node scripts/gen-changelog.mjs\n' +
  '// Published relay-style changelog for consumers at /js/changelog.js.\n' +
  '// Entries are newest-first; `ts` is an ISO-8601 UTC string.\n';

writeFileSync(join(root, 'js', 'changelog.js'), `${header}export const CHANGELOG = [\n${body}\n];\n`);
console.log(`gen-changelog: wrote js/changelog.js (${out.length} entries).`);
