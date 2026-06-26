// ─────────────────────────────────────────────────────────────────────────
// config.js — persistence with a STABLE storage key + schema-versioned
// migrations, so a new version of the app always reuses your existing keys
// and configuration (never silently drops them).
//
// Stored shape (key `polecat`):
//   { schemaVersion, providers:{<id>:{key}}, selections:[{id,provider,model}],
//     arbitration:{activeId,arbiter,custom[]}, consensus, modelStatus, ui }
//
// To evolve the shape later: bump SCHEMA_VERSION and add MIGRATIONS[n]
// (n -> n+1). The storage key NEVER changes again, so upgrades are seamless.
// ─────────────────────────────────────────────────────────────────────────

export const STORAGE_KEY    = 'polecat';            // stable — decoupled from schema version
export const SCHEMA_VERSION = 1;
export const THEME_KEY      = 'polecat_theme';
export const WELCOME_KEY    = 'polecat_welcomed';
const MIGRATE_FROM    = ['polecat_v1'];             // earlier Polecat storage keys (same schema family)

export const MAX_SELECTIONS = 8;

let _idc = 0;
export function newId() { return 's' + Date.now().toString(36) + (_idc++).toString(36); }
export function mkSelection(provider, model) { return { id: newId(), provider, model }; }

function safeParse(raw) {
  if (!raw) return null;
  try { const o = JSON.parse(raw); return (o && typeof o === 'object') ? o : null; } catch { return null; }
}

// Fill in defaults for any missing fields — forward-compatible for additive
// changes (a new field added in a future version just defaults here, no bump).
function normalize(cfg) {
  cfg = (cfg && typeof cfg === 'object') ? cfg : {};
  cfg.schemaVersion = SCHEMA_VERSION;
  cfg.providers   = (cfg.providers && typeof cfg.providers === 'object') ? cfg.providers : {};
  cfg.selections  = Array.isArray(cfg.selections) ? cfg.selections : [];
  cfg.arbitration = (cfg.arbitration && typeof cfg.arbitration === 'object') ? cfg.arbitration : {};
  if (!cfg.arbitration.activeId) cfg.arbitration.activeId = 'comprehensive';   // light single-pass default (sequential chains many calls)
  if (!cfg.arbitration.arbiter)  cfg.arbitration.arbiter = 'auto';
  if (!Array.isArray(cfg.arbitration.custom)) cfg.arbitration.custom = [];
  cfg.arbitration.provenance = cfg.arbitration.provenance !== false;   // agreement map: default ON
  cfg.consensus   = cfg.consensus !== false;          // default ON
  cfg.modelStatus = (cfg.modelStatus && typeof cfg.modelStatus === 'object') ? cfg.modelStatus : {};
  cfg.ui          = (cfg.ui && typeof cfg.ui === 'object') ? cfg.ui : {};
  cfg.private     = cfg.private === true;             // private mode: don't record history
  cfg.selections.forEach(s => { if (!s.id) s.id = newId(); });
  return cfg;
}

// Ordered structural migrations. Add MIGRATIONS[n] to transform schema n -> n+1.
// Each receives the stored object and must return it preserving all user data.
const MIGRATIONS = {
  // 1: (c) => { /* example: c.newField = derive(c.old); delete c.old; return c; */ },
};
function migrateSchema(data, fromVersion) {
  let d = data;
  for (let v = fromVersion; v < SCHEMA_VERSION; v++) {
    if (typeof MIGRATIONS[v] === 'function') d = MIGRATIONS[v](d) || d;
  }
  return d;
}

// One-time, human-readable note surfaced by the app after a carry-over/upgrade.
let _migrationNote = '';
export function takeMigrationNote() { const n = _migrationNote; _migrationNote = ''; return n; }

export function loadCfg() {
  // 1) canonical store
  const rawCanon = localStorage.getItem(STORAGE_KEY);
  const canon = safeParse(rawCanon);
  if (rawCanon && !canon) {                              // corrupt — back up, never silently lose
    try { localStorage.setItem(STORAGE_KEY + '.corrupt.' + Date.now(), rawCanon); } catch {}
  }
  if (canon) {
    const from = canon.schemaVersion || 1;
    if (from < SCHEMA_VERSION) {
      const up = normalize(migrateSchema(canon, from));
      saveCfg(up);
      _migrationNote = 'Settings upgraded — your keys & config were kept';
      return up;
    }
    return normalize(canon);
  }
  // 2) earlier Polecat storage keys → carry over to the canonical key
  for (const k of MIGRATE_FROM) {
    const prev = safeParse(localStorage.getItem(k));
    if (prev) {
      const up = normalize(migrateSchema(prev, prev.schemaVersion || 1));
      saveCfg(up);
      _migrationNote = 'Your saved setup carried over';
      return up;
    }
  }
  // 3) fresh install
  return normalize({});
}

export function saveCfg(cfg) {
  cfg.schemaVersion = SCHEMA_VERSION;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch {}
}

// ── Conversation history (separate key so the config blob stays small) ──────
export const HISTORY_KEY = 'polecat_history';
export const MAX_HISTORY = 200;
export function loadHistory() {
  const a = safeParse(localStorage.getItem(HISTORY_KEY));
  return Array.isArray(a) ? a : [];
}
export function saveHistory(arr) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify((arr || []).slice(0, MAX_HISTORY))); } catch {}
}

// ── Helpers ──────────────────────────────────────────────────────────────
export function providerKey(cfg, providerId) {
  return cfg.providers?.[providerId]?.key || '';
}
export function setProviderKey(cfg, providerId, key) {
  cfg.providers = cfg.providers || {};
  if (key) cfg.providers[providerId] = { ...(cfg.providers[providerId] || {}), key };
  else delete cfg.providers[providerId];
}
export function configuredProviders(cfg) {
  return Object.keys(cfg.providers || {}).filter(id => cfg.providers[id]?.key);
}
// Selections we can actually run: those whose provider has a key, plus the
// keyless free-demo provider (its key lives server-side in the proxy).
export function activeSelections(cfg) {
  return (cfg.selections || []).filter(s => s.provider === 'demo' || providerKey(cfg, s.provider));
}
