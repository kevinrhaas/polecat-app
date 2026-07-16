// ─────────────────────────────────────────────────────────────────────────
// app.js — controller. State is keyed by SELECTION id (a {provider, model}
// instance), so the same provider can appear multiple times (Opus + Sonnet).
// ─────────────────────────────────────────────────────────────────────────
import {
  loadCfg, saveCfg, activeSelections, answeringSelections, configuredProviders, providerKey, setProviderKey,
  mkSelection, MAX_SELECTIONS, takeMigrationNote, loadHistory, saveHistory,
} from './config.js';
import {
  PROVIDERS, PROVIDER_IDS, makeGen, probeModel, defaultModel, selectionLabel,
  listModels, modelListSupported, modelSupportsVision,
} from './providers.js';
import {
  allStrategies, activeStrategy, runArbitration, exportSettings, importSettings,
  computeParaAttribution, computeLocalAgreement,
} from './arbitration.js';
import { $, el, escapeHtml, nl2br, renderMarkdown, highlightBubble, toast } from './ui.js';
// Polecat Shell (vendored, READ-ONLY — see CLAUDE.md): frame, theme, waffle, What's-New.
import { configure as configureTheme, applyTheme, toggleMode, effectiveMode } from '../vendor/polecat-shell/theme.js';
import { initShell, rightPanel, appSwitcher } from '../vendor/polecat-shell/shell.js';
import { publicFleet } from '../vendor/polecat-shell/catalog.js';
import { initWhatsNew, hasUnseen } from '../vendor/polecat-shell/whatsnew.js';
import { icon as shellIcon } from '../vendor/polecat-shell/icons.js';
import { CHANGELOG, LATEST_VERSION } from './changelog.js';
import { decodeHandoff } from './handoff.js';

const DONATE_URL = 'https://ko-fi.com/polecatlive';
const WELCOME_KEY = 'polecat_welcomed';
const KEYS_NUDGE_KEY = 'polecat_keys_nudge_shown';
const CONS_HINT_KEY = 'polecat_cons_hint';
const BACKUP_KEY = 'polecat_last_backup';        // ms timestamp of the last successful export
const BACKUP_NUDGE_KEY = 'polecat_backup_nudge_at'; // ms timestamp the backup nudge was last shown
const FIRST_USE_KEY = 'polecat_first_use';        // ms timestamp of this browser's first visit
const BACKUP_STALE_MS = 14 * 86400000;            // consider a backup "due" after 2 weeks
const BACKUP_NUDGE_QUIET_MS = 21 * 86400000;      // never nudge again within 3 weeks of the last nudge
const IOS_INSTALL_DISMISS_KEY = 'polecat_ios_install_dismissed'; // set once the user dismisses the Home Screen hint
const COPY_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
// EPIC 1 · P4 — layers icon for the inline attribution toggle
const ATTR_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
// EPIC 3 — consistent SVG icon set (no emoji in UI)
const EYE_SVG     = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF_SVG = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
const EYE_SVG_SM  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const GEAR_SM_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
const SEARCH_SVG  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
const KEY_SVG     = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`;
const DOLLAR_SVG  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
const STAR_SVG    = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const ARB_ICON    = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:inline;vertical-align:text-bottom" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`;
const ZAP_SVG     = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
const SHARE_SVG   = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;
const COPY_MD_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
const GRID_SVG    = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
const REGEN_SVG   = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.85"/></svg>`;
const PIN_SVG     = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const EDIT_SVG    = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const BLEND_SVG   = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:text-bottom" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
const CHECK_SM_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
const EXPAND_SVG  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;
const CROSS_SM_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const CLOCK_SM_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>`;
const CHEVRON_UP_SM_SVG = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>`;
const CHEVRON_DOWN_SM_SVG = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;
const DOT_SM_SVG  = `<svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>`;

const DEFAULT_TITLE = document.title;
let cfg = loadCfg();
const convos = {};                  // selectionId -> [{role, content}]
let lastPrompt = '', results = {}, order = [];
let activeTab = null;
let history = loadHistory();         // [thread] newest-first
let currentThread = null;           // the conversation being built/continued
let lastConsensusText = '';         // captured per turn for history
let lastConsensusProvenance = null; // EPIC 1 — arbiter's agreement map for the current consensus
let lastSynthesisOrdered = [];      // snapshot of model results used for the most recent synthesis
let lastSynthesisPrompt = '';       // the user prompt for the most recent synthesis
// live consensus progress
let runStatus = {};                 // selectionId -> 'pending'|'streaming'|'done'|'error'
let streamPreviews = {};            // selectionId -> first ~90 chars of streaming response (for progress box)
let consensusPhase = '';            // '' | 'waiting' | 'arbitrating' | 'done'
let consensusStatusText = '', consensusStepText = '';
let _browseList = [], _browseProvider = '';   // live model-list browse state
let attachments = [];               // [{ id, name, mime, data(base64), dataUrl }] pending on the composer
let _attc = 0;
let responseTimes = {};             // selectionId -> ms elapsed for that model's response
let queryStartTime = 0;             // performance.now() when the user clicks Send
// Prompt history recall: ↑/↓ in an empty input cycles through past prompts
const PROMPT_HIST_KEY = 'polecat_prompt_history';
const PROMPT_HIST_MAX = 50;
let _promptHistIdx = -1;            // -1 = not browsing history; 0+ = index into history list
let _promptHistDraft = '';          // text that was in input when user first pressed ↑
// Composer draft auto-save: persist whatever the user is typing so it survives
// accidental page reloads or browser crashes.  Cleared on send.
const DRAFT_KEY = 'polecat_composer_draft';
const DRAFT_MAX = 10000;            // char cap to keep localStorage tidy
// Stop generation: an AbortController created per sendAll() run so the user can
// cancel all in-flight streams mid-response.  _userStopped distinguishes an
// intentional cancel (keep partial text) from a provider timeout (show error).
let _runCtrl = null;
let _userStopped = false;

// Format modifiers for consensus re-synthesis — appended to the active strategy
// prompt so users can reformat the same answer without re-querying models.
const FORMAT_MODIFIERS = [
  { id: 'shorter',  label: 'Shorter',       instruction: 'Be concise: 2-3 short paragraphs at most.' },
  { id: 'bullets',  label: 'Bullet points', instruction: 'Format your response as concise bullet points with no prose preamble.' },
  { id: 'detailed', label: 'More detail',   instruction: 'Be thorough: include more examples, context, and nuance.' },
  { id: 'simple',   label: 'Simplify',      instruction: 'Explain as simply as possible, assuming the reader has no prior knowledge on this topic.' },
];

const persist  = () => saveCfg(cfg);
const sels     = () => answeringSelections(cfg);
const selById  = (id) => (cfg.selections || []).find(s => s.id === id);
const getConvo = (id) => (convos[id] ||= []);
const statusKey = (provider, model) => provider + '|' + model;
const statusOf  = (provider, model) => cfg.modelStatus[statusKey(provider, model)];

// Fits the composer's height to its content (or, when empty, to its placeholder
// hint) so the multi-line hint text is never clipped.
function autoGrowComposer(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}

// ── Prompt history recall (↑/↓ in empty input) ──────────────────────────────
function loadPromptHistory() {
  try { return JSON.parse(localStorage.getItem(PROMPT_HIST_KEY) || '[]'); } catch { return []; }
}
function addToPromptHistory(text) {
  if (!text || !text.trim()) return;
  let hist = loadPromptHistory().filter(h => h !== text);
  hist.unshift(text);
  if (hist.length > PROMPT_HIST_MAX) hist.length = PROMPT_HIST_MAX;
  try { localStorage.setItem(PROMPT_HIST_KEY, JSON.stringify(hist)); } catch { /* storage full */ }
}
function applyPromptHistory(inp, hist, idx) {
  inp.value = idx < 0 ? _promptHistDraft : (hist[idx] || '');
  autoGrowComposer(inp);
  inp.setSelectionRange(inp.value.length, inp.value.length);
  updateSendEnabled();
}

// ── Composer draft auto-save ────────────────────────────────────────────────
let _draftSaveTimer;
function saveDraft(text) {
  clearTimeout(_draftSaveTimer);
  _draftSaveTimer = setTimeout(() => {
    try {
      if (text && text.length <= DRAFT_MAX) localStorage.setItem(DRAFT_KEY, text);
      else localStorage.removeItem(DRAFT_KEY);
    } catch { /* storage full */ }
  }, 400);
}
function clearDraft() {
  clearTimeout(_draftSaveTimer);
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}
function restoreComposerDraft() {
  const inp = $('promptInput');
  if (!inp || inp.value.trim()) return;
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (!draft || !draft.trim()) return;
    inp.value = draft;
    autoGrowComposer(inp);
    updateSendEnabled();
    toast('Draft restored');
  } catch {}
}

// ── Stop generation ─────────────────────────────────────────────────────────
// Build opts for a makeGen call that belongs to the current run.  Creates a
// composite AbortSignal that fires on EITHER a user Stop OR the per-provider
// timeout — whichever comes first.  Returns {} when no run is active.
function makeRunOpts(provider) {
  if (!_runCtrl) return {};
  const timeoutMs = provider?.timeoutMs || 90000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  _runCtrl.signal.addEventListener('abort', () => { clearTimeout(timer); ctrl.abort(); }, { once: true });
  return { signal: ctrl.signal };
}
function stopGeneration() {
  if (!_runCtrl || _userStopped) return;
  _userStopped = true;
  _runCtrl.abort();
  const sb = $('stopBtn');
  if (sb) { sb.disabled = true; const st = sb.querySelector('.stop-text'); if (st) st.textContent = 'Stopping…'; }
}

// ── Modal focus management ──────────────────────────────────────────────────
// Every overlay/dialog should move focus into itself when it opens and hand
// focus back to whatever triggered it when it closes, so keyboard and
// screen-reader users aren't dropped back at the top of the page. Stack-based
// so a modal opened from inside another (e.g. Export from within Settings)
// unwinds correctly.
const _focusStack = [];
function pushModalFocus(focusEl) {
  _focusStack.push(document.activeElement);
  if (focusEl) setTimeout(() => focusEl.focus(), 60);
}
function popModalFocus() {
  const el = _focusStack.pop();
  if (el && typeof el.focus === 'function' && document.body.contains(el)) el.focus();
}

// ── Clipboard ───────────────────────────────────────────────────────────────
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    toast('Copied');
    if (btn) { btn.classList.add('copied'); setTimeout(() => btn.classList.remove('copied'), 1000); }
  }).catch(() => toast('Copy failed'));
}
// ── Shareable consensus links ─────────────────────────────────────────────────
// Encode a consensus payload to a URL-safe base64 string.
function encodeSharePayload(p) {
  const d = {
    v: 1,
    q: (p.q || '').slice(0, 500),
    r: (p.r || []).slice(0, 6).map(m => ({ l: (m.l || '').slice(0, 60), t: (m.t || '').slice(0, 1500) })),
    c: (p.c || '').slice(0, 3000),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(d));
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function decodeSharePayload(str) {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - b64.length % 4) % 4));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const d = JSON.parse(new TextDecoder().decode(bytes));
    return (d && d.v === 1) ? d : null;
  } catch { return null; }
}
function shareConsensus(payload, btn) {
  const url = location.origin + location.pathname + '#share=' + encodeSharePayload(payload);
  navigator.clipboard.writeText(url)
    .then(() => { toast('Share link copied — paste it anywhere!'); if (btn) { btn.classList.add('copied'); setTimeout(() => btn.classList.remove('copied'), 1500); } })
    .catch(() => window.prompt('Copy this share link:', url));
}
function showShareModal(data) {
  const modal = $('shareModal'), content = $('shareContent');
  if (!modal || !content) return;
  let html = `<div><div class="share-section-label">Question</div><div class="share-question-wrap">${escapeHtml(data.q || '')}</div></div>`;
  if (data.r && data.r.length) {
    html += `<div><div class="share-section-label">${data.r.length} model${data.r.length === 1 ? '' : 's'} responded</div><div class="share-models-wrap">`;
    data.r.forEach(m => {
      html += `<details class="share-model-card"><summary>${escapeHtml(m.l || 'Model')}<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></summary><div class="share-model-body">${renderMarkdown(m.t || '')}</div></details>`;
    });
    html += `</div></div>`;
  }
  if (data.c) {
    html += `<div><div class="share-section-label">Consensus</div><div class="share-consensus-wrap">${renderMarkdown(data.c)}</div></div>`;
  }
  content.innerHTML = html;
  if (typeof hljs !== 'undefined') content.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
  const wasOpen = modal.classList.contains('open');
  modal.classList.add('open');
  modal.removeAttribute('aria-hidden');
  if (!wasOpen) pushModalFocus($('closeShare'));
}
function closeShareModal() {
  const modal = $('shareModal');
  const wasOpen = modal?.classList.contains('open');
  if (modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
  if (wasOpen) popModalFocus();
  // NB: must be window.history — a module-scoped `history` (the chat thread
  // list, declared below) shadows the global of the same name in this file.
  if (location.hash.startsWith('#share=')) window.history.replaceState(null, '', location.pathname);
}
function openKbd() {
  closeSidebar();   // same fix as openConfig(): the sidebar's own higher z-index
                     // backdrop was blurring this modal when opened from its link
  const m = $('kbdModal');
  if (m) {
    const wasOpen = m.classList.contains('open');
    m.classList.add('open'); m.removeAttribute('aria-hidden');
    if (!wasOpen) pushModalFocus($('closeKbd'));
  }
}
function closeKbd() {
  const m = $('kbdModal'); if (!m) return;
  const wasOpen = m.classList.contains('open');
  m.classList.remove('open'); m.setAttribute('aria-hidden', 'true');
  if (wasOpen) popModalFocus();
}
// Copy the full exchange — question + each model's answer + consensus — as markdown.
// Useful for pasting into docs, Slack, Notion, etc.
function copyThreadAsMarkdown(payload, btn) {
  const { q, r, c } = payload;
  const lines = [];
  if (q) { lines.push('**Question:** ' + q); lines.push(''); }
  if (r && r.length) {
    lines.push('---'); lines.push('');
    r.forEach((m, i) => {
      if (i > 0) lines.push('');
      lines.push('**' + m.l + ':**'); lines.push('');
      lines.push(m.t || '');
    });
    lines.push('');
  }
  if (c) { lines.push('---'); lines.push(''); lines.push('**Consensus:**'); lines.push(''); lines.push(c); }
  copyText(lines.join('\n'), btn);
}

// Build timestamp from the served file's last-modified — auto-updates each deploy.
function buildStamp() {
  const d = new Date(document.lastModified);
  if (isNaN(d.getTime())) return '';
  // Render the real deploy time in Central Time (CT) so the header matches the
  // CT-stamped changelog. Used for BOTH the header and the What's-new "updated".
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(d).reduce((o, p) => (o[p.type] = p.value, o), {});
  return `${f.year}-${f.month}-${f.day} ${f.hour}:${f.minute} CT`;
}

// ── Attachments (images + text/doc files) ────────────────────────────────────
const MAX_ATTACH = 5;
const MAX_ATTACH_BYTES = 8 * 1024 * 1024;       // ~8MB per image
const MAX_TEXT_ATTACH_BYTES = 5 * 1024 * 1024;  // 5MB per text file (before reading)
const MAX_TEXT_CHARS = 20000;                    // chars to inject per file (~5k tokens)
const MAX_TOTAL_TEXT_CHARS = 60000;              // total char budget across ALL text files combined (~15k tokens)
const MAX_OFFICE_ATTACH_BYTES = 10 * 1024 * 1024; // 10 MB for office documents

const _TEXT_TYPES = new Set(['text/plain','text/markdown','text/csv','text/javascript',
  'text/typescript','application/json','text/html','text/css','text/x-python',
  'text/x-java-source','text/x-c','text/x-c++src','text/x-sh','text/x-shellscript']);
const _TEXT_EXTS = new Set(['txt','md','csv','json','js','ts','py','sh','log','yaml','yml',
  'toml','ini','conf','html','css','jsx','tsx','java','c','cpp','go','rb','rs','xml','sql']);
function isImageFile(f) { return !!(f.type && f.type.startsWith('image/')); }
function isTextFile(f) {
  if (_TEXT_TYPES.has(f.type)) return true;
  const ext = ((f.name || '').split('.').pop() || '').toLowerCase();
  return _TEXT_EXTS.has(ext);
}
function isPdfFile(f) {
  if (f.type === 'application/pdf') return true;
  const ext = ((f.name || '').split('.').pop() || '').toLowerCase();
  return ext === 'pdf';
}
function isPptxFile(f) {
  if (f.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return true;
  return ((f.name || '').split('.').pop() || '').toLowerCase() === 'pptx';
}
function isDocxFile(f) {
  if (f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return true;
  return ((f.name || '').split('.').pop() || '').toLowerCase() === 'docx';
}
function isXlsxFile(f) {
  if (f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return true;
  const ext = ((f.name || '').split('.').pop() || '').toLowerCase();
  return ext === 'xlsx' || ext === 'xls';
}
function isOfficeFile(f) { return isPptxFile(f) || isDocxFile(f) || isXlsxFile(f); }
function officeDocType(f) {
  if (isPptxFile(f)) return 'pptx';
  if (isDocxFile(f)) return 'docx';
  if (isXlsxFile(f)) return 'xlsx';
  return null;
}

// Convert an ArrayBuffer to base64 without hitting stack limits on large files.
function _bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(binary);
}

// Lazy-load pdf.js from CDN only when a PDF is first attached.
const _PDF_JS  = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const _PDF_WRK = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
let _pdfJsPromise = null;
function loadPdfJs() {
  if (_pdfJsPromise) return _pdfJsPromise;
  _pdfJsPromise = new Promise((resolve, reject) => {
    if (window.pdfjsLib) { window.pdfjsLib.GlobalWorkerOptions.workerSrc = _PDF_WRK; resolve(window.pdfjsLib); return; }
    const s = document.createElement('script');
    s.src = _PDF_JS;
    s.onload = () => {
      if (window.pdfjsLib) { window.pdfjsLib.GlobalWorkerOptions.workerSrc = _PDF_WRK; resolve(window.pdfjsLib); }
      else reject(new Error('pdf.js failed to initialise'));
    };
    s.onerror = () => { _pdfJsPromise = null; reject(new Error('Could not load PDF library — check your connection')); };
    document.head.appendChild(s);
  });
  return _pdfJsPromise;
}
async function readPdfFile(file, id, onProgress) {
  const pdfjs = await loadPdfJs();
  const buf   = await file.arrayBuffer();
  // Store base64 so capable providers (Anthropic, Gemini) can receive the PDF natively.
  const rawData = _bufToBase64(buf);
  const pdf   = await pdfjs.getDocument({ data: buf }).promise;
  const total = pdf.numPages;
  let text = '', truncated = false;
  for (let i = 1; i <= total; i++) {
    if (text.length >= MAX_TEXT_CHARS) { truncated = true; break; }
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(it => it.str).join(' ').trim();
    const marker   = `[Page ${i}]\n`;
    const chunk    = marker + pageText + '\n\n';
    const remaining = MAX_TEXT_CHARS - text.length;
    if (chunk.length > remaining) { text += chunk.slice(0, remaining); truncated = true; break; }
    text += chunk;
    if (onProgress) onProgress(Math.round((i / total) * 100));
  }
  return { id, name: file.name || 'document.pdf', mime: 'application/pdf',
    kind: 'text', size: file.size, textContent: text, truncated, pageCount: total, rawData };
}

// Lazy-load office document parsing libraries from CDN only when first needed.
function _mkLoader(url, globalName) {
  let p = null;
  return () => {
    if (p) return p;
    p = new Promise((resolve, reject) => {
      if (window[globalName]) { resolve(window[globalName]); return; }
      const s = document.createElement('script'); s.src = url;
      s.onload  = () => { if (window[globalName]) resolve(window[globalName]); else reject(new Error(globalName + ' did not initialise')); };
      s.onerror = () => { p = null; reject(new Error('Could not load ' + globalName + ' library — check your connection')); };
      document.head.appendChild(s);
    });
    return p;
  };
}
const loadJsZip   = _mkLoader('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'JSZip');
const loadMammoth = _mkLoader('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', 'mammoth');
const loadSheetJs = _mkLoader('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'XLSX');

async function readPptxFile(file, id, onProgress) {
  const JSZip = await loadJsZip();
  const buf   = await file.arrayBuffer();
  const zip   = await JSZip.loadAsync(buf);
  const slideFiles = Object.keys(zip.files)
    .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => parseInt(a.match(/slide(\d+)\.xml$/)[1]) - parseInt(b.match(/slide(\d+)\.xml$/)[1]));
  const total = slideFiles.length;
  let text = '', truncated = false;
  const decodeXml = s => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
  for (let i = 0; i < slideFiles.length; i++) {
    if (text.length >= MAX_TEXT_CHARS) { truncated = true; break; }
    const xml = await zip.files[slideFiles[i]].async('string');
    const slideText = (xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [])
      .map(m => decodeXml(m.replace(/<[^>]+>/g, ''))).filter(s => s.trim()).join(' ');
    const chunk = `[Slide ${i + 1}]\n${slideText}\n\n`;
    const remaining = MAX_TEXT_CHARS - text.length;
    if (chunk.length > remaining) { text += chunk.slice(0, remaining); truncated = true; break; }
    text += chunk;
    if (onProgress) onProgress(Math.round(((i + 1) / total) * 100));
  }
  return { id, name: file.name || 'presentation.pptx',
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    kind: 'text', size: file.size, textContent: text, truncated, slideCount: total, docType: 'pptx' };
}

async function readDocxFile(file, id) {
  const mammoth = await loadMammoth();
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  let text = result.value || '';
  const paragraphCount = text.split(/\n+/).map(s => s.trim()).filter(Boolean).length;
  const truncated = text.length > MAX_TEXT_CHARS;
  if (truncated) text = text.slice(0, MAX_TEXT_CHARS);
  return { id, name: file.name || 'document.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    kind: 'text', size: file.size, textContent: text, truncated, paragraphCount, docType: 'docx' };
}

async function readXlsxFile(file, id) {
  const XLSX = await loadSheetJs();
  const buf  = new Uint8Array(await file.arrayBuffer());
  const wb   = XLSX.read(buf, { type: 'array' });
  let text = '', truncated = false;
  for (const sheetName of wb.SheetNames) {
    if (text.length >= MAX_TEXT_CHARS) { truncated = true; break; }
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName], { blankrows: false });
    const chunk = `[Sheet: ${sheetName}]\n${csv}\n\n`;
    const remaining = MAX_TEXT_CHARS - text.length;
    if (chunk.length > remaining) { text += chunk.slice(0, remaining); truncated = true; break; }
    text += chunk;
  }
  return { id, name: file.name || 'spreadsheet.xlsx',
    mime: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    kind: 'text', size: file.size, textContent: text, truncated, sheetCount: wb.SheetNames.length, docType: 'xlsx' };
}

function readImageFile(file, id) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = String(r.result);
      const comma = dataUrl.indexOf(',');
      resolve({ id, name: file.name || 'image', mime: file.type || 'image/png',
        kind: 'image', size: file.size, data: dataUrl.slice(comma + 1), dataUrl });
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function readTextFile(file, id) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      let text = String(r.result);
      const truncated = text.length > MAX_TEXT_CHARS;
      if (truncated) text = text.slice(0, MAX_TEXT_CHARS);
      resolve({ id, name: file.name || 'file', mime: file.type || 'text/plain',
        kind: 'text', size: file.size, textContent: text, truncated });
    };
    r.onerror = reject;
    r.readAsText(file);
  });
}

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

async function addFiles(fileList) {
  const all = Array.from(fileList || []);
  const accepted = all.filter(f => isImageFile(f) || isTextFile(f) || isPdfFile(f) || isOfficeFile(f));
  const rejected = all.filter(f => !isImageFile(f) && !isTextFile(f) && !isPdfFile(f) && !isOfficeFile(f));
  if (rejected.length) toast(`Unsupported: ${rejected.map(f => '"' + f.name + '"').join(', ')}`);

  for (const f of accepted) {
    if (attachments.length >= MAX_ATTACH) { toast(`Up to ${MAX_ATTACH} attachments`); break; }
    const isImg    = isImageFile(f);
    const isPdf    = isPdfFile(f);
    const isOffice = isOfficeFile(f);
    const docType  = isOffice ? officeDocType(f) : null;
    const limit    = isImg ? MAX_ATTACH_BYTES : isOffice ? MAX_OFFICE_ATTACH_BYTES : MAX_TEXT_ATTACH_BYTES;
    const limitMB  = isImg ? '8' : isOffice ? '10' : '5';
    if (f.size > limit) { toast(`"${f.name}" is too large (max ${limitMB} MB)`); continue; }

    // Add pending placeholder so the chip appears immediately with a spinner
    const id = 'a' + Date.now().toString(36) + (_attc++).toString(36);
    attachments.push({ id, name: f.name, mime: isPdf ? 'application/pdf' : f.type,
      kind: isImg ? 'image' : 'text', pending: true, size: f.size,
      ...(docType ? { docType } : {}) });
    renderAttachments(); updateSendEnabled();

    try {
      let att;
      if (isImg) {
        att = await readImageFile(f, id);
      } else if (isPdf) {
        att = await readPdfFile(f, id, (pct) => {
          const idx = attachments.findIndex(a => a.id === id);
          if (idx >= 0) { attachments[idx].progress = pct; renderAttachments(); }
        });
      } else if (isPptxFile(f)) {
        att = await readPptxFile(f, id, (pct) => {
          const idx = attachments.findIndex(a => a.id === id);
          if (idx >= 0) { attachments[idx].progress = pct; renderAttachments(); }
        });
      } else if (isDocxFile(f)) {
        att = await readDocxFile(f, id);
      } else if (isXlsxFile(f)) {
        att = await readXlsxFile(f, id);
      } else {
        att = await readTextFile(f, id);
      }
      const idx = attachments.findIndex(a => a.id === id);
      if (idx >= 0) attachments[idx] = att;
    } catch (err) {
      toast(`Could not read "${f.name}"${err?.message ? ': ' + err.message : ''}`);
      // Show error chip briefly so the user sees which file failed, then auto-remove
      const eIdx = attachments.findIndex(a => a.id === id);
      if (eIdx >= 0) {
        attachments[eIdx] = { ...attachments[eIdx], error: true };
        renderAttachments(); updateSendEnabled();
        setTimeout(() => {
          attachments = attachments.filter(a => a.id !== id);
          renderAttachments(); buildChips(); updateVisionNote(); updateSendEnabled();
        }, 2500);
        continue;
      } else {
        attachments = attachments.filter(a => a.id !== id);
      }
    }
    renderAttachments(); buildChips(); updateVisionNote(); updateSendEnabled();
  }
  if (!accepted.length) renderAttachments();
}

function removeAttachment(id) { attachments = attachments.filter(a => a.id !== id); renderAttachments(); buildChips(); updateVisionNote(); updateSendEnabled(); }
function clearAttachments() { attachments = []; renderAttachments(); buildChips(); updateVisionNote(); updateSendEnabled(); }
const DOC_ICON  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
const IMG_ICON  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
const FAIL_ICON  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;color:#f87171" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
// Inline SVG icons for the vision/attachment note (replaces emoji per North-star directive)
const VN_CLIP  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:text-bottom" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;
const VN_DOC   = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:text-bottom" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
const VN_WARN  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:text-bottom" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
const VN_LOCK  = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:text-bottom" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
function renderAttachments() {
  const strip = $('attachStrip'); if (!strip) return;
  strip.hidden = attachments.length === 0;
  strip.innerHTML = attachments.map(a => {
    // Error state — shown briefly before auto-removal so user sees which file failed
    if (a.error) {
      return `<div class="attach-file-chip error" title="Could not read ${escapeHtml(a.name)}" role="alert">` +
        FAIL_ICON +
        `<span class="afc-name">${escapeHtml(a.name)}</span>` +
        `<span class="afc-size afc-err-label">failed</span>` +
        `</div>`;
    }
    if (a.kind === 'image') {
      if (a.pending) return `<div class="attach-file-chip pending" title="Reading ${escapeHtml(a.name)}…"><span class="afc-spinner"></span><span class="afc-name">${escapeHtml(a.name)}</span></div>`;
      return `<div class="attach-thumb" title="${escapeHtml(a.name)}"><img src="${a.dataUrl}" alt="${escapeHtml(a.name)}">` +
        `<button class="at-x" data-id="${a.id}" title="Remove" aria-label="Remove ${escapeHtml(a.name)}">×</button></div>`;
    }
    // text / PDF / office file chip
    if (a.pending) {
      const pctLabel = a.progress != null ? `${a.progress}%` : '';
      const verb = (a.mime === 'application/pdf' || a.docType) ? 'Extracting' : 'Reading';
      return `<div class="attach-file-chip pending" title="${verb} ${escapeHtml(a.name)}…">` +
        `<span class="afc-spinner"></span><span class="afc-name">${escapeHtml(a.name)}</span>` +
        (pctLabel ? `<span class="afc-size">${pctLabel}</span>` : '') +
        `</div>`;
    }
    const metaLabel = a.mime === 'application/pdf' && a.pageCount ? `${a.pageCount}p`
      : a.docType === 'pptx' && a.slideCount != null ? `${a.slideCount} slides`
      : a.docType === 'xlsx' && a.sheetCount != null ? `${a.sheetCount} sheets`
      : a.docType === 'docx' && a.paragraphCount != null ? `${a.paragraphCount} paragraphs`
      : fmtBytes(a.size);
    const tipText = a.mime === 'application/pdf' && a.pageCount
      ? `${escapeHtml(a.name)} · ${a.pageCount} pages extracted${a.truncated ? ' (truncated)' : ''}`
      : a.docType === 'pptx' && a.slideCount != null
      ? `${escapeHtml(a.name)} · ${a.slideCount} slides extracted${a.truncated ? ' (truncated)' : ''}`
      : a.docType === 'xlsx' && a.sheetCount != null
      ? `${escapeHtml(a.name)} · ${a.sheetCount} sheets extracted${a.truncated ? ' (truncated)' : ''}`
      : a.docType === 'docx' && a.paragraphCount != null
      ? `${escapeHtml(a.name)} · ${a.paragraphCount} paragraphs extracted${a.truncated ? ' (truncated)' : ''}`
      : `${escapeHtml(a.name)} · ${fmtBytes(a.size)}`;
    return `<div class="attach-file-chip" title="${tipText}">${DOC_ICON}<span class="afc-name">${escapeHtml(a.name)}</span><span class="afc-size">${metaLabel}</span>` +
      `<button class="at-x" data-id="${a.id}" title="Remove" aria-label="Remove ${escapeHtml(a.name)}">×</button></div>`;
  }).join('');
  strip.querySelectorAll('.at-x').forEach(b => b.onclick = () => removeAttachment(b.dataset.id));
}
// How many currently-selected models can / can't read images.
function visionSplit() {
  const list = sels();
  const can = list.filter(s => modelSupportsVision(s.provider, s.model));
  return { total: list.length, can: can.length, cannot: list.length - can.length };
}
function updateVisionNote() {
  const note = $('visionNote'); if (!note) return;
  const imgAtts = attachments.filter(a => a.kind === 'image' && !a.pending);
  const pdfAtts    = attachments.filter(a => a.kind === 'text' && !a.pending && a.mime === 'application/pdf');
  const officeAtts = attachments.filter(a => a.kind === 'text' && !a.pending && ['pptx','docx','xlsx'].includes(a.docType));
  const txtAtts    = attachments.filter(a => a.kind === 'text' && !a.pending && a.mime !== 'application/pdf' && !['pptx','docx','xlsx'].includes(a.docType));
  if (!imgAtts.length && !pdfAtts.length && !officeAtts.length && !txtAtts.length) { note.hidden = true; note.innerHTML = ''; return; }
  note.hidden = false;
  const parts = [];
  if (imgAtts.length) {
    const { total, can, cannot } = visionSplit();
    const n = imgAtts.length, iw = n === 1 ? 'image' : 'images';
    if (!total) parts.push(`${VN_CLIP} ${n} ${iw} attached — add a model to send.`);
    else if (cannot === 0) parts.push(`${VN_CLIP} ${n} ${iw} attached — <b>all ${total} models</b> will see ${n === 1 ? 'it' : 'them'}.`);
    else if (can === 0) parts.push(`<span class="vn-warn">${VN_WARN} None of your selected models can read images</span> — they'll get text only. Add a vision model.`);
    else parts.push(`${VN_CLIP} ${n} ${iw} attached — <b>${can} of ${total}</b> models can read ${n === 1 ? 'it' : 'them'}; the other ${cannot} get <span class="vn-warn">text only</span>.`);
  }
  if (pdfAtts.length) {
    const n = pdfAtts.length, fw = n === 1 ? 'PDF' : 'PDFs';
    const allSels = sels();
    const nativeSels = allSels.filter(s => PROVIDERS[s.provider]?.nativePdf);
    const hasRaw = pdfAtts.some(a => a.rawData);
    if (hasRaw && nativeSels.length > 0 && nativeSels.length < allSels.length) {
      const names = [...new Set(nativeSels.map(s => PROVIDERS[s.provider].short))].join(', ');
      parts.push(`${VN_DOC} ${n} ${fw} — sent natively (full fidelity) to ${escapeHtml(names)}; text extracted for other models.`);
    } else if (hasRaw && nativeSels.length > 0 && nativeSels.length === allSels.length) {
      parts.push(`${VN_DOC} ${n} ${fw} — sent natively (full-fidelity PDF, not just extracted text).`);
    } else {
      parts.push(`${VN_DOC} ${n} ${fw} — text extracted in your browser, sent to all models.`);
    }
  }
  if (officeAtts.length) {
    const n = officeAtts.length, fw = n === 1 ? 'document' : 'documents';
    parts.push(`${VN_CLIP} ${n} office ${fw} — text extracted in your browser, sent to all models.`);
  }
  if (txtAtts.length) {
    const n = txtAtts.length, fw = n === 1 ? 'file' : 'files';
    parts.push(`${VN_DOC} ${n} text ${fw} — content sent to all models.`);
  }
  // Show total context budget used by all extracted text files
  const allExtracted = [...pdfAtts, ...officeAtts, ...txtAtts].filter(a => a.textContent != null);
  if (allExtracted.length) {
    const totalChars = allExtracted.reduce((s, a) => s + a.textContent.length, 0);
    if (totalChars > 1000) {
      const kChars = totalChars >= 10000 ? Math.round(totalChars / 1000) + 'k' : (totalChars / 1000).toFixed(1) + 'k';
      const budgetK = Math.round(MAX_TOTAL_TEXT_CHARS / 1000);
      if (totalChars > MAX_TOTAL_TEXT_CHARS) {
        parts.push(`Context: ~${kChars} chars extracted <span class="vn-warn">— over ${budgetK}k limit; the most recently attached files will be trimmed first on send</span>`);
      } else {
        const pct = Math.round(totalChars / MAX_TOTAL_TEXT_CHARS * 100);
        parts.push(`Context: ~${kChars} chars of ${budgetK}k budget${pct >= 80 ? ' <span class="vn-warn">(budget nearly full)</span>' : ''}`);
      }
    }
  }
  // Privacy reassurance — shown whenever any non-image file is attached
  if (pdfAtts.length || officeAtts.length || txtAtts.length) {
    parts.push(`<span class="vn-privacy">${VN_LOCK} Read in your browser — nothing is uploaded to any server.</span>`);
  }
  note.innerHTML = parts.join('<br>');
}
function updateSendEnabled() {
  const send = $('sendBtn'); if (!send) return;
  const hasPending = attachments.some(a => a.pending);
  const hasContent = $('promptInput').value.trim().length > 0 || attachments.some(a => !a.pending);
  const _n = sels().length;
  send.disabled = !_n || !hasContent || hasPending;
  send.title = hasPending ? 'Reading files…' : (_n > 1 ? `Send to ${_n} models (⌘↵)` : 'Send (⌘↵)');
}

// ── Model chips (prompt footer) ─────────────────────────────────────────────
function buildChips() {
  const row = $('modelChips'), send = $('sendBtn');
  row.innerHTML = '';
  const list = sels();

  if (!list.length) {
    const why = configuredProviders(cfg).length ? 'No models selected' : 'No models';
    row.innerHTML = `<span class="no-config-hint">${why} — <button id="hintAdd">add one ${GEAR_SM_SVG}</button></span>`;
    $('hintAdd').onclick = () => openConfig('models');
    send.disabled = true;
    const _st = send.querySelector('.send-text');
    if (_st) _st.innerHTML = 'Send to all <kbd>⌘↵</kbd>';
    return;
  }
  updateSendEnabled();

  const haveImages = attachments.some(a => a.kind === 'image' && !a.pending);
  list.forEach(sel => {
    const p = PROVIDERS[sel.provider];
    const st = statusOf(sel.provider, sel.model);
    const vision = modelSupportsVision(sel.provider, sel.model);
    let cls = 'm-chip' + (st && st.ok === false ? ' failing' : '');
    if (haveImages) cls += vision ? ' has-vision' : ' no-vision';
    const chip = el('span', cls);
    chip.id = 'chip_' + sel.id;
    chip.style.setProperty('--c', p?.color || '#888');
    chip.title = st && st.ok === false ? 'Last test failed: ' + (st.error || 'unavailable')
      : selectionLabel(sel) + (vision ? ' · reads images' : ' · text only (no image support)');
    const visionMark = vision ? `<span class="m-chip-vision" title="Reads images">${EYE_SVG}</span>`
      : (haveImages ? `<span class="m-chip-novision" title="Can't read images — gets text only">${EYE_OFF_SVG}</span>` : '');
    chip.innerHTML =
      `<span class="m-chip-dot"></span>` +
      `<span class="m-chip-label">${escapeHtml(selectionLabel(sel))}</span>` +
      visionMark +
      `<button class="m-chip-x" title="Remove" aria-label="Remove ${escapeHtml(selectionLabel(sel))}">×</button>`;
    chip.querySelector('.m-chip-x').onclick = (e) => { e.stopPropagation(); removeSelection(sel.id); };
    row.appendChild(chip);
  });

  if (list.length < MAX_SELECTIONS) {
    const add = el('button', 'm-chip m-chip-add', '+ Add');
    add.title = 'Add a model';
    add.onclick = () => openConfig('models');
    row.appendChild(add);
  }

  // Show model count in the send button — makes the multi-model count concrete.
  const sendText = send.querySelector('.send-text');
  if (sendText) sendText.innerHTML = list.length === 1
    ? `Send <kbd>⌘↵</kbd>`
    : `Send to ${list.length} <kbd>⌘↵</kbd>`;

  updateVisionNote();
  updateChipsFade();
}
// Shows a right-edge fade over the model-chip row when it's scrolled and more
// chips (or "+ Add") sit off-screen — the row hides its scrollbar for looks,
// so without this a phone user has no visual cue there's anything to swipe to.
function updateChipsFade() {
  const row = $('modelChips'), fade = $('mcFade');
  if (!row || !fade) return;
  const hasMore = row.scrollWidth - row.clientWidth - row.scrollLeft > 4;
  fade.classList.toggle('show', hasMore);
}
// Same affordance as updateChipsFade(), for the model/consensus tab bar above the
// transcript — it hides its scrollbar too, so on a phone with 3+ models the
// Consensus tab (the whole point of the app) can sit scrolled off-screen with no cue.
function updateTabBarFade() {
  const row = $('tabBar'), fade = $('tbFade');
  if (!row || !fade) return;
  const hasMore = row.scrollWidth - row.clientWidth - row.scrollLeft > 4;
  fade.classList.toggle('show', hasMore);
}
function setChipsDisabled(disabled) {
  document.querySelectorAll('.m-chip').forEach(c => c.classList.toggle('disabled', disabled));
}
function removeSelection(id) {
  cfg.selections = (cfg.selections || []).filter(s => s.id !== id);
  if (cfg.arbitration.arbiter === id) cfg.arbitration.arbiter = 'auto';
  persist();
  $('tab_' + id)?.remove();
  $('panel_' + id)?.remove();
  delete convos[id];
  if (activeTab === id) { const f = sels()[0]; if (f) switchTab(f.id); }
  buildChips(); renderModels();
}
function moveSelection(id, dir) {
  const arr = cfg.selections || [];
  const idx = arr.findIndex(s => s.id === id);
  if (idx < 0) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= arr.length) return;
  [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
  persist(); renderModels(); buildChips();
}
function setArbiter(id) {
  const prev = cfg.arbitration.arbiter;
  if (prev && prev !== 'auto' && prev !== id) {
    const prevSel = (cfg.selections || []).find(s => s.id === prev);
    // A stale "synthesis only" flag on a model that's no longer the arbiter would
    // silently exclude it from answering with no visible indicator anywhere.
    if (prevSel && prevSel.arbiterOnly) prevSel.arbiterOnly = false;
  }
  cfg.arbitration.arbiter = id;
  persist(); renderModels(); renderArbitration(); buildChips();
}

// ── Tabs ─────────────────────────────────────────────────────────────────
function pruneTabs() {
  const liveIds = new Set(sels().map(s => s.id));
  document.querySelectorAll('.tab[data-svc]').forEach(t => {
    const id = t.dataset.svc;
    if (id !== 'consensus' && !liveIds.has(id)) {
      $('panel_' + id)?.remove(); t.remove();
      if (activeTab === id) activeTab = null;
    }
  });
  updateTabBarFade();
}
function ensureTabs(selList) {
  const tabBar = $('tabBar'), panels = $('tabPanels');
  const list = selList || sels();

  // consensus tab respects the toggle
  if (!cfg.consensus) {
    $('tab_consensus')?.remove(); $('panel_consensus')?.remove();
    if (activeTab === 'consensus') activeTab = null;
  }

  list.forEach(sel => {
    if ($('tab_' + sel.id)) return;
    const p = PROVIDERS[sel.provider];
    const dotColor = p?.color || '#888';
    const btn = el('button', 'tab');
    btn.id = 'tab_' + sel.id; btn.dataset.svc = sel.id;
    btn.setAttribute('role', 'tab'); btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('aria-controls', 'panel_' + sel.id);
    btn.onclick = () => switchTab(sel.id);
    btn.innerHTML =
      `<span class="tab-dot" id="tdot_${sel.id}" style="background:${dotColor};--dot-c:${dotColor}"></span>` +
      `<div class="tab-inner"><span class="tab-label">${escapeHtml(selectionLabel(sel))}</span><span class="tab-stance" id="tstance_${sel.id}" hidden></span></div>`;
    tabBar.insertBefore(btn, $('tab_consensus') || null);

    const panel = el('div', 'tab-panel');
    panel.id = 'panel_' + sel.id;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('tabindex', '0');
    panel.setAttribute('aria-labelledby', 'tab_' + sel.id);
    panel.innerHTML =
      `<div class="conversation" id="conv_${sel.id}"><div class="empty-state" id="empty_${sel.id}">` +
      `<div class="empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>` +
      `<div>Send a prompt to see ${escapeHtml(selectionLabel(sel))}</div></div></div>`;
    panels.appendChild(panel);
  });

  if (cfg.consensus && !$('tab_consensus')) {
    const btn = el('button', 'tab');
    btn.id = 'tab_consensus'; btn.dataset.svc = 'consensus';
    btn.setAttribute('role', 'tab'); btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('aria-controls', 'panel_consensus');
    btn.onclick = () => switchTab('consensus');
    btn.innerHTML =
      `<span class="tab-dot" id="tdot_consensus" style="background:var(--consensus);--dot-c:var(--consensus)"></span>` +
      `<div class="tab-inner">Consensus<span class="tab-step" id="consensus-tab-step"></span><span class="tab-agree-badge" id="consensus-agree-badge" hidden></span></div>`;
    tabBar.appendChild(btn);

    const panel = el('div', 'tab-panel');
    panel.id = 'panel_consensus';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('tabindex', '0');
    panel.setAttribute('aria-labelledby', 'tab_consensus');
    panel.innerHTML =
      `<div class="conversation" id="conv_consensus"><div class="empty-state" id="empty_consensus">` +
      `<div class="empty-icon consensus-glyph"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="5.6" y1="5.6" x2="7.8" y2="7.8"/><line x1="16.2" y1="16.2" x2="18.4" y2="18.4"/><line x1="5.6" y1="18.4" x2="7.8" y2="16.2"/><line x1="16.2" y1="7.8" x2="18.4" y2="5.6"/></svg></div>` +
      `<div id="consensus-status">Consensus appears here after all models respond</div></div></div>`;
    panels.appendChild(panel);
  }
  if ((!activeTab || !$('tab_' + activeTab)) && list.length) switchTab(list[0].id);
  updateTabBarFade();
}
function switchTab(id) {
  activeTab = id;
  const color = id === 'consensus' ? 'var(--consensus)' : PROVIDERS[selById(id)?.provider]?.color;
  document.querySelectorAll('.tab').forEach(t => {
    const on = t.dataset.svc === id;
    t.classList.toggle('active', on);
    t.style.borderBottomColor = on ? color : 'transparent';
    t.style.color = on ? 'var(--text)' : '';
    t.setAttribute('aria-selected', String(on));
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'panel_' + id));
}

// ── Stream a response into a tab ────────────────────────────────────────────
// Keep a conversation scrolled to the newest message (bottom).
function scrollBottom(conv) { if (conv) conv.scrollTop = conv.scrollHeight; }
// Gemini-style: bring the start of a new exchange to the top of the viewport so
// the answer reads top-down below the question instead of the view glueing to
// the bottom and yanking on every streamed token.
function scrollPairToTop(conv, pair) {
  if (!conv || !pair) return;
  const delta = pair.getBoundingClientRect().top - conv.getBoundingClientRect().top;
  conv.scrollTop += delta - 8;
}
// Thumbnails / file chips for attachments on a user message.
function attachThumbsHtml(atts) {
  if (!atts || !atts.length) return '';
  return `<div class="msg-attachments">` + atts.map(im => {
    if (im.kind === 'text') return `<span class="msg-file-chip">${DOC_ICON} ${escapeHtml(im.name || 'file')}</span>`;
    return im.dataUrl
      ? `<img class="msg-thumb" src="${im.dataUrl}" alt="${escapeHtml(im.name || 'image')}" title="${escapeHtml(im.name || 'image')}">`
      : `<span class="msg-file-chip">${IMG_ICON} ${escapeHtml(im.name || 'image')}</span>`;
  }).join('') + `</div>`;
}
function userMsgHtml(userContent, images) {
  return `<div class="msg user"><span class="msg-label">You</span>` +
    attachThumbsHtml(images) +
    (userContent ? `<div class="msg-bubble">${nl2br(userContent)}</div>` : '') +
    (userContent ? `<div class="msg-user-actions"><button class="user-edit-btn" data-edit-prompt="${escapeHtml(userContent)}" title="Edit this prompt" aria-label="Edit this prompt">${EDIT_SVG}</button></div>` : '') +
    `</div>`;
}
function assistantPair(label, userContent, images) {
  const pair = el('div', 'qa-pair');
  pair.innerHTML =
    userMsgHtml(userContent, images) +
    `<div class="msg assistant"><div class="msg-head"><span class="msg-label">${escapeHtml(label)}</span>` +
    `<span class="msg-time" hidden></span>` +
    `<button class="copy-btn" title="Copy" aria-label="Copy" hidden>${COPY_SVG}</button></div>` +
    `<div class="msg-bubble"><div class="loading-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div></div>`;
  return pair;
}
// Show how long a model took to respond — makes the parallel multi-model race tangible.
function setMsgTime(pair, ms) {
  const t = pair?.querySelector('.msg-time'); if (!t || !(ms >= 0)) return;
  const secs = ms / 1000;
  const label = (secs < 10 ? secs.toFixed(1) : Math.round(secs)) + 's';
  t.textContent = label;
  t.title = `Responded in ${label}`;
  t.hidden = false;
}
// Strip chat-template control tokens that some models (especially via the
// free-demo proxy) leak into their output — e.g. <|start|>, <|end|>, <|eot_id|>,
// <|im_start|>, <s>, </s>. These are never meaningful content; showing them (or
// feeding them to the arbiter) just looks broken. Conservative: only removes the
// well-known <|...|> and <s>/</s> markers, leaving all real text intact.
function cleanModelText(s) {
  if (!s) return s;
  return s
    .replace(/<\|[^|>]*\|>/g, '')   // <|start|>, <|end|>, <|eot_id|>, <|im_start|>, ...
    .replace(/<\/?s>/g, '')         // <s>  </s>
    .trim();
}
// Turn opaque browser fetch errors (network down, an ad blocker/privacy
// extension killing the request, DNS hiccups) into a plain-language message.
// Provider-specific errors (bad key, rate limit, HTTP status) already carry
// their own useful text from providers.js and pass through unchanged.
function friendlyErrorMessage(err, sel) {
  const raw = err?.message || 'error';
  if (/failed to fetch|networkerror when attempting to fetch|load failed/i.test(raw)) {
    const label = sel ? selectionLabel(sel) : 'this model';
    return `Couldn't reach ${label} — check your internet connection, or an ad blocker/privacy extension may be blocking the request.`;
  }
  return raw;
}
function finishBubble(pair, full) {
  const bubble = pair.querySelector('.msg.assistant .msg-bubble');
  const copyBtn = pair.querySelector('.copy-btn');
  if (!full) {
    bubble.innerHTML = '<span class="msg-empty">No usable answer came back from this model. Use the regenerate button above to try again.</span>';
    return;
  }
  highlightBubble(bubble);
  copyBtn.hidden = false; copyBtn.onclick = () => copyText(full, copyBtn);
}

async function streamTo(sel, userContent, images, displayAtts, nativePdfs = null) {
  const co = getConvo(sel.id);
  const userMsg = { role: 'user', content: userContent };
  if (images && images.length) userMsg.images = images;         // image attachments for API
  if (nativePdfs && nativePdfs.length) userMsg.pdfs = nativePdfs; // native PDF blocks for Anthropic/Gemini
  co.push(userMsg);
  const conv = $('conv_' + sel.id);
  $('empty_' + sel.id)?.remove();

  const pair = assistantPair(selectionLabel(sel), userContent, displayAtts || images);
  conv.appendChild(pair); scrollPairToTop(conv, pair);
  const bubble = pair.querySelector('.msg.assistant .msg-bubble');

  const dot = $('tdot_' + sel.id); dot?.classList.add('loading');
  markRun(sel.id, 'streaming');
  let full = '';
  const t0 = performance.now();
  try {
    const runOpts = makeRunOpts(PROVIDERS[sel.provider]);
    const gen = makeGen(sel, co, cfg, runOpts);
    bubble.innerHTML = '';
    let _prevTs = 0;
    // Don't auto-follow while streaming — the question is pinned to the top and
    // the answer grows below it, so the reader keeps their place (Gemini-style).
    for await (const chunk of gen) {
      full += chunk;
      const shown = cleanModelText(full);
      bubble.innerHTML = renderMarkdown(shown);
      // Live preview in the consensus progress box — throttled to ~8fps so it stays smooth.
      if (cfg.consensus) {
        const now = performance.now();
        if (now - _prevTs > 125) {
          _prevTs = now;
          const raw = shown.replace(/[#*`_>\[\]!]/g, ' ').replace(/\s+/g, ' ').trim();
          const preview = raw.length > 90 ? raw.slice(0, 87) + '…' : raw;
          streamPreviews[sel.id] = preview;
          const prevEl = $('cprev_' + sel.id);
          if (prevEl) { prevEl.textContent = preview; prevEl.classList.add('has-text'); }
        }
      }
    }
    full = cleanModelText(full);
    finishBubble(pair, full);
    if (full) {
      const elapsed = performance.now() - t0;
      responseTimes[sel.id] = elapsed;
      setMsgTime(pair, elapsed);
    }
    addRegenBtn(sel, pair);   // always offer retry — including on empty/garbage responses
    co.push({ role: 'assistant', content: full });
    markRun(sel.id, 'done');
    return full;
  } catch (err) {
    const isStop = err?.name === 'AbortError' && _userStopped;
    full = cleanModelText(full);
    if (isStop && full) {
      // User pressed Stop mid-stream — keep the partial response, add a subtle indicator.
      finishBubble(pair, full);
      const stEl = el('span', 'msg-stopped'); stEl.textContent = ' (stopped)';
      pair.querySelector('.msg.assistant .msg-bubble')?.appendChild(stEl);
      co.push({ role: 'assistant', content: full });
      markRun(sel.id, 'done');
      return full;
    }
    if (isStop) {
      // Stopped before any content arrived — leave an empty-looking bubble.
      bubble.textContent = '';
      co.pop();
      markRun(sel.id, 'done');
      return null;
    }
    const msg = err?.name === 'AbortError' ? 'Request timed out' : friendlyErrorMessage(err, sel);
    bubble.innerHTML = `<span class="msg-error">Error: ${escapeHtml(msg)}</span>`;
    co.pop();
    markRun(sel.id, 'error');
    return null;
  } finally {
    if (dot) { dot.classList.remove('loading'); dot.classList.add('done'); setTimeout(() => dot.classList.remove('done'), 350); }
  }
}

// ── Per-model regenerate ────────────────────────────────────────────────────
// Adds a ↺ button to the finished pair's header so the user can ask one model
// to try again without re-running every model. Only valid on the last response.
function addRegenBtn(sel, pair) {
  const msgHead = pair.querySelector('.msg.assistant .msg-head');
  if (!msgHead) return;
  const btn = el('button', 'copy-btn regen-btn');
  btn.innerHTML = REGEN_SVG;
  btn.title = 'Regenerate this response';
  btn.setAttribute('aria-label', 'Regenerate response from ' + selectionLabel(sel));
  btn.onclick = () => regenModel(sel, pair);
  msgHead.appendChild(btn);
}

async function regenModel(sel, pair) {
  const co = getConvo(sel.id);
  const conv = $('conv_' + sel.id);
  if (!conv) return;

  // Guard: only allow regenerating the most recent pair in this conversation.
  const allPairs = [...conv.querySelectorAll('.qa-pair')];
  if (!allPairs.length || pair !== allPairs[allPairs.length - 1]) {
    toast('Can only regenerate the most recent response');
    return;
  }
  // Guard: last history entry must be an assistant message.
  if (!co.length || co[co.length - 1].role !== 'assistant') {
    toast('Nothing to regenerate');
    return;
  }

  // Pop the old assistant message so the conversation ends with the user turn.
  co.pop();

  // Use lastPrompt (the user's original typed text) for a clean display.
  const lastUser = [...co].reverse().find(m => m.role === 'user');
  const displayText = lastPrompt || lastUser?.content || '';

  // Replace the old DOM pair with a fresh streaming pair.
  pair.remove();
  const newPair = assistantPair(selectionLabel(sel), displayText, lastUser?.images || null);
  conv.appendChild(newPair);
  scrollPairToTop(conv, newPair);
  const bubble = newPair.querySelector('.msg.assistant .msg-bubble');

  const dot = $('tdot_' + sel.id);
  dot?.classList.add('loading');
  markRun(sel.id, 'streaming');
  let full = '';
  const t0 = performance.now();
  bubble.innerHTML = '';
  try {
    const gen = makeGen(sel, co, cfg);
    for await (const chunk of gen) { full += chunk; bubble.innerHTML = renderMarkdown(cleanModelText(full)); }
    full = cleanModelText(full);
    finishBubble(newPair, full);
    if (full) {
      setMsgTime(newPair, performance.now() - t0);
      addRegenBtn(sel, newPair);
    }
    co.push({ role: 'assistant', content: full });
    results[sel.id] = full;
    markRun(sel.id, 'done');
    if (cfg.consensus && full) toast('Response regenerated — ask a follow-up to refresh the consensus');
    return full;
  } catch (err) {
    const msg = err?.name === 'AbortError' ? 'Request timed out' : friendlyErrorMessage(err, sel);
    bubble.innerHTML = `<span class="msg-error">Error: ${escapeHtml(msg)}</span>`;
    co.push({ role: 'assistant', content: '' });
    markRun(sel.id, 'error');
    return null;
  } finally {
    if (dot) { dot.classList.remove('loading'); dot.classList.add('done'); setTimeout(() => dot.classList.remove('done'), 350); }
  }
}

// Greeting placeholder (shown before any conversation exists)
function hideGreeting() { $('chatGreeting')?.classList.add('hidden'); document.body.classList.remove('is-empty'); }
function showGreeting() { const g = $('chatGreeting'); if (g && !document.querySelector('.tab')) { g.classList.remove('hidden'); document.body.classList.add('is-empty'); } }

// Rotating, clickable example questions — show how it works at a glance.
const SUGGESTIONS = [
  "What's the all-time best Beatles song? Pick just one.",
  "What is the most significant event in US history? Choose only one.",
  "Best first programming language to learn in 2026?",
  "Most underrated, best-value, most-fun travel spot — pick one.",
  "Who is the single greatest athlete of all time?",
  "What's the secret to extra-crispy roast potatoes?",
  "Is a hot dog a sandwich? Decide.",
  "Best sci-fi movie ever made — one pick.",
  "Coffee or tea — settle it for good.",
  "What's the most important habit for a longer, healthier life?",
  "Greatest video game of all time?",
  "Explain quantum entanglement like I'm 12.",
  "Will AI replace most knowledge workers in the next 10 years?",
  "Remote work or office work — which actually makes people more productive?",
  "What's the single most overrated technology of the past decade?",
];
let _sugTimer = null;
function pickRandom(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}
function fillPrompt(q) {
  const t = $('promptInput'); if (!t) return;
  t.value = q; autoGrowComposer(t);
  updateSendEnabled(); t.focus();
}
function renderSuggestions() {
  const wrap = $('cgSuggest'); if (!wrap) return;
  wrap.innerHTML = pickRandom(SUGGESTIONS, 4)
    .map(q => `<button class="cg-chip" data-q="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join('');
  wrap.querySelectorAll('.cg-chip').forEach(b => b.onclick = () => fillPrompt(b.dataset.q));
}
function startSuggestionRotation() {
  if (_sugTimer) { clearInterval(_sugTimer); _sugTimer = null; }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;   // randomize once, don't auto-rotate
  _sugTimer = setInterval(() => {
    const g = $('chatGreeting');
    if (!g || g.classList.contains('hidden')) return;            // only while the greeting is visible
    if (($('promptInput')?.value || '').trim()) return;          // don't swap mid-typing
    const wrap = $('cgSuggest'); if (!wrap) return;
    wrap.style.opacity = '0';
    setTimeout(() => { renderSuggestions(); wrap.style.opacity = ''; }, 220);
  }, 7000);
}

// ── Text-file context blocks ─────────────────────────────────────────────────
// Builds the injected context blocks sent to every model, applying a total char
// budget so many large files can't quietly overflow context windows.
function buildTextBlocks(textFiles) {
  let totalUsed = 0, anyTruncated = false;
  const parts = [];
  for (const tf of textFiles) {
    const remaining = MAX_TOTAL_TEXT_CHARS - totalUsed;
    if (remaining <= 0) { anyTruncated = true; continue; }
    let content = tf.textContent || '';
    let fileTruncated = tf.truncated || false;
    if (content.length > remaining) { content = content.slice(0, remaining); fileTruncated = true; anyTruncated = true; }
    totalUsed += content.length;
    // Type hint so every model understands the document kind
    let typeHint = '';
    if (tf.docType === 'pptx') typeHint = tf.slideCount != null ? `PowerPoint presentation, ${tf.slideCount} slides` : 'PowerPoint presentation';
    else if (tf.docType === 'docx') typeHint = tf.paragraphCount != null ? `Word document, ${tf.paragraphCount} paragraphs` : 'Word document';
    else if (tf.docType === 'xlsx') typeHint = tf.sheetCount != null ? `Excel spreadsheet, ${tf.sheetCount} sheets` : 'Excel spreadsheet';
    else if (tf.mime === 'application/pdf') typeHint = tf.pageCount != null ? `PDF document, ${tf.pageCount} pages` : 'PDF document';
    const typeAttr = typeHint ? ` type="${typeHint}"` : '';
    const truncNote = fileTruncated ? `\n[Content truncated — showing first ${content.length.toLocaleString()} characters of the original]` : '';
    parts.push(`<file name="${tf.name}"${typeAttr}>\n${content}${truncNote}\n</file>`);
  }
  return { parts, totalChars: totalUsed, truncated: anyTruncated };
}

// ── Broadcast ───────────────────────────────────────────────────────────────
async function sendAll() {
  const text = $('promptInput').value.trim();
  const readyAtts = attachments.filter(a => !a.pending);
  const imgAtts   = readyAtts.filter(a => a.kind === 'image');
  const textFiles = readyAtts.filter(a => a.kind === 'text');

  // PDFs with rawData can be passed natively to Anthropic/Gemini instead of extracted text.
  const rawPdfAtts     = textFiles.filter(a => a.mime === 'application/pdf' && a.rawData);
  const otherTextFiles = textFiles.filter(a => !(a.mime === 'application/pdf' && a.rawData));

  // userTextFull: all extracted text (used for providers without native PDF support).
  let userTextFull = text;
  if (textFiles.length) {
    const built = buildTextBlocks(textFiles);
    if (built.truncated) toast(`Context capped at ${(MAX_TOTAL_TEXT_CHARS / 1000).toFixed(0)}k characters — some file content was trimmed`);
    if (built.parts.length) userTextFull = built.parts.join('\n\n') + (text ? '\n\n' + text : '');
  }
  // userTextNoPdf: non-PDF extracted text only (PDFs are sent natively for capable providers).
  let userTextNoPdf = text;
  if (otherTextFiles.length) {
    const built = buildTextBlocks(otherTextFiles);
    if (built.parts.length) userTextNoPdf = built.parts.join('\n\n') + (text ? '\n\n' + text : '');
  }

  if (!userTextFull && !imgAtts.length && !rawPdfAtts.length) return;
  const list = sels();
  if (!list.length) {
    const allArbiterOnly = (cfg.selections || []).length > 0 && (cfg.selections || []).every(s => s.arbiterOnly);
    if (allArbiterOnly) { toast('All models are set to synthesis only — at least one must answer. Open Settings to adjust.'); return; }
    openConfig('models'); return;
  }

  lastPrompt = text; results = {}; order = []; lastConsensusText = ''; lastConsensusProvenance = null;
  runStatus = {}; streamPreviews = {}; responseTimes = {}; queryStartTime = performance.now();
  list.forEach(s => runStatus[s.id] = 'pending');
  consensusPhase = 'waiting'; consensusStatusText = ''; consensusStepText = '';
  addToPromptHistory(text);
  _promptHistIdx = -1; _promptHistDraft = '';
  clearDraft();
  $('promptInput').value = ''; autoGrowComposer($('promptInput'));
  clearAttachments();
  $('sendBtn').disabled = true;
  // Set up a fresh run controller so the Stop button can abort all streams.
  _runCtrl = new AbortController(); _userStopped = false;
  const stopBtn = $('stopBtn'); if (stopBtn) { stopBtn.disabled = false; const st = stopBtn.querySelector('.stop-text'); if (st) st.textContent = 'Stop'; }
  hideGreeting();
  setChipsDisabled(true);
  document.body.classList.add('processing');
  pruneTabs(); ensureTabs();
  // Consensus is the headline — focus its tab on send so the reader watches the
  // live multi-model race (each model checking in ✓/✗) and then the synthesis,
  // instead of being parked on one model's stream. Matches the history-restore
  // behaviour, so live and restored chats land in the same place.
  if (cfg.consensus && $('tab_consensus')) switchTab('consensus');
  if (cfg.consensus) refreshConsensusProgress();

  try {
    await Promise.allSettled(list.map(async sel => {
      const useNative = PROVIDERS[sel.provider]?.nativePdf && rawPdfAtts.length > 0;
      const userText  = useNative ? userTextNoPdf : userTextFull;
      const nativePdfs = useNative ? rawPdfAtts : null;
      const r = await streamTo(sel, userText, imgAtts, readyAtts, nativePdfs);
      order.push(sel.id); results[sel.id] = r;
    }));

    if (cfg.consensus && !_userStopped) {
      setConsensusDot(true);
      try { await runConsensus(); } catch (err) { if (err?.name !== 'AbortError') throw err; }
      setConsensusDot(false); setConsensusStep('');
      if (!_userStopped) maybeShowConsHint();
    }
    if (!_userStopped) recordTurn(text, readyAtts);
  } finally {
    document.body.classList.remove('processing');
    setChipsDisabled(false); updateSendEnabled();
    _runCtrl = null; _userStopped = false;
  }
}

// Generate a concise, readable title from the first prompt — strips common
// question preambles, trims punctuation, and title-cases for the sidebar.
function generateTitle(prompt, firstAtt) {
  if (firstAtt) return firstAtt.name;
  if (!prompt) return 'Untitled';
  const t = prompt.trim();
  if (t.length <= 52) return t;
  const stripped = t
    .replace(/^(tell me |explain |describe |give me |write me |what(?:'s| is| are| was| were) |how (do|does|can|should|would) (i|you|we) |who (is|was|are|were) |when (is|was|are|were) |where (is|was|are|were) |why (is|was|are|were) |can you |please |is (it|there|a) |are (there|you) |do you |should i |what |how |who |when |where |why )/i, '')
    .replace(/[?!.]+$/, '')
    .trim();
  if (stripped.length > 0 && stripped.length < t.length) {
    const titled = stripped.charAt(0).toUpperCase() + stripped.slice(1);
    return titled.length <= 56 ? titled : titled.slice(0, 53) + '…';
  }
  const words = t.split(/\s+/);
  let result = '';
  for (const w of words) {
    if (result.length + w.length + 1 > 52) break;
    result = result ? result + ' ' + w : w;
  }
  return result || t.slice(0, 52);
}

// Save this round into the current conversation thread (unless private mode).
// Image data isn't persisted (it would blow past localStorage quota); we keep
// lightweight metadata so restored chats can still show what was attached.
function recordTurn(prompt, atts) {
  if (cfg.private) return;
  if (!order.length) return;
  const answers = {};
  order.forEach(id => { answers[id] = results[id] ?? null; });
  if (!currentThread) {
    const firstAtt = atts && atts[0];
    currentThread = {
      id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      title: generateTitle(prompt, firstAtt),
      createdAt: Date.now(), updatedAt: Date.now(),
      selections: sels().map(s => ({ id: s.id, provider: s.provider, model: s.model })),
      turns: [],
    };
    history.unshift(currentThread);
  }
  const attMeta = (atts && atts.length) ? atts.map(a => ({ name: a.name, mime: a.mime, kind: a.kind || 'image' })) : undefined;
  currentThread.turns.push({ prompt, answers, attachments: attMeta,
    consensus: cfg.consensus ? (lastConsensusText || null) : null,
    provenance: cfg.consensus ? (lastConsensusProvenance || null) : null });
  currentThread.updatedAt = Date.now();
  saveHistory(history);
  renderHistoryList();
}

function resetApp() {
  Object.keys(convos).forEach(k => delete convos[k]);
  lastPrompt = ''; results = {}; order = [];
  runStatus = {}; streamPreviews = {}; responseTimes = {}; queryStartTime = 0;
  consensusPhase = ''; consensusStatusText = ''; consensusStepText = '';
  document.querySelectorAll('.conversation').forEach(conv => {
    const id = conv.id.replace('conv_', '');
    const isCons = id === 'consensus';
    const label = isCons ? 'Consensus appears here after all models respond'
                         : `Send a prompt to see ${escapeHtml(selectionLabel(selById(id) || {}))}`;
    const icon = isCons
      ? `<div class="empty-icon consensus-glyph"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="5.6" y1="5.6" x2="7.8" y2="7.8"/><line x1="16.2" y1="16.2" x2="18.4" y2="18.4"/><line x1="5.6" y1="18.4" x2="7.8" y2="16.2"/><line x1="16.2" y1="7.8" x2="18.4" y2="5.6"/></svg></div>`
      : `<div class="empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>`;
    conv.innerHTML = `<div class="empty-state" id="empty_${id}">${icon}<div id="${isCons ? 'consensus-status' : ''}">${label}</div></div>`;
  });
  document.querySelectorAll('.tab-dot').forEach(d => d.classList.remove('loading', 'done'));
  setConsensusStep('');
  const _ab = $('consensus-agree-badge');
  if (_ab) { _ab.hidden = true; _ab.textContent = ''; _ab.className = 'tab-agree-badge'; }
  document.querySelectorAll('.tab-stance').forEach(b => { b.hidden = true; b.textContent = ''; b.className = 'tab-stance'; });
  setChipsDisabled(false);
  hideAttrTip();
  $('promptInput').focus();
  document.title = DEFAULT_TITLE;
}

// ── Consensus tab ───────────────────────────────────────────────────────────
const setConsensusStatus = (m) => { consensusStatusText = m; consensusPhase = 'arbitrating'; refreshConsensusProgress(); };
const setConsensusStep   = (l) => { consensusStepText = l || ''; const e = $('consensus-tab-step'); if (e) e.textContent = l || ''; refreshConsensusProgress(); };
function setConsensusDot(loading) {
  const dot = $('tdot_consensus'); if (!dot) return;
  if (loading) dot.classList.add('loading');
  else { dot.classList.remove('loading'); dot.classList.add('done'); setTimeout(() => dot.classList.remove('done'), 350); }
}
// ── Background tab title notifications ─────────────────────────────────────────
// When the user switches away while models are running, the browser tab title
// shows live progress — "(2/3 answered) Polecat" — so they know when to come
// back. Resets automatically when they focus the tab (visibilitychange in init).
function notifyTabTitle() {
  if (!document.hidden) return;
  const total = order.length;
  if (!total) return;
  const done = order.filter(id => runStatus[id] === 'done').length;
  const errs = order.filter(id => runStatus[id] === 'error').length;
  const allDone = done + errs >= total;
  if (!allDone) {
    document.title = `(${done}/${total} answered) Polecat`;
  } else if (!cfg.consensus || consensusPhase === 'done') {
    document.title = `(${total > 1 ? total + ' models' : 'done'}) Polecat`;
  } else {
    document.title = `(synthesizing…) Polecat`;
  }
}

// Live progress shown in the Consensus tab while models stream + arbitration runs.
function markRun(id, state) {
  if (runStatus[id] === undefined) return;
  runStatus[id] = state;
  if (cfg.consensus) refreshConsensusProgress();
  if (state === 'done' || state === 'error') notifyTabTitle();
}
const _CP_CHECK  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
const _CP_CROSS  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const _CP_STREAM = `<span class="cp-stream-ind" aria-hidden="true"></span>`;
const _CP_WAIT   = `<span class="cp-wait-ind"   aria-hidden="true"></span>`;
const STAT_SVG = { done: _CP_CHECK, error: _CP_CROSS, streaming: _CP_STREAM, pending: _CP_WAIT };
const CHEV_R = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`;
const CHEV_D = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;
// Quick pairwise agreement signal from already-completed responses — shown as a
// live "pulse" in the consensus waiting state while remaining models are still
// streaming. No model call. Degrades silently (returns '') if fewer than 2 models
// have finished or we're past the waiting phase.
function liveAgreementHtml() {
  if (consensusPhase !== 'waiting') return '';
  const doneIds = order.filter(id => results[id] && results[id].length > 80);
  if (doneIds.length < 2) return '';
  const doneResults = doneIds.map(id => ({
    selection: selById(id) || { id, provider: 'openai', model: '' },
    text: results[id],
  }));
  const local = computeLocalAgreement(doneResults, '', sel => selectionLabel(sel));
  if (!local) return '';
  const sig = local.avgSimilarity;
  const { label, cls } = sig >= 0.26
    ? { label: 'strong agreement', cls: 'cp-agree-high' }
    : sig >= 0.11
    ? { label: 'mixed views',      cls: 'cp-agree-mid'  }
    :           { label: 'divergent views', cls: 'cp-agree-low'  };
  return `<div class="cp-agree-teaser ${cls}">` +
    `<span class="cp-agree-dot" aria-hidden="true"></span>` +
    `<span><strong>${label}</strong> so far</span>` +
    `</div>`;
}

function refreshConsensusProgress() {
  const conv = $('conv_consensus');
  if (!conv || (consensusPhase !== 'waiting' && consensusPhase !== 'arbitrating')) return;
  $('empty_consensus')?.remove();
  let box = $('consensus-progress');
  if (!box) { box = el('div', 'consensus-progress'); box.id = 'consensus-progress'; conv.appendChild(box); scrollBottom(conv); }

  const strat = activeStrategy(cfg);
  const ids = (cfg.selections || []).filter(s => runStatus[s.id] !== undefined);
  const total = ids.length, done = ids.filter(s => runStatus[s.id] === 'done').length;
  const failed = ids.filter(s => runStatus[s.id] === 'error').length;
  const aId = cfg.arbitration.arbiter;
  const arbSelNow = (aId && aId !== 'auto') ? selById(aId) : null;
  // Plain-language, matching the "Your N models answer in parallel, then X merges
  // them" phrasing on the Consensus settings tab — the technical strategy name
  // (e.g. "Sequential Refinement") moves into a title tooltip for the curious,
  // instead of being the headline copy a beginner sees on every run.
  const mergeLine = arbSelNow
    ? `${total} model${total === 1 ? '' : 's'} answering in parallel, then ${escapeHtml(selectionLabel(arbSelNow))} merges them into one answer.`
    : `${total} model${total === 1 ? '' : 's'} answering in parallel, then the strategy auto-picks one to merge them into one answer.`;
  const phaseLine = consensusPhase === 'arbitrating'
    ? (consensusStatusText || 'Synthesizing…')
    : `Waiting for models — ${done}/${total} responded${failed ? `, ${failed} failed` : ''}…`;

  const modelsHtml = ids.map(s => {
    const st = runStatus[s.id];
    const prevText = streamPreviews[s.id] || '';
    return `<li class="cp-model cp-${st}">` +
      `<div class="cp-row"><span class="cp-dot" style="--c:${PROVIDERS[s.provider]?.color || '#888'}"></span>` +
      `<span class="cp-name">${escapeHtml(selectionLabel(s))}</span><span class="cp-stat">${STAT_SVG[st] || ''}</span></div>` +
      `<span class="cp-preview${prevText ? ' has-text' : ''}" id="cprev_${s.id}">${escapeHtml(prevText)}</span>` +
      `</li>`;
  }).join('');

  const teaserHtml = done >= 2 ? liveAgreementHtml() : '';
  box.innerHTML =
    `<div class="cp-glyph"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="5.6" y1="5.6" x2="7.8" y2="7.8"/><line x1="16.2" y1="16.2" x2="18.4" y2="18.4"/><line x1="5.6" y1="18.4" x2="7.8" y2="16.2"/><line x1="16.2" y1="7.8" x2="18.4" y2="5.6"/></svg></div>` +
    `<div class="cp-title">Building consensus</div>` +
    `<div class="cp-strategy" title="Strategy: ${escapeHtml(strat.name)}">${mergeLine}</div>` +
    `<div class="cp-phase">${escapeHtml(phaseLine)}</div>` +
    `<ul class="cp-models">${modelsHtml}</ul>` +
    teaserHtml +
    (consensusStepText ? `<div class="cp-step">${escapeHtml(consensusStepText)}…</div>` : '');
}
async function getSilentText(sel, messages) {
  let text = '';
  try {
    const runOpts = makeRunOpts(PROVIDERS[sel.provider]);
    for await (const chunk of makeGen(sel, messages, cfg, runOpts)) text += chunk;
  } catch (err) {
    if (err?.name !== 'AbortError') throw err;
    // AbortError (user stop or timeout) — return whatever arrived so far.
  }
  return cleanModelText(text);
}
// Attribution footer under a finished consensus answer: which models fed it,
// which one arbitrated, and a tap-through to each model's raw reply. Makes the
// cross-model synthesis transparent — the heart of what Polecat does.
function consensusSourcesEl(arbiterSel) {
  const contributors = order.filter(id => results[id]).map(id => selById(id)).filter(Boolean);
  if (contributors.length < 2) return null;               // nothing to "blend" — skip
  const strat = activeStrategy(cfg);
  const arbId = arbiterSel && arbiterSel.id;
  const chips = contributors.map(s => {
    const isArb = s.id === arbId;
    const label = selectionLabel(s);
    return `<button class="cs-chip${isArb ? ' cs-arbiter' : ''}" data-tab="${escapeHtml(s.id)}" ` +
      `style="--c:${PROVIDERS[s.provider]?.color || '#888'}" ` +
      `title="${isArb ? 'Wrote the final answer. ' : ''}Open ${escapeHtml(label)}'s full answer">` +
      `<span class="cs-dot"></span>${escapeHtml(label)}${isArb ? ' ' + ARB_ICON : ''}</button>`;
  }).join('');
  const allMs = order.filter(id => responseTimes[id]).map(id => responseTimes[id]);
  let timeLabel = '';
  if (allMs.length >= 2) {
    const minMs = Math.min(...allMs), maxMs = Math.max(...allMs);
    const fmt = ms => ms < 10000 ? (ms / 1000).toFixed(1) + 's' : Math.round(ms / 1000) + 's';
    timeLabel = minMs === maxMs ? fmt(maxMs) : fmt(minMs) + '–' + fmt(maxMs);
  }
  // Compact race-bar: colored dots at relative positions show which model finished when.
  // Gives the "parallel execution" advantage a concrete, glanceable visual.
  let raceHtml = '';
  if (allMs.length >= 2) {
    const maxMs = Math.max(...allMs);
    const fmt2 = ms => ms < 10000 ? (ms / 1000).toFixed(1) + 's' : Math.round(ms / 1000) + 's';
    const ordinal = n => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : n + 'th';
    const ranked = order
      .filter(id => responseTimes[id] && selById(id))
      .sort((a, b) => responseTimes[a] - responseTimes[b]);
    const dots = ranked
      .map((id, i) => {
        const sel = selById(id);
        const ms = responseTimes[id] || 0;
        const pct = Math.max(2, Math.min(97, (ms / maxMs) * 100));
        const color = PROVIDERS[sel.provider]?.color || '#888';
        const rankLabel = i === 0 ? ordinal(i + 1) + ' \xb7 fastest' : i === ranked.length - 1 ? ordinal(i + 1) + ' \xb7 slowest' : ordinal(i + 1);
        const tip = escapeHtml(`${selectionLabel(sel)}: ${fmt2(ms)} (${rankLabel})`);
        return `<button type="button" class="cs-race-dot" tabindex="-1" style="left:${pct.toFixed(1)}%;background:${escapeHtml(color)}" data-tip="${tip}"></button>`;
      }).join('');
    const srSummary = escapeHtml('Response times: ' + ranked.map((id, i) => {
      const sel = selById(id);
      const tag = i === 0 ? ' (fastest)' : i === ranked.length - 1 ? ' (slowest)' : '';
      return `${selectionLabel(sel)} ${fmt2(responseTimes[id] || 0)}${tag}`;
    }).join(', '));
    raceHtml = `<div class="cs-race">` +
      `<div class="cs-race-caption"><span>Response speed</span><span class="cs-race-axis">fastest → slowest</span></div>` +
      `<div class="cs-race-track" aria-hidden="true">${dots}</div>` +
      `<p class="sr-only">${srSummary}</p>` +
      `</div>`;
  }
  const wrap = el('div', 'consensus-sources');
  wrap.innerHTML =
    `<span class="cs-label">${BLEND_SVG} Blended from ${contributors.length} models \xb7 ${escapeHtml(strat.name)}${timeLabel ? ' \xb7 <span class="cs-timerange" title="Model response time range">' + escapeHtml(timeLabel) + '</span>' : ''}</span>` +
    `<div class="cs-chips">${chips}</div>` +
    raceHtml;
  wrap.querySelectorAll('.cs-chip').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
  // Race dots: hover shows the tip on desktop; tap toggles it on mobile (no hover state there).
  wrap.querySelectorAll('.cs-race-dot').forEach(d => d.onclick = (e) => {
    e.stopPropagation();
    const wasOpen = d.classList.contains('cs-tip-open');
    wrap.querySelectorAll('.cs-race-dot.cs-tip-open').forEach(x => x.classList.remove('cs-tip-open'));
    if (!wasOpen) d.classList.add('cs-tip-open');
  });
  return wrap;
}

async function streamToConsensus(sel, messages) {
  const conv = $('conv_consensus');
  consensusPhase = 'done'; $('consensus-progress')?.remove(); $('empty_consensus')?.remove();
  const pair = assistantPair('Consensus', lastPrompt);
  conv.appendChild(pair); scrollPairToTop(conv, pair);
  const bubble = pair.querySelector('.msg.assistant .msg-bubble');
  let full = '';
  // Elegant placeholder so the consensus bubble is never an awkward empty box
  // while we wait for the arbiter's first token. Replaced on the first chunk,
  // and the streamed answer fades in (see .cons-answer-in / .cons-thinking CSS).
  bubble.innerHTML =
    '<div class="cons-thinking"><span class="cons-thinking-dots"><i></i><i></i><i></i></span>' +
    '<span class="cons-thinking-label">Synthesizing consensus…</span></div>';
  const t0 = performance.now();
  let firstChunk = true;
  try {
    const runOpts = makeRunOpts(PROVIDERS[sel.provider]);
    for await (const chunk of makeGen(sel, messages, cfg, runOpts)) {
      full += chunk;
      if (firstChunk) { firstChunk = false; bubble.classList.add('cons-answer-in'); }
      bubble.innerHTML = renderMarkdown(cleanModelText(full));
    }
  } catch (err) {
    if (err?.name === 'AbortError' && _userStopped) {
      full = cleanModelText(full);
      if (full) {
        finishBubble(pair, full);
        const stEl = el('span', 'msg-stopped'); stEl.textContent = ' (stopped)';
        bubble.appendChild(stEl);
      } else {
        pair.remove();
      }
      return full;
    }
    throw err;
  }
  full = cleanModelText(full);
  // Arbiter produced nothing (no error, no tokens) — drop the empty bubble so the
  // caller's fallback can render cleanly instead of leaving a stuck placeholder.
  if (!full) { pair.remove(); return full; }
  finishBubble(pair, full);
  if (full) {
    setMsgTime(pair, performance.now() - t0);
    // Add share button — capture payload now before state can change.
    const msgHead = pair.querySelector('.msg.assistant .msg-head');
    if (msgHead) {
      const sharePayload = { q: lastPrompt, r: order.filter(id => results[id]).map(id => ({ l: selectionLabel(selById(id) || {}), t: results[id] })), c: full };
      const sb = el('button', 'copy-btn share-btn');
      sb.innerHTML = SHARE_SVG; sb.title = 'Share this consensus'; sb.setAttribute('aria-label', 'Share this consensus');
      sb.onclick = () => shareConsensus(sharePayload, sb);
      msgHead.appendChild(sb);
      const mb = el('button', 'copy-btn');
      mb.innerHTML = COPY_MD_SVG; mb.title = 'Copy thread as markdown'; mb.setAttribute('aria-label', 'Copy thread as markdown');
      mb.onclick = () => copyThreadAsMarkdown(sharePayload, mb);
      msgHead.appendChild(mb);
      // Compare button — shows all model responses side by side in a grid.
      if (order.filter(id => results[id]).length >= 2) {
        const cb = el('button', 'copy-btn');
        cb.innerHTML = GRID_SVG; cb.title = 'Compare all responses side by side'; cb.setAttribute('aria-label', 'Compare all responses side by side');
        cb.onclick = () => openCompareModal(buildCompareEntries());
        msgHead.appendChild(cb);
      }
    }
    const sources = consensusSourcesEl(sel);
    if (sources) { pair.querySelector('.msg.assistant').appendChild(sources); scrollBottom(conv); }
  }
  lastConsensusText = full;
  notifyTabTitle();
  return full;
}
function showConsensusStatic(text, isError = false) {
  const conv = $('conv_consensus');
  consensusPhase = 'done'; $('consensus-progress')?.remove(); $('empty_consensus')?.remove();
  // Capture share payload at render time before state can change on the next turn.
  const sharePayload = isError ? null : {
    q: lastPrompt,
    r: order.filter(id => results[id]).map(id => ({ l: selectionLabel(selById(id) || {}), t: results[id] })),
    c: text,
  };
  const pair = el('div', 'qa-pair');
  pair.innerHTML =
    userMsgHtml(lastPrompt) +
    `<div class="msg assistant"><div class="msg-head"><span class="msg-label">Consensus</span>` +
    (isError ? '' : `<button class="copy-btn" title="Copy" aria-label="Copy">${COPY_SVG}</button><button class="copy-btn share-btn" title="Share this consensus" aria-label="Share this consensus">${SHARE_SVG}</button><button class="copy-btn copy-md-btn" title="Copy thread as markdown" aria-label="Copy thread as markdown">${COPY_MD_SVG}</button>`) + `</div>` +
    `<div class="msg-bubble">${isError ? `<span class="msg-error">${escapeHtml(text)}</span>` : renderMarkdown(text)}</div></div>`;
  conv.appendChild(pair); scrollBottom(conv);
  if (!isError) {
    highlightBubble(pair); lastConsensusText = text;
    const b = pair.querySelector('.copy-btn'); if (b) b.onclick = () => copyText(text, b);
    const sb = pair.querySelector('.share-btn');
    if (sb && sharePayload) sb.onclick = () => shareConsensus(sharePayload, sb);
    const mb = pair.querySelector('.copy-md-btn');
    if (mb && sharePayload) mb.onclick = () => copyThreadAsMarkdown(sharePayload, mb);
    // Compare button — only when live results are available (not on restore).
    const liveEntries = buildCompareEntries();
    if (liveEntries.length >= 2) {
      const msgHead = pair.querySelector('.msg.assistant .msg-head');
      if (msgHead) {
        const cb = el('button', 'copy-btn');
        cb.innerHTML = GRID_SVG; cb.title = 'Compare all responses side by side'; cb.setAttribute('aria-label', 'Compare all responses side by side');
        cb.onclick = () => openCompareModal(buildCompareEntries());
        msgHead.appendChild(cb);
      }
    }
  }
  notifyTabTitle();
}
// Show a positioned callout below the Consensus tab the first time a consensus appears.
// Teaches new users that model tabs above hold individual responses.
function maybeShowConsHint() {
  if (localStorage.getItem(CONS_HINT_KEY)) return;
  const tab = $('tab_consensus'); if (!tab) return;
  // Don't burn the one-time hint on a failed run ("All models failed to respond") —
  // there's no synthesized answer to point at yet, and the localStorage flag below
  // means a first-attempt failure would otherwise silently skip this teaching moment
  // for good on every future successful consensus.
  const lastPair = $('conv_consensus')?.querySelector('.qa-pair:last-child');
  if (lastPair?.querySelector('.msg-error')) return;
  localStorage.setItem(CONS_HINT_KEY, '1');
  const rect = tab.getBoundingClientRect();
  const tip = el('div', 'cons-onboard-tip');
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - 276));
  tip.style.top = (rect.bottom + 6) + 'px';
  tip.style.left = left + 'px';
  tip.innerHTML = '<strong>That\'s your synthesized answer.</strong> Tap any model tab above to read each one\'s individual response.' +
    '<button class="cons-onboard-dismiss" aria-label="Dismiss tip">×</button>';
  document.body.appendChild(tip);
  const dismiss = () => { tip.classList.add('tip-out'); setTimeout(() => tip.remove(), 340); };
  const tid = setTimeout(dismiss, 7000);
  tip.querySelector('.cons-onboard-dismiss').onclick = () => { clearTimeout(tid); dismiss(); };
  tab.addEventListener('click', () => { clearTimeout(tid); dismiss(); }, { once: true });
}

async function runConsensus() {
  const ordered = order.filter(id => results[id]).map(id => ({ selection: selById(id) || { id, provider: 'openai', model: '' }, text: results[id] }));
  lastSynthesisOrdered = ordered;
  lastSynthesisPrompt = lastPrompt;
  consensusPhase = 'arbitrating'; consensusStatusText = 'Reviewing responses…'; refreshConsensusProgress();
  await runArbitration(activeStrategy(cfg), {
    prompt: lastPrompt,
    results: ordered,
    arbiterId: cfg.arbitration.arbiter,
    allSelections: cfg.selections,
    labelOf: (sel) => selectionLabel(sel),
    silent: (sel, msgs) => getSilentText(sel, msgs),
    stream: (sel, msgs) => streamToConsensus(sel, msgs),
    status: setConsensusStatus,
    step: setConsensusStep,
    showStatic: (t) => showConsensusStatic(t, false),
    fail: (t) => showConsensusStatic(t, true),
    provenanceEnabled: cfg.arbitration.provenance !== false,
    provenance: (data) => onProvenance(data),
    arbiterFailed: (sel, err) => recordArbiterHealthFailure(sel, err),
  });
  // "Responses at a glance", follow-up chips, and the re-synthesis strip don't
  // need the arbiter's provenance analysis — always show them, even with the
  // agreement map off (onProvenance() is never called in that case, since it's
  // driven entirely by the provenance callback). Each render fn already guards
  // against double-rendering, so this is a no-op if onProvenance ran above.
  // Skip entirely on a total failure (ctx.fail() rendered a .msg-error) — there's
  // no answer to follow up on or re-synthesize.
  const _consPair = $('conv_consensus')?.querySelector('.qa-pair:last-child');
  if (_consPair && !_consPair.querySelector('.msg-error')) {
    renderModelSnapshotsEl(_consPair);
    renderFollowUpChips(_consPair, lastConsensusProvenance);
    if (lastSynthesisOrdered.length >= 2) {
      renderResynthStrip(_consPair, lastSynthesisOrdered, lastSynthesisPrompt, activeStrategy(cfg).id);
    }
  }
}
// EPIC 1 · P4 — Inline attribution: color-coded paragraph highlighting.
// A floating tooltip div is shared across all attributed paragraphs.
let _attrTipEl = null;
function getAttrTipEl() {
  if (!_attrTipEl) { _attrTipEl = el('div', 'attr-tooltip'); _attrTipEl.id = 'attr-tooltip'; document.body.appendChild(_attrTipEl); }
  return _attrTipEl;
}
function showAttrTip(text, x, y) {
  const tip = getAttrTipEl();
  tip.textContent = text;
  tip.style.left = Math.min(x + 14, window.innerWidth - 220) + 'px';
  tip.style.top  = Math.max(y - 38, 4) + 'px';
  tip.classList.add('visible');
}
function hideAttrTip() { getAttrTipEl().classList.remove('visible'); }

// Apply block-level attribution colors to an already-rendered bubble. Uses the
// paragraph ordering (both the markdown split and the DOM are in document order)
// to map segments to DOM elements without any extra model call.
function applyInlineAttribution(bubble, attrData) {
  if (!attrData || !attrData.length) return;
  const BLOCK_SEL = ':scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > ul, :scope > ol, :scope > pre, :scope > blockquote';
  const blocks = [...bubble.querySelectorAll(BLOCK_SEL)];
  if (!blocks.length) return;
  let si = 0;
  blocks.forEach(block => {
    const seg = attrData[Math.min(si, attrData.length - 1)];
    si = Math.min(si + 1, attrData.length - 1);
    if (!seg || !seg.primaryId) return;
    const color = getModelColor({ id: seg.primaryId });
    block.classList.add('attr-para', seg.agreed ? 'attr-agreed' : 'attr-solo');
    block.style.setProperty('--attr-c', color);
    const tipText = seg.agreed
      ? 'Models agreed on this point'
      : `Primarily from: ${seg.primaryLabel}`;
    block.addEventListener('mouseenter', (e) => showAttrTip(tipText, e.clientX, e.clientY));
    block.addEventListener('mousemove',  (e) => showAttrTip(tipText, e.clientX, e.clientY));
    block.addEventListener('mouseleave', hideAttrTip);
    block.addEventListener('click', (e) => {
      const tip = getAttrTipEl();
      if (tip.classList.contains('visible') && tip.textContent === tipText) { hideAttrTip(); return; }
      showAttrTip(tipText, e.clientX, e.clientY);
      clearTimeout(tip._t); tip._t = setTimeout(hideAttrTip, 2200);
    });
  });
}

// EPIC 1 · P3 — "How this was formed" collapsible provenance panel.
// Appended below the consensus sources footer; never blocks or alters the answer.
function getModelColor(m) {
  if (m.id) { const s = selById(m.id); if (s) return PROVIDERS[s.provider]?.color || '#888'; }
  const matched = sels().find(s => selectionLabel(s) === m.label);
  return matched ? (PROVIDERS[matched.provider]?.color || '#888') : '#888';
}
function renderProvenancePanel(pair, prov) {
  if (!prov || !prov.perModel || !prov.perModel.length) return;
  const isLocal = prov.source === 'local';
  const sig = prov.agreementSignal;
  const agreeLevel = sig == null ? null
    : sig >= 0.26 ? { label: 'Strong agreement', cls: 'agree-high' }
    : sig >= 0.11 ? { label: 'Moderate agreement', cls: 'agree-mid' }
    : { label: 'Diverse views', cls: 'agree-low' };

  // Stacked 100% bar: one horizontal bar split into colored segments, one per model.
  // Segment widths are normalized so they always fill 100% (arbiter %s may not sum exactly).
  const rawSum = prov.perModel.reduce((acc, m) => acc + (m.contributionPct || 0), 0);
  const normSum = rawSum > 0 ? rawSum : 100;
  const barAriaLabel = 'Contribution: ' + prov.perModel.map(m => m.label + ' ' + m.contributionPct + '%').join(', ');
  // Two models from the same provider resolve to the same color. To keep them
  // distinguishable in the (often small) bar + legend, give each repeat of a
  // color a texture overlay (stripes/dots/…). The first model of a color stays
  // solid; the Nth repeat gets pattern class prov-pat-(N). Same index drives the
  // bar segment and its legend swatch so they always match.
  const _patSeen = {};
  const patClassFor = (color) => {
    const n = (_patSeen[color] = (_patSeen[color] || 0) + 1);
    return n > 1 ? ' prov-pat-' + Math.min(n - 1, 4) : '';
  };
  const _patByLabel = {};
  prov.perModel.forEach(m => { _patByLabel[m.label] = patClassFor(getModelColor(m)); });
  const segs = prov.perModel.map((m, i) => {
    const color = getModelColor(m);
    const norm = ((m.contributionPct || 0) / normSum) * 100;
    const showInline = norm >= 14;
    const tip = m.label + ': ' + m.contributionPct + '%' + (m.mismatch ? ' (approx)' : '');
    const isLast = i === prov.perModel.length - 1;
    return `<div class="prov-seg${isLast ? ' prov-seg-last' : ''}${_patByLabel[m.label]}" ` +
      `style="width:${norm.toFixed(2)}%;background-color:${escapeHtml(color)}" ` +
      `title="${escapeHtml(tip)}" aria-hidden="true">` +
      (showInline ? `<span class="prov-seg-label">${m.contributionPct}%</span>` : '') +
      `</div>`;
  }).join('');
  const legendItems = prov.perModel.map(m => {
    const color = getModelColor(m);
    const stanceCls = { aligned: 'prov-aligned', partial: 'prov-partial', outlier: 'prov-outlier' }[m.stance] || 'prov-partial';
    const mismatchAttr = m.mismatch ? ' title="Estimated contribution differs noticeably from measured overlap"' : '';
    return `<span class="prov-legend-item">` +
      `<span class="prov-legend-swatch${_patByLabel[m.label]}" style="background-color:${escapeHtml(color)}" aria-hidden="true"></span>` +
      `<span class="prov-legend-name">${escapeHtml(m.label)}</span>` +
      `<span class="prov-legend-pct"${mismatchAttr}>${m.contributionPct}%${m.mismatch ? '<span class="prov-mismatch" aria-hidden="true">~</span>' : ''}</span>` +
      `<span class="prov-stance ${stanceCls}">${escapeHtml(m.stance)}</span>` +
      `</span>`;
  }).join('');
  const barsHtml =
    `<div class="prov-stacked-bar" role="img" aria-label="${escapeHtml(barAriaLabel)}">` + segs + `</div>` +
    `<div class="prov-legend">${legendItems}</div>`;

  let agreesHtml = '';
  if (!isLocal && prov.agreements && prov.agreements.length) {
    agreesHtml = `<div class="prov-agrees">${prov.agreements.slice(0, 4).map(a => `<div class="prov-agree-item"><span class="prov-agree-check">${CHECK_SM_SVG}</span>${escapeHtml(a)}</div>`).join('')}</div>`;
  }

  // Build model-name → selection-id lookup so positions become clickable links.
  const _nameLookup = {};
  if (prov.perModel) {
    prov.perModel.forEach(m => {
      if (m.id && m.label) {
        const lo = m.label.toLowerCase();
        _nameLookup[lo] = m.id;
        const short = lo.split(/[\s(]/)[0];
        if (short && short.length > 2 && !_nameLookup[short]) _nameLookup[short] = m.id;
      }
    });
  }
  function _findTabId(name) {
    const lo = (name || '').toLowerCase().trim();
    if (_nameLookup[lo]) return _nameLookup[lo];
    for (const k of Object.keys(_nameLookup)) {
      if (lo.includes(k) || k.includes(lo)) return _nameLookup[k];
    }
    return null;
  }

  let disagreeHtml = '';
  if (prov.disagreements && prov.disagreements.length) {
    const items = prov.disagreements.map((d, di) =>
      `<div class="prov-dis-item"><div class="prov-dis-point">${escapeHtml(d.point)}</div>` +
      `<button class="prov-ask-btn" data-dis-idx="${di}" title="Pre-fill a follow-up asking the models to dig into this difference">Ask about this →</button>` +
      (d.positions && d.positions.length
        ? `<ul class="prov-dis-pos">${d.positions.map(p => {
            const tid = _findTabId(p.model);
            const nameHtml = tid
              ? `<button class="prov-model-link" data-tab="${escapeHtml(tid)}">${escapeHtml(p.model)}</button>`
              : `<b>${escapeHtml(p.model)}</b>`;
            return `<li>${nameHtml}: ${escapeHtml(p.claim)}</li>`;
          }).join('')}</ul>`
        : '') +
      `</div>`).join('');
    disagreeHtml = `<details class="prov-details"><summary>Where they differed (${prov.disagreements.length})</summary><div class="prov-details-body">${items}</div></details>`;
  }

  let notableHtml = '';
  if (prov.notable && prov.notable.length) {
    const items = prov.notable.map(n =>
      `<div class="prov-notable-item">` +
      `<span class="prov-notable-claim">${escapeHtml(n.claim)}</span>` +
      (n.note ? ` <span class="prov-notable-note">— ${escapeHtml(n.note)}</span>` : '') +
      (n.models && n.models.length ? `<span class="prov-notable-models">${n.models.map(escapeHtml).join(', ')}</span>` : '') +
      `</div>`).join('');
    notableHtml = `<details class="prov-details"><summary>Notable claims (${prov.notable.length})</summary><div class="prov-details-body">${items}</div></details>`;
  }

  const bodyId = 'prov-body-' + Math.random().toString(36).slice(2, 8);
  const panel = el('div', 'provenance-panel');
  panel.innerHTML =
    `<button class="prov-toggle" aria-expanded="false" aria-controls="${bodyId}">` +
    `<span class="prov-toggle-icon" aria-hidden="true">${CHEV_R}</span>` +
    `<span class="prov-toggle-label">How this was formed</span>` +
    (agreeLevel ? `<span class="prov-badge ${agreeLevel.cls}">${escapeHtml(agreeLevel.label)}</span>` : '') +
    (isLocal ? `<span class="prov-badge prov-local" title="Contribution estimated from text overlap — no extra model call">measured</span>` : '') +
    `</button>` +
    `<div class="prov-body" id="${bodyId}" hidden>` +
    `<div class="prov-section">` +
    `<div class="prov-section-label">Contribution <span class="prov-approx">(approximate)</span></div>` +
    barsHtml +
    `</div>` +
    (agreesHtml ? `<div class="prov-section prov-agree-section">${agreesHtml}</div>` : '') +
    (disagreeHtml || notableHtml ? `<div class="prov-section prov-sub-section">${disagreeHtml}${notableHtml}</div>` : '') +
    `</div>`;

  const toggleBtn = panel.querySelector('.prov-toggle');
  const body = panel.querySelector('.prov-body');
  toggleBtn.onclick = () => {
    const open = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', String(!open));
    toggleBtn.querySelector('.prov-toggle-icon').innerHTML = open ? CHEV_R : CHEV_D;
    body.hidden = open;
  };
  // Auto-expand when models had diverse views — the disagreements are the interesting part.
  if (agreeLevel?.cls === 'agree-low') {
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.querySelector('.prov-toggle-icon').innerHTML = CHEV_D;
    body.hidden = false;
  }
  // Wire click handlers for model name links in disagreement positions — jump to model tab.
  panel.querySelectorAll('.prov-model-link[data-tab]').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });
  // Wire "Ask about this" buttons — pre-fill a targeted follow-up for each disagreement.
  panel.querySelectorAll('.prov-ask-btn[data-dis-idx]').forEach(btn => {
    const i = parseInt(btn.dataset.disIdx, 10);
    const d = (prov.disagreements || [])[i];
    if (d) btn.onclick = () => fillPrompt(_buildSingleDisagreeQ(d));
  });

  const assistantMsg = pair.querySelector('.msg.assistant');
  if (assistantMsg) assistantMsg.appendChild(panel);
}

// ── "Responses at a glance" snapshot strip ─────────────────────────────────
// Strip markdown syntax and return the first substantive sentence/paragraph as
// plain text — suitable for a compact preview card with no rendering overhead.
function plainPreview(md, maxChars) {
  if (!md) return '';
  maxChars = maxChars || 200;
  let t = md
    .replace(/```[\s\S]*?```/gm, '')          // fenced code blocks
    .replace(/`[^`\n]+`/g, '')                // inline code
    .replace(/^#{1,6} /gm, '')                // ATX headers
    .replace(/\*{1,2}([^*\n]+)\*{1,2}/g, '$1') // bold / italic
    .replace(/_([^_\n]+)_/g, '$1')            // underscore italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '');   // images
  const lines = t.split(/\n+/);
  for (const raw of lines) {
    const s = raw.trim().replace(/^(?:[-*•>]\s+|\d+[.)]\s+)/, '').trim();
    if (s.length > 18) return s.length > maxChars ? s.slice(0, maxChars - 1) + '…' : s;
  }
  const plain = t.trim();
  return plain.length > maxChars ? plain.slice(0, maxChars - 1) + '…' : plain;
}

// Render compact per-model preview cards below the consensus answer. Shows each
// model's opening sentence + response time + stance + word count + a link to
// switch to its full tab. Stance/contribution come from lastConsensusProvenance,
// which is set before this is called in onProvenance().
function renderModelSnapshotsEl(pair) {
  const assistantMsg = pair?.querySelector('.msg.assistant');
  if (!assistantMsg || assistantMsg.querySelector('.model-snapshots')) return;

  // Build label → provenance data lookup (set before this call in onProvenance)
  const provByLabel = {};
  if (lastConsensusProvenance?.perModel) {
    lastConsensusProvenance.perModel.forEach(m => { if (m.label) provByLabel[m.label] = m; });
  }
  // Build label → distinctive disagreement claim (first per model from arbiter's disagreements)
  const claimByLabel = {};
  if (lastConsensusProvenance?.disagreements?.length) {
    lastConsensusProvenance.disagreements.forEach(d => {
      if (Array.isArray(d.positions)) {
        d.positions.forEach(p => {
          if (p.model && p.claim && !claimByLabel[p.model]) claimByLabel[p.model] = p.claim.trim();
        });
      }
    });
  }

  const entries = order
    .filter(id => results[id])
    .map(id => {
      const sel = selById(id);
      if (!sel) return null;
      const conv = $('conv_' + id);
      const lastP = conv?.querySelector('.qa-pair:last-child');
      const timeEl = lastP?.querySelector('.msg-time');
      const time = (timeEl && !timeEl.hidden) ? timeEl.textContent : '';
      const preview = plainPreview(results[id]);
      if (!preview) return null;
      const wordCount = (results[id] || '').trim().split(/\s+/).filter(Boolean).length;
      const label = selectionLabel(sel);
      const pm = provByLabel[label] || null;
      const raw = claimByLabel[label] || null;
      const distinctiveClaim = raw && raw.length > 20 ? raw : null;
      const pct = (pm != null && pm.contributionPct > 0) ? pm.contributionPct : null;
      const ms = responseTimes[id] || 0;
      return {
        id, label, color: PROVIDERS[sel.provider]?.color || '#888',
        time, ms, preview, wordCount,
        rawText: results[id],   // captured at render time for the copy button
        stance: pm?.stance || null,
        distinctiveClaim, pct,
      };
    })
    .filter(Boolean);

  if (entries.length < 2) return;

  const wrap = el('div', 'model-snapshots');

  // On mobile, default to collapsed — saves ~400px of vertical space.
  const startOpen = !window.matchMedia('(max-width: 600px)').matches;

  const toggle = el('button', 'ms-toggle');
  toggle.setAttribute('aria-expanded', String(startOpen));
  const miniDots = entries.slice(0, 6).map(e =>
    `<span class="ms-mini-dot" style="background:${escapeHtml(e.color)}" aria-hidden="true" title="${escapeHtml(e.label)}"></span>`
  ).join('');
  toggle.innerHTML =
    `<span class="ms-toggle-icon" aria-hidden="true">${startOpen ? CHEV_D : CHEV_R}</span>` +
    `<span class="ms-toggle-label">Responses at a glance</span>` +
    `<span class="ms-mini-dots" aria-hidden="true">${miniDots}</span>` +
    `<span class="ms-count">${entries.length} model${entries.length === 1 ? '' : 's'}</span>`;

  const body = el('div', 'ms-body');
  body.setAttribute('role', 'list');
  body.hidden = !startOpen;
  // Compute max response time for relative speed bars
  const maxMs = Math.max(...entries.map(e => e.ms || 0));
  const showSpeedBars = maxMs > 0 && entries.length >= 2;
  body.innerHTML = entries.map(e => {
    const stanceCls = { aligned: 'ms-aligned', partial: 'ms-partial', outlier: 'ms-outlier' }[e.stance] || '';
    const wc = e.wordCount > 20 ? `~${Math.round(e.wordCount / 10) * 10}w` : '';
    const metaParts = [];
    if (e.stance) metaParts.push(`<span class="ms-stance ${stanceCls}">${escapeHtml(e.stance)}</span>`);
    if (e.pct != null) metaParts.push(`<span class="ms-pct" title="Estimated share of consensus shaped by this model (approx.)">~${e.pct}%</span>`);
    if (wc) metaParts.push(`<span class="ms-wc">${escapeHtml(wc)}</span>`);
    const claimSnippet = e.distinctiveClaim
      ? `<div class="ms-distinct"><span class="ms-distinct-label">Distinct take</span>${escapeHtml(e.distinctiveClaim.length > 110 ? e.distinctiveClaim.slice(0, 107) + '…' : e.distinctiveClaim)}</div>`
      : '';
    const speedPct = (showSpeedBars && e.ms > 0) ? Math.round((e.ms / maxMs) * 100) : 0;
    const speedBar = speedPct > 0
      ? `<div class="ms-speed-bar" title="Response time: ${escapeHtml(e.time || '?')}${speedPct === 100 ? ' (slowest)' : speedPct <= 30 ? ' (fastest)' : ''}"><div class="ms-speed-fill" style="width:${speedPct}%;background:${escapeHtml(e.color)}" aria-hidden="true"></div></div>`
      : '';
    return `<div class="ms-card" data-tab="${escapeHtml(e.id)}" style="--ms-c:${escapeHtml(e.color)}" role="listitem" tabindex="0" aria-label="Open ${escapeHtml(e.label)}'s full reply">` +
      `<div class="ms-card-head">` +
      `<span class="ms-dot" aria-hidden="true"></span>` +
      `<span class="ms-label">${escapeHtml(e.label)}</span>` +
      (e.time ? `<span class="ms-time">${escapeHtml(e.time)}</span>` : '') +
      `<button class="ms-copy-btn" title="Copy ${escapeHtml(e.label)}'s full response" aria-label="Copy ${escapeHtml(e.label)}'s response">${COPY_SVG}</button>` +
      `<button class="ms-expand-btn" title="Read full response inline" aria-label="Expand ${escapeHtml(e.label)}'s full response" aria-expanded="false">${EXPAND_SVG}</button>` +
      `</div>` +
      speedBar +
      (metaParts.length ? `<div class="ms-meta-row">${metaParts.join('')}</div>` : '') +
      `<div class="ms-card-text">${escapeHtml(e.preview)}</div>` +
      claimSnippet +
      `<span class="ms-read-hint" aria-hidden="true">Full reply →</span>` +
      `</div>`;
  }).join('');

  // Expandable panel: sits below the horizontal scroll strip and shows the
  // selected model's full rendered response without leaving the consensus view.
  const expandPanel = el('div', 'ms-expanded-panel');
  expandPanel.hidden = true;

  body.querySelectorAll('.ms-card').forEach((card, i) => {
    const capturedText = entries[i]?.rawText || '';
    const entry = entries[i];
    const copyBtn = card.querySelector('.ms-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyText(capturedText, copyBtn);
      });
    }
    const expandBtn = card.querySelector('.ms-expand-btn');
    if (expandBtn && entry) {
      expandBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const isOpen = !expandPanel.hidden && expandPanel.dataset.openTab === card.dataset.tab;
        // Collapse all expand buttons first
        body.querySelectorAll('.ms-expand-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
        if (isOpen) {
          expandPanel.hidden = true;
          delete expandPanel.dataset.openTab;
        } else {
          expandPanel.dataset.openTab = card.dataset.tab;
          expandBtn.setAttribute('aria-expanded', 'true');
          expandPanel.innerHTML =
            `<div class="ms-ep-head">` +
            `<span class="ms-ep-dot" style="background:${escapeHtml(entry.color)}"></span>` +
            `<span class="ms-ep-label">${escapeHtml(entry.label)}</span>` +
            (entry.time ? `<span class="ms-ep-time">${escapeHtml(entry.time)}</span>` : '') +
            `<button class="ms-ep-tab-btn">Open full tab</button>` +
            `<button class="ms-ep-close" aria-label="Close expanded view">` +
            `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>` +
            `</button>` +
            `</div>` +
            `<div class="ms-ep-body">${renderMarkdown(entry.rawText || '')}</div>`;
          expandPanel.querySelectorAll('pre code').forEach(b => { if (typeof hljs !== 'undefined') hljs.highlightElement(b); });
          const closeBtn = expandPanel.querySelector('.ms-ep-close');
          if (closeBtn) closeBtn.onclick = () => {
            expandPanel.hidden = true;
            delete expandPanel.dataset.openTab;
            body.querySelectorAll('.ms-expand-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
          };
          const tabBtn = expandPanel.querySelector('.ms-ep-tab-btn');
          if (tabBtn) tabBtn.onclick = () => switchTab(card.dataset.tab);
          expandPanel.hidden = false;
          // Ensure the expanded panel is fully visible without manual scrolling.
          setTimeout(() => expandPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 30);
        }
      });
    }
    card.onclick = (ev) => {
      if (ev.target.closest('.ms-copy-btn') || ev.target.closest('.ms-expand-btn')) return;
      switchTab(card.dataset.tab);
    };
    card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchTab(card.dataset.tab); } };
  });

  toggle.onclick = () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.querySelector('.ms-toggle-icon').innerHTML = open ? CHEV_R : CHEV_D;
    body.hidden = open;
  };

  wrap.appendChild(toggle);
  wrap.appendChild(body);
  wrap.appendChild(expandPanel);
  assistantMsg.appendChild(wrap);
}

// ── Follow-up question chips ────────────────────────────────────────────────
// Build a targeted follow-up prompt for a SPECIFIC disagreement point (used by
// the "Ask about this" button on each prov-dis-item). Gives each model the
// exact positions the others took so they can engage with real context.
function _buildSingleDisagreeQ(d) {
  if (!d || !d.point) return 'Dig into this question.';
  const point = (d.point || '').trim();
  const pos = (d.positions || []).filter(p => p.model && p.claim).slice(0, 4);
  if (!pos.length) {
    const p = point.length > 120 ? point.slice(0, 117) + '...' : point;
    return 'The models disagreed on: "' + p + '". Can you dig into this and clarify the key considerations?';
  }
  const posLines = pos.map(p => {
    const claim = p.claim.length > 110 ? p.claim.slice(0, 107) + '...' : p.claim;
    return p.model + ' said: "' + claim + '"';
  }).join('. ');
  const pShort = point.length > 90 ? point.slice(0, 87) + '...' : point;
  return 'The models disagreed on: "' + pShort + '". ' + posLines + '. Which view is better supported, and why? Where does the other perspective have merit?';
}

// Returns [{label, q}] — label is the short chip text; q is the full prompt
// that gets pre-filled in the input. When an outlier exists or models disagreed
// with named positions, adds targeted chips unique to the multi-model session.
function _buildDebateQ(prov) {
  if (!prov?.disagreements?.length) return null;
  const dis = prov.disagreements[0];
  const pos = (dis.positions || []).filter(p => p.model && p.claim).slice(0, 3);
  if (pos.length < 2) return null;
  const point = (dis.point || '').trim();
  const posLines = pos.map(p => {
    const claim = p.claim.length > 90 ? p.claim.slice(0, 87) + '…' : p.claim;
    return p.model + ' said: "' + claim + '"';
  }).join(' ');
  const intro = point
    ? 'The models took different views on "' + (point.length > 70 ? point.slice(0, 67) + '…' : point) + '". '
    : 'The models took different positions here. ';
  return intro + posLines + ' Each of you: engage directly with the others\' reasoning. Do you maintain your position, or does any part change your thinking?';
}
function deriveFollowUps(prov) {
  const chips = [];
  // Targeted debate chip: when we have named model positions in a disagreement,
  // build a rich prompt that explicitly names each model's stance so they can
  // engage with each other. This is unique to the multi-model context.
  const debateQ = _buildDebateQ(prov);
  if (debateQ) {
    const dis = prov.disagreements[0];
    const point = (dis.point || '').trim();
    const label = point
      ? 'Debate: ' + (point.length > 48 ? point.slice(0, 45) + '…' : point)
      : 'Have the models debate their differences';
    chips.push({ label, q: debateQ, isDebate: true });
  }
  // If one model took a clearly different position, call it out by name
  if (prov?.perModel) {
    const outlier = prov.perModel.find(m => m.stance === 'outlier');
    if (outlier?.label) {
      const name = outlier.label.length > 28 ? outlier.label.slice(0, 25) + '…' : outlier.label;
      const q = 'What\'s strongest about ' + name + '\'s different take?';
      chips.push({ label: q, q });
    }
  }
  if (!debateQ && prov?.disagreements?.length) {
    const point = (prov.disagreements[0].point || '').trim();
    if (point) {
      const s = point.length > 66 ? point.slice(0, 63) + '…' : point;
      const q = 'Settle the debate: ' + s;
      chips.push({ label: q, q });
    }
  }
  if (prov?.notable?.length) {
    const claim = (prov.notable[0].claim || '').trim();
    if (claim) {
      const s = claim.length > 60 ? claim.slice(0, 57) + '…' : claim;
      const q = 'Tell me more: "' + s + '"';
      chips.push({ label: q, q });
    }
  }
  const fallbacks = [
    { label: 'What are the strongest counterarguments to this?', q: 'What are the strongest counterarguments to this?' },
    { label: 'Give me a concrete real-world example.', q: 'Give me a concrete real-world example.' },
    { label: 'What\'s the most important nuance here?', q: 'What\'s the most important nuance here?' },
    { label: 'Explain this more simply.', q: 'Explain this more simply.' },
  ];
  let fi = 0;
  while (chips.length < 3 && fi < fallbacks.length) chips.push(fallbacks[fi++]);
  return chips.slice(0, 3);
}

function renderFollowUpChips(pair, prov) {
  const assistantMsg = pair.querySelector('.msg.assistant');
  if (!assistantMsg || assistantMsg.querySelector('.followup-chips')) return;
  const chips = deriveFollowUps(prov);
  if (!chips.length) return;
  const wrap = el('div', 'followup-chips');
  wrap.innerHTML =
    '<span class="followup-label">Ask a follow-up</span>' +
    '<div class="followup-list">' +
    chips.map(e => `<button class="followup-chip${e.isDebate ? ' followup-chip-debate' : ''}" data-q="${escapeHtml(e.q)}">${escapeHtml(e.label)}</button>`).join('') +
    '</div>';
  wrap.querySelectorAll('.followup-chip').forEach(b => b.onclick = () => fillPrompt(b.dataset.q));
  assistantMsg.appendChild(wrap);
}

// ── "Try another synthesis" strategy strip ─────────────────────────────────
// Renders a compact row of alternative synthesis strategy pills below the
// consensus answer. Clicking one re-synthesizes the SAME model responses with
// a different approach — zero extra model calls, instant exploration.
function renderResynthStrip(pair, orderedSnapshot, promptSnapshot, usedStratId) {
  const assistantMsg = pair?.querySelector('.msg.assistant');
  if (!assistantMsg || assistantMsg.querySelector('.resynth-strip')) return;
  const alternatives = allStrategies(cfg).filter(s => s.id !== usedStratId);
  const wrap = el('div', 'resynth-strip');
  let html = '';
  if (alternatives.length) {
    html +=
      '<span class="resynth-label">Strategy</span>' +
      '<div class="resynth-pills">' +
      alternatives.map(s =>
        `<button class="resynth-pill" data-strat="${escapeHtml(s.id)}" title="${escapeHtml(s.description)}">${escapeHtml(s.name)}</button>`
      ).join('') +
      '</div>';
  }
  html +=
    '<div class="resynth-format-row">' +
    '<span class="resynth-format-label">Format</span>' +
    FORMAT_MODIFIERS.map(m =>
      `<button class="resynth-format-chip" data-fmt="${escapeHtml(m.id)}">${escapeHtml(m.label)}</button>`
    ).join('') +
    '</div>';
  wrap.innerHTML = html;
  wrap.querySelectorAll('.resynth-pill').forEach(btn => {
    btn.onclick = () => rerunConsensusWith(orderedSnapshot, promptSnapshot, btn.dataset.strat);
  });
  wrap.querySelectorAll('.resynth-format-chip').forEach(btn => {
    btn.onclick = () => rerunConsensusWithFormat(orderedSnapshot, promptSnapshot, usedStratId, btn.dataset.fmt);
  });
  assistantMsg.appendChild(wrap);
}

// Re-synthesize using the same strategy but with a format modifier appended
// to every prompt template (shorter, bullets, more detail, simplified).
async function rerunConsensusWithFormat(capturedOrdered, capturedPrompt, baseStratId, fmtId) {
  const mod = FORMAT_MODIFIERS.find(m => m.id === fmtId);
  if (!mod) return;
  const base = allStrategies(cfg).find(s => s.id === baseStratId) || activeStrategy(cfg);
  const override = JSON.parse(JSON.stringify(base));
  for (const key of Object.keys(override.prompts || {})) {
    override.prompts[key] = override.prompts[key] + '\n\nFormat requirement: ' + mod.instruction;
  }
  await rerunConsensusWith(capturedOrdered, capturedPrompt, baseStratId, override);
}

// Re-run consensus arbitration using a captured snapshot of model responses +
// the original prompt, but a different synthesis strategy or format modifier.
// Produces a new consensus qa-pair in the Consensus tab without re-calling models.
async function rerunConsensusWith(capturedOrdered, capturedPrompt, strategyId, strategyOverride) {
  if (!capturedOrdered || capturedOrdered.length < 2) { toast('Need 2+ model responses to re-synthesize'); return; }
  const strategy = strategyOverride || allStrategies(cfg).find(s => s.id === strategyId);
  if (!strategy) { toast('Strategy not found'); return; }
  switchTab('consensus');

  // Temporarily override globals so streamToConsensus / showConsensusStatic
  // build the correct user message, strategy label, and share payload.
  const savedPrompt    = lastPrompt;
  const savedResults   = { ...results };
  const savedOrder     = [...order];
  const savedActiveId  = cfg.arbitration.activeId;
  lastPrompt = capturedPrompt;
  capturedOrdered.forEach(r => { results[r.selection.id] = r.text; });
  order = capturedOrdered.map(r => r.selection.id);
  cfg.arbitration.activeId = strategyId;  // so consensusSourcesEl shows the right strategy name
  lastSynthesisOrdered = capturedOrdered;
  lastSynthesisPrompt  = capturedPrompt;

  consensusPhase = 'arbitrating';
  consensusStatusText = `Trying ${strategy.name}…`;
  refreshConsensusProgress();

  try {
    await runArbitration(strategy, {
      prompt: capturedPrompt,
      results: capturedOrdered,
      arbiterId: cfg.arbitration.arbiter,
      allSelections: cfg.selections,
      labelOf: sel => selectionLabel(sel),
      silent: (sel, msgs) => getSilentText(sel, msgs),
      stream:  (sel, msgs) => streamToConsensus(sel, msgs),
      status: setConsensusStatus,
      step: setConsensusStep,
      showStatic: t => showConsensusStatic(t, false),
      fail: t => showConsensusStatic(t, true),
      provenanceEnabled: cfg.arbitration.provenance !== false,
      provenance: data => onProvenance(data),
      arbiterFailed: (sel, err) => recordArbiterHealthFailure(sel, err),
    });
    // Always show the per-model snapshot strip, independent of the agreement
    // map setting — must run before the `finally` restores the live globals.
    const _consPair = $('conv_consensus')?.querySelector('.qa-pair:last-child');
    if (_consPair) renderModelSnapshotsEl(_consPair);
  } finally {
    lastPrompt = savedPrompt;
    results    = savedResults;
    order      = savedOrder;
    cfg.arbitration.activeId = savedActiveId;
  }
}

// ── Side-by-side compare modal ─────────────────────────────────────────────
// Build the entry list for the compare modal from the current live results.
function buildCompareEntries() {
  return order.filter(id => results[id]).map(id => {
    const sel = selById(id); if (!sel) return null;
    const conv = $('conv_' + id);
    const lastP = conv?.querySelector('.qa-pair:last-child');
    const timeEl = lastP?.querySelector('.msg-time');
    const time = (timeEl && !timeEl.hidden) ? timeEl.textContent : '';
    return { id, label: selectionLabel(sel), color: PROVIDERS[sel.provider]?.color || '#888', text: results[id], time };
  }).filter(Boolean);
}

// Opens a full-screen modal showing all model responses in a responsive grid.
// Each column is independently scrollable on desktop; stacks on mobile.
function openCompareModal(entries) {
  if (!entries || entries.length < 2) { toast('Compare needs 2+ model responses'); return; }
  closeSidebar();   // same fix as openConfig()/openKbd(): a still-open sidebar sits
                     // under this overlay's backdrop and renders visibly darkened.
  const uid = Date.now().toString(36);
  const ov = el('div', 'compare-overlay');
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'Compare all model responses');
  ov.innerHTML =
    `<div class="compare-card">` +
    `<div class="compare-head">` +
    `<span class="compare-title">All responses</span>` +
    `<span class="compare-count">${entries.length} models</span>` +
    `<button class="icon-btn compare-close" id="cmpClose${uid}" title="Close" aria-label="Close">` +
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>` +
    `</button>` +
    `</div>` +
    `<div class="compare-grid">` +
    entries.map(e =>
      `<div class="compare-col">` +
      `<div class="compare-col-head">` +
      `<span class="cmp-dot" style="background:${escapeHtml(e.color)}"></span>` +
      `<span class="cmp-label">${escapeHtml(e.label)}</span>` +
      (e.time ? `<span class="cmp-time">${escapeHtml(e.time)}</span>` : '') +
      `</div>` +
      `<div class="compare-col-body">${renderMarkdown(e.text)}</div>` +
      `</div>`
    ).join('') +
    `</div>` +
    `</div>`;
  document.body.appendChild(ov);
  ov.querySelectorAll('pre code').forEach(b => { if (typeof hljs !== 'undefined') hljs.highlightElement(b); });
  let closed = false;
  const close = () => { if (closed) return; closed = true; ov.remove(); document.removeEventListener('keydown', onKey); popModalFocus(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  ov.onclick = (e) => { if (e.target === ov) close(); };
  document.getElementById('cmpClose' + uid).onclick = close;
  document.addEventListener('keydown', onKey);
  pushModalFocus(document.getElementById('cmpClose' + uid));
}

// ── Consensus insight sentence ──────────────────────────────────────────────
// Generates a concise, human-readable one-liner summarising the multi-model
// agreement picture — e.g. "All 3 models were in strong agreement" or
// "2 of 3 models agreed; GPT-4o had a contrasting perspective." Requires
// provenance data (arbiter or local) and at least 2 models. No API call.
function buildConsensusInsight(prov, numModels) {
  if (!prov || !prov.perModel || !prov.perModel.length || numModels < 2) return null;
  const pm = prov.perModel;
  const outliers = pm.filter(m => m.stance === 'outlier');
  const aligned  = pm.filter(m => m.stance === 'aligned');
  const numDis   = (prov.disagreements || []).length;
  const shorten  = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
  if (numModels === 2) {
    if (outliers.length === 0 && aligned.length === 2)
      return 'Both models reached the same conclusion — a confident, corroborated answer.';
    if (outliers.length === 1)
      return `Both models responded; ${shorten(outliers[0].label, 26)} offered a notably different take.`;
    return 'Both models responded; the consensus blends their perspectives.';
  }
  if (outliers.length === 0 && aligned.length >= numModels - 1)
    return `All ${numModels} models were in strong agreement — a well-corroborated answer.`;
  if (outliers.length === 1)
    return `${numModels - 1} of ${numModels} models agreed; ${shorten(outliers[0].label, 26)} had a contrasting perspective.`;
  if (outliers.length >= 2)
    return `The ${numModels} models took quite different approaches${numDis > 1 ? ', with ' + numDis + ' key differences' : ''} — the consensus reconciles them.`;
  return `${numModels} models responded with some variation — the consensus captures their shared ground.`;
}
function renderConsensusInsight(pair, prov) {
  const assistantMsg = pair?.querySelector('.msg.assistant');
  if (!assistantMsg || assistantMsg.querySelector('.consensus-insight')) return;
  const numModels = order.filter(id => results[id]).length;
  const text = buildConsensusInsight(prov, numModels);
  if (!text) return;
  const div = el('div', 'consensus-insight');
  div.textContent = text;
  // Insert before the sources footer so the plain-language verdict appears
  // right after the answer text — the most prominent, readable position.
  const sources = assistantMsg.querySelector('.consensus-sources');
  if (sources) assistantMsg.insertBefore(div, sources);
  else assistantMsg.appendChild(div);
}

// Small amber notice shown in the consensus bubble when the arbiter couldn't run
// and we fell back to the most representative answer + locally measured agreement.
function renderArbiterFallbackNote(pair, note) {
  const msg = pair.querySelector('.msg.assistant');
  if (!msg || msg.querySelector('.consensus-fallback-note')) return;
  const div = el('div', 'consensus-fallback-note');
  div.textContent = note;
  const bubble = msg.querySelector('.msg-bubble');
  if (bubble) msg.insertBefore(div, bubble);
  else msg.appendChild(div);
}

// EPIC 1 · P1 — receive the arbiter's machine-readable agreement map. Stamped
// on the consensus pair and rendered as the provenance panel immediately after.
// Also triggers P4: computes paragraph attribution and wires the toggle button.
// Tab-bar badges (Consensus tab's strong/mixed/diverse pill + each model tab's
// aligned/partial/outlier stance) derived from provenance. Shared by the live
// path (onProvenance) and restored-thread path (restoreThread) so reopened
// chats show the same at-a-glance signal as a live run, not just blank tabs.
function applyTabBadges(prov) {
  const _agreeBadge = $('consensus-agree-badge');
  if (_agreeBadge) {
    const _sig = prov?.agreementSignal;
    if (_sig != null) {
      const _agInfo = _sig >= 0.26 ? { label: 'strong', cls: 'tab-agree-high' }
                    : _sig >= 0.11 ? { label: 'mixed',  cls: 'tab-agree-mid'  }
                    :                { label: 'diverse', cls: 'tab-agree-low'  };
      _agreeBadge.textContent = _agInfo.label;
      _agreeBadge.className = 'tab-agree-badge ' + _agInfo.cls;
      _agreeBadge.hidden = false;
    }
  }

  // Update per-model stance badges — show aligned/partial/outlier under each model's tab label.
  if (prov?.perModel) {
    const stanceById = {}, stanceByLabel = {};
    prov.perModel.forEach(m => {
      if (m.id) stanceById[m.id] = m.stance;
      if (m.label) stanceByLabel[m.label] = m.stance;
    });
    sels().forEach(sel => {
      const stance = stanceById[sel.id] || stanceByLabel[selectionLabel(sel)];
      const badge = $('tstance_' + sel.id);
      if (!badge || !stance) return;
      badge.textContent = stance;
      badge.className = 'tab-stance tab-stance-' + stance;
      badge.hidden = false;
    });
  }
}

function onProvenance(data) {
  lastConsensusProvenance = data || null;
  const pair = $('conv_consensus')?.querySelector('.qa-pair:last-child');
  if (!pair) return;
  pair._provenance = lastConsensusProvenance;

  // Arbiter failed (dead/exhausted key, network) — explain why this looks like a
  // single answer + agreement map rather than a synthesis, so the user can fix it.
  if (lastConsensusProvenance?.fallbackNote) {
    renderArbiterFallbackNote(pair, lastConsensusProvenance.fallbackNote);
  }

  applyTabBadges(lastConsensusProvenance);

  // Brief insight sentence — summarises agreement in plain language before the detail panels.
  renderConsensusInsight(pair, lastConsensusProvenance);

  // "Responses at a glance" — compact per-model preview strip, always shown first.
  renderModelSnapshotsEl(pair);

  // Actionable elements come before the analytical provenance panel so the user can
  // continue the conversation without scrolling past the detail section.
  renderFollowUpChips(pair, lastConsensusProvenance);

  // Re-synthesis strip — try a different synthesis strategy on the same model responses.
  if (lastSynthesisOrdered.length >= 2) {
    renderResynthStrip(pair, lastSynthesisOrdered, lastSynthesisPrompt, activeStrategy(cfg).id);
  }

  if (lastConsensusProvenance) renderProvenancePanel(pair, lastConsensusProvenance);

  // Record model performance before P4's early-return guards, so it always fires
  // when real provenance data arrives (regardless of attribution availability).
  if (lastConsensusProvenance?.perModel?.length >= 2) {
    recordModelPerf(lastConsensusProvenance.perModel);
  }

  // P4 — Inline attribution (no extra model call, runs synchronously)
  tryApplyInlineAttribution(pair);
}

// P4 — computes and applies paragraph-level source-model attribution to a
// consensus pair's bubble, from whatever the current order/results/
// lastConsensusText globals hold. Shared by the live path (onProvenance) and
// restored-thread path (restoreThread) so reopened chats get the same toggle.
function tryApplyInlineAttribution(pair) {
  if (!pair || !lastConsensusText) return;
  const ordered = order.filter(id => results[id])
    .map(id => ({ selection: selById(id) || { id, provider: 'openai', model: '' }, text: results[id] }));
  if (ordered.length < 2) return;
  const attrData = computeParaAttribution(lastConsensusText, ordered, sel => selectionLabel(sel));
  if (!attrData || !attrData.length) return;
  const bubble = pair.querySelector('.msg.assistant .msg-bubble');
  const msgHead = pair.querySelector('.msg.assistant .msg-head');
  if (!bubble || !msgHead || msgHead.querySelector('.attr-toggle-btn')) return;
  applyInlineAttribution(bubble, attrData);
  const btn = el('button', 'copy-btn attr-toggle-btn');
  btn.innerHTML = ATTR_ICON;
  btn.title = 'Highlight source models';
  btn.setAttribute('aria-label', 'Toggle source highlighting');
  btn.setAttribute('aria-pressed', 'false');
  btn.onclick = () => {
    const on = bubble.classList.toggle('attribution-active');
    btn.setAttribute('aria-pressed', String(on));
    btn.title = on ? 'Hide source highlighting' : 'Highlight source models';
    btn.classList.toggle('active', on);
    if (!on) hideAttrTip();
  };
  msgHead.appendChild(btn);
}

// ── Model performance history ────────────────────────────────────────────────
// Persists each model's consensus contribution data to localStorage so users
// can see historical performance trends in Settings → Models.
const MODEL_PERF_KEY = 'polecat_model_perf';
const MODEL_PERF_MAX = 25;   // entries kept per model key

function recordModelPerf(perModel) {
  let store = {};
  try { store = JSON.parse(localStorage.getItem(MODEL_PERF_KEY) || '{}'); } catch {}
  perModel.forEach(m => {
    const sel = sels().find(s => selectionLabel(s) === m.label);
    const key = sel ? (sel.provider + '|' + sel.model) : ('lbl|' + (m.label || ''));
    if (!key) return;
    if (!store[key]) store[key] = { s: [], p: [] };
    store[key].s.push(m.stance || '');
    store[key].p.push(typeof m.contributionPct === 'number' ? m.contributionPct : 0);
    if (store[key].s.length > MODEL_PERF_MAX) {
      store[key].s = store[key].s.slice(-MODEL_PERF_MAX);
      store[key].p = store[key].p.slice(-MODEL_PERF_MAX);
    }
  });
  try { localStorage.setItem(MODEL_PERF_KEY, JSON.stringify(store)); } catch {}
}

function getModelPerfSummary(provider, model) {
  let store = {};
  try { store = JSON.parse(localStorage.getItem(MODEL_PERF_KEY) || '{}'); } catch {}
  const d = store[provider + '|' + model];
  if (!d || !d.s || d.s.length < 3) return null;
  const n = d.s.length;
  const aligned = d.s.filter(s => s === 'aligned').length;
  const outlier  = d.s.filter(s => s === 'outlier').length;
  const avgPct   = Math.round(d.p.reduce((a, b) => a + b, 0) / n);
  return { n, aligned, outlier, avgPct };
}

// ════════════════════════════════════════════════════════════════════════════
//  MODEL TESTING (Hybrid: auto on add/select + "Test all" button; cached)
// ════════════════════════════════════════════════════════════════════════════
function refreshModelBadges() {
  // A model's tested status can also be the arbiter's health — keep the
  // Consensus tab's proactive warning fresh even while the user stays on the
  // Models/Keys tab, so it's never stale by the time they switch over.
  if ($('configModal').classList.contains('open')) { renderSelList(); renderArbitration(); }   // don't nuke the add-row/browse panel
  buildChips();
}
async function testOne(provider, model) {
  if (!providerKey(cfg, provider)) return;            // can't probe without a key
  const k = statusKey(provider, model);
  cfg.modelStatus[k] = { ...(cfg.modelStatus[k] || {}), testing: true };
  refreshModelBadges();
  const res = await probeModel({ provider, model }, cfg);
  cfg.modelStatus[k] = { ok: res.ok, error: res.error || '', ts: Date.now() };
  persist(); refreshModelBadges();
}
async function testAllModels() {
  const keyed = configuredProviders(cfg);
  if (!keyed.length) { toast('Add an API key first'); return; }
  const seen = new Set(), targets = [];
  const add = (provider, model) => { const k = statusKey(provider, model); if (!seen.has(k)) { seen.add(k); targets.push({ provider, model }); } };
  (cfg.selections || []).forEach(s => { if (keyed.includes(s.provider)) add(s.provider, s.model); });
  keyed.forEach(pid => PROVIDERS[pid]?.models.forEach(m => add(pid, m.value)));
  if (!targets.length) return;
  toast(`Testing ${targets.length} models…`);
  targets.forEach(t => { cfg.modelStatus[statusKey(t.provider, t.model)] = { testing: true }; });
  refreshModelBadges();
  let i = 0;
  const worker = async () => {
    while (i < targets.length) {
      const t = targets[i++];
      const res = await probeModel({ provider: t.provider, model: t.model }, cfg);
      cfg.modelStatus[statusKey(t.provider, t.model)] = { ok: res.ok, error: res.error || '', ts: Date.now() };
      persist(); refreshModelBadges();
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, targets.length) }, worker));
  toast('Model test complete');
}
// ── Keys-tab live verification (reuses the same probe / modelStatus cache
// as the Models tab, keyed on the provider's default model) ───────────────
const CLAUDE_OAUTH_RE = /^sk-ant-oat01-/;
const _keyProbeTimers = {};
function keyStatusInfo(id) {
  const val = (providerKey(cfg, id) || '').trim();
  if (!val) return { state: 'none' };
  if (id === 'claude' && CLAUDE_OAUTH_RE.test(val)) {
    return { state: 'bad', error: "That's a Claude Code OAuth token — Polecat needs an API key (sk-ant-api03…) from console.anthropic.com." };
  }
  const st = statusOf(id, defaultModel(id));
  if (!st) return { state: 'unknown' };
  if (st.testing) return { state: 'checking' };
  if (st.ok) return { state: 'ok' };
  return { state: 'bad', error: st.error || 'Invalid key' };
}
function renderKeyStatusField(field, id) {
  const badge = field.querySelector('.key-status'); if (!badge) return;
  const info = keyStatusInfo(id);
  const byState = {
    none:     { cls: '',          icon: DOT_SM_SVG,   label: 'No key' },
    unknown:  { cls: '',          icon: DOT_SM_SVG,   label: 'Key added' },
    checking: { cls: 'checking',  icon: CLOCK_SM_SVG, label: 'Checking…' },
    ok:       { cls: 'on',        icon: CHECK_SM_SVG, label: 'Connected' },
    bad:      { cls: 'bad',       icon: CROSS_SM_SVG, label: 'Not connected' },
  };
  const v = byState[info.state];
  badge.className = 'key-status' + (v.cls ? ' ' + v.cls : '');
  badge.innerHTML = `${v.icon}<span>${escapeHtml(v.label)}</span>`;
  badge.title = info.error || '';
}
function scheduleKeyProbe(id, field) {
  clearTimeout(_keyProbeTimers[id]);
  const val = (providerKey(cfg, id) || '').trim();
  const model = defaultModel(id);
  const k = model ? statusKey(id, model) : null;
  // The cache is keyed by provider+model, not by key value — the key just
  // changed, so any cached result now describes a DIFFERENT key. Drop it so
  // the badge never shows a stale "Connected"/"Not connected" for new text.
  if (k) delete cfg.modelStatus[k];
  // Deleting the cache above can flip the Consensus tab's proactive arbiter-
  // health warning (e.g. a bad key just got cleared, or key text changed) —
  // keep it in sync the same way the key badge itself does.
  renderArbitration();
  if (!val || (id === 'claude' && CLAUDE_OAUTH_RE.test(val))) { renderKeyStatusField(field, id); return; }
  renderKeyStatusField(field, id);   // neutral "Key added" while the debounce waits
  renderArbitration();
  _keyProbeTimers[id] = setTimeout(async () => {
    if (!model || providerKey(cfg, id) !== val) return;   // key changed again before the debounce fired
    cfg.modelStatus[k] = { testing: true };
    renderKeyStatusField(field, id);
    const res = await probeModel({ provider: id, model }, cfg);
    if (providerKey(cfg, id) !== val) return;              // key changed again while probing — drop stale result
    cfg.modelStatus[k] = { ok: res.ok, error: res.error || '', ts: Date.now() };
    persist();
    renderKeyStatusField(field, id);
    renderArbitration();
  }, 600);
}
// A probe timeout on a SLOW self-hosted provider (Polecat MS) means the model is
// warming up / slow on CPU — not broken. Show a neutral "slow" mark, not a ✗.
function isSlowWarming(provider, st) {
  return !!(PROVIDERS[provider]?.slow && st && st.ok === false && /tim(e|ed)\s*out|abort/i.test(st.error || ''));
}
// A real consensus run's arbiter call is itself a live probe — if it fails,
// cache that in the same modelStatus store the Keys/Models tabs read, so the
// NEXT time Settings opens, arbiterHealthWarning() already knows, instead of
// the user only finding out after the fact via the fallback note.
function recordArbiterHealthFailure(sel, err) {
  if (!sel || !sel.provider || !sel.model) return;
  cfg.modelStatus[statusKey(sel.provider, sel.model)] = { ok: false, error: (err && err.message) || 'Arbiter call failed', ts: Date.now() };
  persist();
}
// Proactive arbiter-health check (Backlog: "surface a one-line warning in the
// Consensus tab up front rather than only after it fails"). Reads ONLY the
// existing modelStatus cache / provider-key presence — never triggers a new
// network probe just from rendering Settings. Only determinate for an
// explicit (non-"auto") final-answer pick, since "auto" isn't resolved to a
// specific model until answers actually arrive.
function arbiterHealthWarning(arbSel) {
  if (!arbSel || arbSel.provider === 'demo') return null;
  if (!providerKey(cfg, arbSel.provider)) {
    return `No API key for ${PROVIDERS[arbSel.provider]?.name || arbSel.provider} yet — ${selectionLabel(arbSel)} can't write the final answer until one's added in Keys.`;
  }
  const st = statusOf(arbSel.provider, arbSel.model);
  if (st && st.ok === false && !isSlowWarming(arbSel.provider, st)) {
    return `${selectionLabel(arbSel)}'s key looks invalid (${st.error || 'last check failed'}) — pick a different final-answer model or fix it in Keys.`;
  }
  return null;
}
function statusGlyph(provider, model) {
  const st = statusOf(provider, model);
  if (!st) return '';
  if (st.testing) return '⋯ ';
  if (st.ok) return '✓ ';
  if (isSlowWarming(provider, st)) return '◴ ';
  return '✗ ';
}

// ════════════════════════════════════════════════════════════════════════════
//  SETTINGS MODAL  (tabs: Models & Consensus · Keys · Support)
// ════════════════════════════════════════════════════════════════════════════
const VALID_TABS = new Set(['models', 'keys', 'support']);
function setConfigTab(name) {
  cfg.ui.lastTab = name; persist();
  document.querySelectorAll('.cfg-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.cfg-section').forEach(s => s.classList.toggle('active', s.dataset.tab === name));
  $('modal')?.scrollTo?.(0, 0);
}
// Jump from a model row's "Add key" badge straight to that provider's key input:
// switch to the Keys tab, scroll the field into view, flash it, and focus it.
function goToProviderKey(provider) {
  setConfigTab('keys');
  const input = $('key_' + provider);
  if (!input) return;
  const field = input.closest('.key-field') || input;
  field.scrollIntoView({ block: 'center', behavior: 'smooth' });
  input.focus({ preventScroll: true });
  field.classList.add('key-field-flash');
  setTimeout(() => field.classList.remove('key-field-flash'), 1400);
}
function openConfig(tab) {
  closeSidebar();   // opening Settings from the sidebar's own link left its higher z-index
                     // backdrop covering the modal, eating the first click
  renderModels(); renderKeys(); renderArbitration(); renderDonate(); renderSystemPrompt();
  const stored = cfg.ui.lastTab;
  setConfigTab(tab || (VALID_TABS.has(stored) ? stored : 'models'));
  const wasOpen = $('configModal').classList.contains('open');
  $('configModal').classList.add('open');
  if (!wasOpen) pushModalFocus($('closeConfig'));
}
function closeConfig() {
  const wasOpen = $('configModal').classList.contains('open');
  $('configModal').classList.remove('open');
  if (wasOpen) popModalFocus();
}

// One-tap free demo: select TWO fast, free models + a light consensus so the
// cross-model magic is obvious, then keep the clickable example questions up.
const DEMO_STARTER_MODELS = ['openai/gpt-oss-20b:free']; // hotfix: only model the demo worker genuinely serves today
function startFreeDemo() {
  if (!PROVIDERS.demo) return;
  cfg.selections = cfg.selections || [];
  for (const m of DEMO_STARTER_MODELS) {
    if (cfg.selections.length >= MAX_SELECTIONS) break;
    if (!cfg.selections.some(s => s.provider === 'demo' && s.model === m)) cfg.selections.push(mkSelection('demo', m));
  }
  if (!cfg.selections.some(s => s.provider === 'demo')) {   // safety: ensure at least one demo model
    if (cfg.selections.length >= MAX_SELECTIONS) { toast(`Remove a model first (max ${MAX_SELECTIONS})`); openConfig('models'); return; }
    cfg.selections.push(mkSelection('demo', defaultModel('demo')));
  }
  cfg.consensus = true;                       // show the consensus so it's obvious how it works
  persist();
  closeConfig(); closeSidebar();
  const wasWelcomeOpen = $('welcomeOverlay')?.classList.contains('open');
  localStorage.setItem(WELCOME_KEY, '1'); $('welcomeOverlay')?.classList.remove('open');
  if (wasWelcomeOpen) popModalFocus();
  const t = $('cgTry'); if (t) t.hidden = true;
  const hint = $('cgHint'); if (hint) hint.hidden = false;
  buildChips(); showGreeting(); renderSuggestions();        // keep the example questions visible
  // Brief staggered entrance on the suggestion chips to draw attention after overlay closes.
  const _sug = $('cgSuggest');
  if (_sug) { _sug.classList.add('demo-ready'); setTimeout(() => _sug.classList.remove('demo-ready'), 700); }
  $('promptInput').focus();
  toast('Free demo ready — pick a question below or type your own');
}

// ── Models tab ──────────────────────────────────────────────────────────────
function modelOptionsHtml(providerId, selected) {
  const p = PROVIDERS[providerId];
  const known = p.models.some(m => m.value === selected);
  let html = '';
  if (selected && !known)
    html += `<option value="${escapeHtml(selected)}" selected>${statusGlyph(providerId, selected)}${escapeHtml(selected)} (custom)</option>`;
  html += p.models.map(m =>
    `<option value="${escapeHtml(m.value)}"${m.value === selected ? ' selected' : ''}>${statusGlyph(providerId, m.value)}${escapeHtml(m.label)}${m.price ? ' — ' + m.price : ''}${m.vision ? ' · vision' : ''}</option>`
  ).join('');
  if (p.allowCustomModel) html += `<option value="__custom__">Custom model id…</option>`;
  return html;
}
function statusBadge(provider, model) {
  const st = statusOf(provider, model);
  if (!providerKey(cfg, provider)) return '';
  if (!st) return `<span class="sel-status" title="Not tested">•</span>`;
  if (st.testing) return `<span class="sel-status testing" title="Testing…">⋯</span>`;
  if (st.ok) return `<span class="sel-status ok" title="Available">✓</span>`;
  if (isSlowWarming(provider, st)) return `<span class="sel-status slow" title="Slow to respond (self-hosted, CPU) — it may still work; give it a few seconds, or re-test">◴</span>`;
  return `<span class="sel-status bad" title="${escapeHtml(st.error || 'Unavailable')}">✗</span>`;
}
// Also refreshes the Consensus tab (arbiter picker options + the proactive
// health warning both depend on the current selections list) so reordering,
// adding, or removing a model never leaves it stale within the same session.
function renderModels() { renderModelsFlow(); renderSelList(); renderAddRow(); renderArbitration(); }
function renderSelList() {
  const list = $('selList'); if (!list) return;
  list.innerHTML = '';
  const allSels = cfg.selections || [];
  const currentArbiter = cfg.arbitration.arbiter;
  allSels.forEach((sel, idx) => {
    const p = PROVIDERS[sel.provider]; if (!p) return;
    const ready = p.noKey || !!providerKey(cfg, sel.provider);
    const isArbiter = currentArbiter === sel.id;
    const vision = modelSupportsVision(sel.provider, sel.model);
    const readyBadge = p.noKey
      ? `<span class="sel-free" title="No key needed — runs through the free demo">free</span>`
      : statusBadge(sel.provider, sel.model);
    const row = el('div', 'sel-row' + (ready ? '' : ' needs-key'));
    row.innerHTML =
      `<div class="sel-move">` +
      `<button class="sel-mv" title="Move up" aria-label="Move up"${idx === 0 ? ' disabled' : ''}>${CHEVRON_UP_SM_SVG}</button>` +
      `<button class="sel-mv" title="Move down" aria-label="Move down"${idx === allSels.length - 1 ? ' disabled' : ''}>${CHEVRON_DOWN_SM_SVG}</button>` +
      `</div>` +
      `<span class="sel-dot" style="background:${p.color}"></span>` +
      `<span class="sel-name">${escapeHtml(p.short)}</span>` +
      `<select class="field-input sel-model"></select>` +
      (vision ? `<span class="sel-vision" title="Reads images">${EYE_SVG_SM}</span>` : '') +
      (ready ? readyBadge : `<button type="button" class="sel-warn sel-addkey" title="Add your ${escapeHtml(p.name)} key">Add key</button>`) +
      `<button class="sel-arb${isArbiter ? ' arb-on' : ''}" title="${isArbiter ? 'Writes the final answer — click to switch back to auto' : 'Set this model to write the final answer'}" aria-pressed="${isArbiter}">Final answer</button>` +
      `<button class="sel-x" title="Remove" aria-label="Remove ${escapeHtml(p.short)}">&#215;</button>`;
    const select = row.querySelector('.sel-model');
    select.innerHTML = modelOptionsHtml(sel.provider, sel.model);
    select.onchange = () => onSelModelChange(sel.id, sel.provider, select);
    const badge = row.querySelector('.sel-status');
    if (badge) badge.onclick = () => testOne(sel.provider, sel.model);
    row.querySelector('.sel-x').onclick = () => removeSelection(sel.id);
    const [upBtn, downBtn] = row.querySelectorAll('.sel-mv');
    upBtn.onclick = () => moveSelection(sel.id, -1);
    downBtn.onclick = () => moveSelection(sel.id, 1);
    row.querySelector('.sel-arb').onclick = () => setArbiter(isArbiter ? 'auto' : sel.id);
    const addKeyBtn = row.querySelector('.sel-addkey');
    if (addKeyBtn) addKeyBtn.onclick = () => goToProviderKey(sel.provider);
    const itemWrap = el('div', 'sel-item');
    itemWrap.appendChild(row);
    if (isArbiter) {
      const onlyRow = el('div', 'sel-arb-only-row');
      onlyRow.innerHTML =
        `<label class="sel-arb-only-label">` +
        `<input type="checkbox" class="sel-arb-only-cb"${sel.arbiterOnly ? ' checked' : ''}>` +
        `<span>Synthesis only</span>` +
        `<span class="mini-note"> \xb7 does not answer, just synthesizes from the others</span>` +
        `</label>`;
      onlyRow.querySelector('.sel-arb-only-cb').onchange = (e) => {
        sel.arbiterOnly = e.target.checked;
        persist(); buildChips(); renderSelList(); renderModelsFlow(); renderArbitration();
      };
      itemWrap.appendChild(onlyRow);
    }
    const perf = getModelPerfSummary(sel.provider, sel.model);
    if (perf) {
      const alignedPct = perf.aligned / perf.n;
      const outlierPct = perf.outlier / perf.n;
      const cls = alignedPct >= 0.7 ? 'perf-good' : outlierPct >= 0.3 ? 'perf-outlier' : 'perf-mixed';
      const note = alignedPct >= 0.7 ? 'Usually aligns with consensus'
                 : outlierPct >= 0.3 ? 'Often takes a distinct angle'
                 : 'Mixed agreement patterns';
      const perfEl = el('div', 'sel-perf-note ' + cls);
      perfEl.title = 'Model track record across ' + perf.n + ' consensus session' + (perf.n === 1 ? '' : 's') + ' \xb7 avg ~' + perf.avgPct + '% contribution';
      perfEl.textContent = note + ' \xb7 ' + perf.n + ' session' + (perf.n === 1 ? '' : 's');
      itemWrap.appendChild(perfEl);
    }
    list.appendChild(itemWrap);
  });
  if (!allSels.length)
    list.innerHTML = `<div class="muted-hint">No models yet — add one below.</div>`;
}
function onSelModelChange(id, provider, select) {
  let val = select.value;
  if (val === '__custom__') {
    val = prompt(`Enter a ${PROVIDERS[provider].name} model id:`, '');
    if (!val) { renderModels(); return; }
  }
  const sel = selById(id); if (!sel) return;
  sel.model = val; persist();
  buildChips(); renderModels();
  const lbl = $('tab_' + id)?.querySelector('.tab-label');
  if (lbl) lbl.textContent = selectionLabel(sel);
  if (providerKey(cfg, provider)) testOne(provider, val);   // auto-test on change
}
function renderAddRow() {
  const area = $('addModelArea');
  const atMax = (cfg.selections || []).length >= MAX_SELECTIONS;
  area.innerHTML =
    (atMax ? `<div class="muted-hint">Maximum of ${MAX_SELECTIONS} models reached.</div>` :
      `<div class="add-row">` +
      `<select class="field-input" id="addProvider">${PROVIDER_IDS.map(id => `<option value="${id}">${escapeHtml(PROVIDERS[id].name)}</option>`).join('')}</select>` +
      `<select class="field-input" id="addModel"></select>` +
      `<button class="btn btn-solid" id="addModelBtn">Add</button>` +
      `</div>` +
      `<input class="field-input add-custom" id="addCustom" placeholder="custom model id" style="display:none">` +
      `<div class="browse-bar"><button class="btn btn-ghost browse-btn" id="browseBtn" hidden>${SEARCH_SVG} Browse all models</button></div>` +
      `<div class="browse-panel" id="browsePanel" hidden><input class="field-input" id="browseSearch" placeholder="Search models…" autocomplete="off"><div class="browse-list" id="browseList"></div></div>`) +
    `<button class="btn btn-ghost test-all" id="testAllBtn">${ZAP_SVG} Test models</button>`;

  $('testAllBtn').onclick = testAllModels;
  if (atMax) return;

  const provSel = $('addProvider'), modSel = $('addModel'), custom = $('addCustom');
  const refresh = () => {
    modSel.innerHTML = modelOptionsHtml(provSel.value, defaultModel(provSel.value));
    custom.style.display = 'none'; custom.value = '';
    $('browseBtn').hidden = !modelListSupported(provSel.value);
    $('browsePanel').hidden = true; const bs = $('browseSearch'); if (bs) bs.value = '';
  };
  provSel.onchange = refresh;
  modSel.onchange = () => { custom.style.display = modSel.value === '__custom__' ? '' : 'none'; };
  $('addModelBtn').onclick = () => {
    const pid = provSel.value;
    let model = modSel.value;
    if (model === '__custom__') { model = custom.value.trim(); if (!model) { toast('Enter a model id'); return; } }
    addModel(pid, model, true);
  };
  $('browseBtn').onclick = () => openBrowse(provSel.value);
  $('browseSearch').oninput = (e) => renderBrowse(e.target.value);
  refresh();
}

function renderSystemPrompt() {
  const area = $('sysPromptArea'); if (!area) return;
  const val = cfg.systemPrompt || '';
  area.innerHTML =
    `<div class="sys-prompt-section">` +
    `<label class="mini-label" for="sysPromptInput">System prompt <span class="mini-note">optional — applies to all models</span></label>` +
    `<textarea class="field-input sys-prompt-ta" id="sysPromptInput" rows="3" ` +
    `placeholder='E.g. "Reply in French" or "You are a senior Python engineer…" — leave blank for default.'>${escapeHtml(val)}</textarea>` +
    `<div class="switch-sub">Sent to every model before your first message. One instruction, every model.</div>` +
    `</div>`;
  $('sysPromptInput').oninput = (e) => { cfg.systemPrompt = e.target.value; persist(); };
}

function addModel(provider, model, viaAddBtn) {
  if ((cfg.selections || []).some(s => s.provider === provider && s.model === model)) { toast('Already added'); return; }
  if ((cfg.selections || []).length >= MAX_SELECTIONS) { toast(`Max ${MAX_SELECTIONS} models`); return; }
  (cfg.selections = cfg.selections || []).push(mkSelection(provider, model));
  persist(); buildChips();
  if (viaAddBtn) renderModels(); else { renderSelList(); renderModelsFlow(); renderArbitration(); }   // browse: keep the panel open
  if (providerKey(cfg, provider)) testOne(provider, model);   // auto-test on add
  else if (provider !== 'demo') toast(`Added — add a ${PROVIDERS[provider].name} key to use it`);   // demo needs no key
}

// Live model-list browse/search (OpenAI-compatible providers; OpenRouter is public)
async function openBrowse(provider) {
  if (!modelListSupported(provider)) { toast('No live list for this provider'); return; }
  const panel = $('browsePanel'), listEl = $('browseList');
  panel.hidden = false; _browseProvider = provider;
  listEl.innerHTML = `<div class="muted-hint">Loading ${escapeHtml(PROVIDERS[provider].name)} models…</div>`;
  try {
    _browseList = await listModels(provider, cfg);
    renderBrowse($('browseSearch')?.value || '');
  } catch (e) {
    listEl.innerHTML = `<div class="muted-hint">Couldn't load: ${escapeHtml(e.message)}</div>`;
  }
}
function renderBrowse(filter) {
  const listEl = $('browseList'); if (!listEl) return;
  const f = (filter || '').toLowerCase().trim();
  const matches = _browseList.filter(m => !f || m.id.toLowerCase().includes(f));
  const shown = matches.slice(0, 80);
  const have = new Set((cfg.selections || []).filter(s => s.provider === _browseProvider).map(s => s.model));
  listEl.innerHTML = (shown.length ? shown.map(m =>
    `<button class="browse-item${have.has(m.id) ? ' added' : ''}" data-id="${escapeHtml(m.id)}">` +
    `<span class="bi-id">${escapeHtml(m.id)}</span>` +
    `<span class="bi-meta">${m.free ? '<span class="bi-free">free</span>' : ''}${m.ctx ? `<span class="bi-ctx">${Math.round(m.ctx / 1000)}k</span>` : ''}${have.has(m.id) ? '<span class="bi-added">✓</span>' : ''}</span>` +
    `</button>`).join('') : `<div class="muted-hint">No matches.</div>`) +
    (matches.length > shown.length ? `<div class="muted-hint">+${matches.length - shown.length} more — refine search</div>` : '');
  listEl.querySelectorAll('.browse-item').forEach(b => b.onclick = () => { addModel(_browseProvider, b.dataset.id, false); renderBrowse($('browseSearch')?.value || ''); });
}

// ── Keys tab ────────────────────────────────────────────────────────────────
const KEY_TIER = { demo: 'Free · no key', claude: 'Paid', gemini: 'Free tier + paid', openai: 'Paid', openrouter: 'Free + paid', groq: 'Free tier', hf: 'Free credits' };
function renderKeys() {
  const wrap = $('keyFields');
  wrap.innerHTML =
    `<details class="key-help"><summary>${KEY_SVG} What is an API key?</summary>` +
    `<p>An API key is a short string of letters and numbers — like a passcode. Each provider (Anthropic, Google, OpenAI…) generates one for you so Polecat can use their models on your behalf. Paste it here: it's stored only in your browser and sent straight to that provider — never to us. You stay in control — revoke or regenerate it anytime in the provider's dashboard, and set spending limits there.</p></details>` +
    `<details class="key-help"><summary>${DOLLAR_SVG} What will it cost?</summary>` +
    `<p>You only ever pay the provider, for what you use — never Polecat.</p>` +
    `<ul>` +
    `<li><b>Free</b> — OpenRouter <code>:free</code> models, Groq's free tier, and Hugging Face credits cost <b>$0</b> (just rate-limited). Gemini also has a free tier.</li>` +
    `<li><b>Paid</b> — Claude, Gemini &amp; ChatGPT bill per use: cheaper models (Haiku, GPT&#8209;mini, Gemini Flash) ≈ <b>$0.001–0.01</b> a question; flagships (Opus, GPT&#8209;5, Gemini Pro) ≈ <b>$0.01–0.10</b>. Longer answers cost a bit more.</li>` +
    `<li><b>In practice</b> — light daily use on paid models is often under <b>~$1–5/month</b>; free models stay $0. Set a hard spending cap in each provider's billing settings so there are no surprises.</li>` +
    `</ul></details>`;
  if (PROVIDERS.demo) {
    const demoCount = (cfg.selections || []).filter(s => s.provider === 'demo').length;
    const card = el('div', 'demo-card');
    if (demoCount > 0) {
      card.innerHTML =
        `<div class="demo-card-head"><span class="demo-spark">${CHECK_SM_SVG}</span><b>Free demo is active</b></div>` +
        `<div class="demo-card-sub">You're already using ${demoCount} free demo model${demoCount === 1 ? '' : 's'} — no key needed. ` +
        `Add your own free key below for unlimited use &amp; more models.</div>` +
        `<button class="btn btn-solid demo-go" id="demoGoKeys">Manage models →</button>`;
      wrap.appendChild(card);
      card.querySelector('#demoGoKeys').onclick = () => setConfigTab('models');
    } else {
      card.innerHTML =
        `<div class="demo-card-head"><span class="demo-spark">${STAR_SVG}</span><b>No key? Try it free.</b></div>` +
        `<div class="demo-card-sub">Run a free model through Polecat right now — no signup, no key. ` +
        `When you're ready, add your own free key below for unlimited use &amp; more models.</div>` +
        `<button class="btn btn-solid demo-go" id="demoGoKeys">Try it free — no setup</button>`;
      wrap.appendChild(card);
      card.querySelector('#demoGoKeys').onclick = () => startFreeDemo();
    }
  }
  PROVIDER_IDS.forEach(id => {
    const p = PROVIDERS[id];
    if (p.noKey) return;                       // demo needs no key field
    const tier = KEY_TIER[id] || '';
    const field = el('div', 'key-field');
    field.innerHTML =
      `<div class="key-head"><span class="svc-dot" style="background:${p.color}"></span>` +
      `<span class="key-name">${escapeHtml(p.name)}</span>` +
      `<span class="key-tier ${tier === 'Paid' ? 'paid' : 'free'}">${escapeHtml(tier)}</span>` +
      `<span class="key-status"></span></div>` +
      `<input type="password" class="field-input" id="key_${id}" placeholder="${escapeHtml(p.placeholder)}" autocomplete="off" value="${escapeHtml(providerKey(cfg, id))}">` +
      `<span class="field-hint">Key at <a href="${p.keyUrl}" target="_blank" rel="noopener">${escapeHtml(p.keyLabel)}</a>${p.rateNote ? ' · ' + escapeHtml(p.rateNote) : ''}</span>`;
    const input = field.querySelector('input');
    renderKeyStatusField(field, id);
    input.oninput  = () => { setProviderKey(cfg, id, input.value.trim()); persist(); scheduleKeyProbe(id, field); };
    input.onchange = () => { buildChips(); };
    wrap.appendChild(field);
    // Verify a key that's never been probed yet (e.g. freshly imported); an
    // already-cached result (ok/bad) is trusted as-is so reopening the tab
    // doesn't re-hit every provider's API on each visit.
    if (providerKey(cfg, id) && !statusOf(id, defaultModel(id))) scheduleKeyProbe(id, field);
  });
  // Export / Import lives here — it's about your keys + overall setup
  const actions = el('div', 'key-actions');
  actions.innerHTML = `<span class="mini-note">Move your whole setup between browsers or devices</span><span class="arb-spacer"></span><button class="btn btn-ghost" id="cfgExport">Export…</button><button class="btn btn-ghost" id="cfgImport">Import…</button>`;
  wrap.appendChild(actions);
  $('cfgExport').onclick = openExport;
  $('cfgImport').onclick = openImport;
}

// Small "who answers -> who arbitrates -> consensus" flow pills, shared by the
// Models and Consensus tabs so the shape of a run reads the same in both places
// and never drifts out of sync (single source of truth for the markup).
function consensusFlowPills(answerers, arbSel) {
  return `<div class="welcome-flow cs-flow">` +
      answerers.map(s => { const p = PROVIDERS[s.provider]; return p ? `<span class="wm-pill" style="--c:${p.color}">${escapeHtml(selectionLabel(s))}</span>` : ''; }).join('') +
      `<span class="wm-arrow">&rarr;</span>` +
      `<span class="wm-pill wm-consensus">${escapeHtml(arbSel ? selectionLabel(arbSel) : 'Auto pick')}${arbSel && arbSel.arbiterOnly ? '<span class="wm-syn-tag"> \xb7 synthesis only</span>' : ''}</span>` +
      `<span class="wm-arrow">&rarr;</span>` +
      `<span class="wm-pill wm-consensus">Consensus</span>` +
    `</div>`;
}
// The plain-language "N models answer, then X merges them" sentence, shared
// by the Models and Consensus tabs so the story reads identically in both
// places (only the trailing link differs per tab and is added by the caller).
function consensusFlowSentence(answerers, arbSel) {
  const n = answerers.length;
  if (n === 1) {
    return `Your 1 model answers, then ${arbSel ? escapeHtml(selectionLabel(arbSel)) : 'the strategy'} turns it into the final answer.`;
  }
  return `Your ${n} models answer in parallel, then ${arbSel ? escapeHtml(selectionLabel(arbSel)) : 'the strategy auto-picks one to'} merge${arbSel ? 's' : ''} them into one answer.`;
}
// Renders the same flow pills + plain-language sentence at the top of the
// Models tab (read-only summary) so a user managing the model list can see
// who answers vs. who writes the final answer without switching to the
// Consensus tab.
function renderModelsFlow() {
  const wrap = $('modelsFlow'); if (!wrap) return;
  const answerers = answeringSelections(cfg);
  const arbSel = cfg.arbitration.arbiter !== 'auto' ? (cfg.selections || []).find(s => s.id === cfg.arbitration.arbiter) : null;
  wrap.innerHTML = answerers.length
    ? consensusFlowPills(answerers, arbSel) + `<div class="cs-flow-text">${consensusFlowSentence(answerers, arbSel)}</div>`
    : '';
}

// ── Arbitration tab ───────────────────────────────────────────────────────
function renderArbitration() {
  const wrap = $('arbControls');
  if (!wrap) return;
  const strat = activeStrategy(cfg);
  const on = cfg.consensus !== false;
  const provOn = cfg.arbitration.provenance !== false;
  const editable = !strat.builtin;

  const stratOpts = allStrategies(cfg).map(s =>
    `<option value="${escapeHtml(s.id)}"${s.id === strat.id ? ' selected' : ''}>${escapeHtml(s.name)}${s.builtin ? '' : ' (custom)'}</option>`).join('');
  const arbiterOpts = [`<option value="auto"${cfg.arbitration.arbiter === 'auto' ? ' selected' : ''}>Auto (strategy default)</option>`]
    .concat((cfg.selections || []).map(s => {
      const suffix = s.arbiterOnly ? ' (synthesis only)' : '';
      return `<option value="${escapeHtml(s.id)}"${cfg.arbitration.arbiter === s.id ? ' selected' : ''}>${escapeHtml(selectionLabel(s))}${suffix}</option>`;
    })).join('');
  const promptFields = Object.entries(strat.prompts || {}).map(([k, v]) =>
    `<label class="arb-plabel">${escapeHtml(k)}</label><textarea class="field-input arb-ptext" data-key="${escapeHtml(k)}" rows="4"${editable ? '' : ' readonly'}>${escapeHtml(v)}</textarea>`).join('');

  // The "who answers -> who writes the final answer -> consensus" flow already
  // renders once, above, via renderModelsFlow() — Models & Consensus share one
  // tab now, so it isn't repeated here. Still compute the arbiter's health
  // warning, since that's specific to this control block.
  const arbSel = cfg.arbitration.arbiter !== 'auto' ? (cfg.selections || []).find(s => s.id === cfg.arbitration.arbiter) : null;
  const healthWarn = arbiterHealthWarning(arbSel);

  wrap.innerHTML =
    `<label class="switch-row"><span><b>Consensus answer</b><br><span class="switch-sub">Off = individual model tabs only, no combined answer</span></span>` +
      `<span class="switch ${on ? 'on' : ''}" id="consensusSwitch" role="switch" aria-checked="${on}" tabindex="0"><span class="knob"></span></span></label>` +
    `<div class="arb-body"${on ? '' : ' aria-disabled="true" inert'}>` +
      `<label class="mini-label">Strategy <span class="mini-note">how the combined answer is produced</span></label><select class="field-input" id="arbSelect">${stratOpts}</select>` +
      `<div class="arb-desc">${escapeHtml(strat.description || '')}</div>` +
      `<label class="switch-row"><span><b>Agreement map</b><br><span class="switch-sub">After each answer, show how much the models agreed and what each contributed</span></span>` +
        `<span class="switch ${provOn ? 'on' : ''}" id="provSwitch" role="switch" aria-checked="${provOn}" tabindex="0"><span class="knob"></span></span></label>` +
      `<label class="mini-label">Final answer written by <span class="mini-note">combines every model's answer into one — defaults to the strategy's pick</span></label><select class="field-input" id="arbiterSelect">${arbiterOpts}</select>` +
      (healthWarn ? `<div class="arb-health-warn">${escapeHtml(healthWarn)}</div>` : '') +
      (arbSel ? `<label class="sel-arb-only-label cs-arb-only-row"><input type="checkbox" id="csArbOnlyCb"${arbSel.arbiterOnly ? ' checked' : ''}>` +
        `<span>Synthesis only</span><span class="mini-note"> \xb7 ${escapeHtml(selectionLabel(arbSel))} won't answer, just synthesizes from the others</span></label>` : '') +
      `<details class="arb-prompts"${editable ? ' open' : ''}><summary>Prompt template${Object.keys(strat.prompts || {}).length > 1 ? 's' : ''}</summary>${promptFields}` +
        (editable ? `<label class="arb-plabel">name</label><input class="field-input" id="arbName" value="${escapeHtml(strat.name)}">` : '') +
      `</details>` +
      `<div class="arb-actions">` +
        (editable ? `<button class="btn btn-ghost" id="arbSave">Save edits</button><button class="btn btn-danger" id="arbDelete">Delete</button>`
                  : `<button class="btn btn-ghost" id="arbDup">Duplicate &amp; edit</button>`) +
      `</div>` +
    `</div>`;

  const toggle = () => {
    cfg.consensus = !cfg.consensus; persist();
    if (!cfg.consensus) { $('tab_consensus')?.remove(); $('panel_consensus')?.remove(); if (activeTab === 'consensus') { const f = sels()[0]; if (f) switchTab(f.id); } }
    else if ($('responses').style.display !== 'none' && order.length) ensureTabs();
    renderArbitration();
  };
  $('consensusSwitch').onclick = toggle;
  $('consensusSwitch').onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } };
  const provToggle = () => { cfg.arbitration.provenance = !provOn; persist(); renderArbitration(); };
  $('provSwitch').onclick = provToggle;
  $('provSwitch').onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); provToggle(); } };
  $('arbSelect').onchange = (e) => { cfg.arbitration.activeId = e.target.value; persist(); renderArbitration(); };
  $('arbiterSelect').onchange = (e) => { setArbiter(e.target.value); };
  $('csArbOnlyCb') && ($('csArbOnlyCb').onchange = (e) => {
    if (arbSel) arbSel.arbiterOnly = e.target.checked;
    persist(); buildChips(); renderArbitration(); renderModels();
  });
  $('arbDup') && ($('arbDup').onclick = () => duplicateStrategy(strat));
  $('arbSave') && ($('arbSave').onclick = () => saveStrategyEdits(strat.id));
  $('arbDelete') && ($('arbDelete').onclick = () => deleteStrategy(strat.id));
}
function duplicateStrategy(strat) {
  const copy = JSON.parse(JSON.stringify(strat));
  copy.id = 'custom-' + Math.random().toString(36).slice(2, 8);
  copy.name = strat.name + ' (copy)'; copy.builtin = false;
  cfg.arbitration.custom.push(copy);
  cfg.arbitration.activeId = copy.id;
  persist(); renderArbitration(); toast('Custom strategy created — edit & save');
}
function saveStrategyEdits(id) {
  const s = cfg.arbitration.custom.find(x => x.id === id); if (!s) return;
  document.querySelectorAll('#arbControls .arb-ptext').forEach(t => { s.prompts[t.dataset.key] = t.value; });
  const name = $('arbName'); if (name && name.value.trim()) s.name = name.value.trim();
  persist(); renderArbitration(); toast('Strategy saved');
}
function deleteStrategy(id) {
  if (!confirm('Delete this custom strategy?')) return;
  cfg.arbitration.custom = cfg.arbitration.custom.filter(x => x.id !== id);
  if (cfg.arbitration.activeId === id) cfg.arbitration.activeId = 'sequential';
  persist(); renderArbitration();
}

// ── Export / Import (pick what to include) ─────────────────────────────────
function openExport() {
  closeSidebar();   // same fix as openConfig()/openKbd(): a still-open sidebar sits
                     // under this overlay's backdrop and renders visibly darkened.
  const ov = el('div', 'exp-overlay');
  ov.innerHTML =
    `<div class="exp-card">` +
    `<div class="exp-title">Export</div>` +
    `<div class="exp-sub">Choose what to put in the file — to move to another device or back up.</div>` +
    `<label class="exp-opt"><input type="checkbox" id="expSettings" checked> <span><b>Settings</b><br><span class="mini-note">models, strategies, preferences</span></span></label>` +
    `<label class="exp-opt"><input type="checkbox" id="expKeys"> <span><b>API keys</b><br><span class="mini-note">keep this file private if you include them</span></span></label>` +
    `<label class="exp-opt"><input type="checkbox" id="expHistory" checked> <span><b>Conversation history</b><br><span class="mini-note">${history.length} conversation${history.length === 1 ? '' : 's'}</span></span></label>` +
    `<div class="exp-actions"><button class="btn btn-ghost" id="expCancel">Cancel</button><button class="btn btn-solid" id="expGo">Download</button></div>` +
    `</div>`;
  document.body.appendChild(ov);
  let closed = false;
  const close = () => { if (closed) return; closed = true; ov.remove(); document.removeEventListener('keydown', onKey); popModalFocus(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  ov.onclick = (e) => { if (e.target === ov) close(); };
  document.addEventListener('keydown', onKey);
  pushModalFocus($('expCancel'));
  $('expCancel').onclick = close;
  $('expGo').onclick = () => {
    const incS = $('expSettings').checked, incK = $('expKeys').checked, incH = $('expHistory').checked;
    if (!incS && !incK && !incH) { toast('Pick at least one thing'); return; }
    const data = { _polecat: 1, exportedAt: new Date().toISOString() };
    if (incS) Object.assign(data, JSON.parse(exportSettings(cfg, { includeKeys: incK })));
    else if (incK) { data.providers = {}; for (const id of Object.keys(cfg.providers || {})) if (cfg.providers[id]?.key) data.providers[id] = { key: cfg.providers[id].key }; }
    if (incH) data.history = history;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = el('a'); a.href = URL.createObjectURL(blob); a.download = 'polecat-export.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    localStorage.setItem(BACKUP_KEY, String(Date.now()));
    renderBackupStatus();
    $('sbBackupNudge')?.setAttribute('hidden', '');
    close(); toast('Exported');
  };
}
function openImport() {
  const inp = el('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = () => {
    const file = inp.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        cfg = importSettings(cfg, data); persist();
        if (Array.isArray(data.history)) {        // merge history by id, newest first
          const have = new Set(history.map(t => t.id));
          data.history.forEach(t => { if (t && t.id && !have.has(t.id)) history.push(t); });
          history.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          saveHistory(history); renderHistoryList();
        }
        buildChips(); renderModels(); renderKeys(); renderArbitration(); updatePrivateUI();
        toast('Imported');
      } catch (e) { toast('Import failed: ' + e.message); }
    };
    reader.readAsText(file);
  };
  inp.click();
}

// ── Origin handoff (the GATED app→chat domain rename, DOMAINS.md step 1) ────
// The old origin's "we moved" stub (handoff-stub/index.html) packs the user's
// data into a one-time #handoff= fragment; this applies it on the new origin.
// Everything is guarded by an explicit confirm — a crafted link must never be
// able to silently plant settings (e.g. a malicious proxy URL) or overwrite
// data. Uses the same import code paths as the Export/Import feature.
async function tryApplyHandoffFromHash() {
  if (!location.hash.startsWith('#handoff=')) return;
  const stripHash = () => { try { window.history.replaceState(null, '', location.pathname + location.search); } catch { /* ignore */ } };
  const payload = await decodeHandoff(location.hash.slice(9));
  if (!payload) { stripHash(); toast("That move-in link didn't work — use Export / Import instead", 5500); return; }
  const nKeys = Object.keys(payload.providers || {}).filter(id => payload.providers[id]?.key).length;
  const nChats = Array.isArray(payload.history) ? payload.history.length : 0;
  const bits = [];
  if (payload.selections || payload.arbitration) bits.push('your settings');
  if (nKeys) bits.push(`${nKeys} API key${nKeys === 1 ? '' : 's'}`);
  if (nChats) bits.push(`${nChats} conversation${nChats === 1 ? '' : 's'}`);
  const ok = confirm(`Finish moving your Polecat data from ${payload.from || 'your old Polecat'}?\n\n` +
    `This imports ${bits.join(', ') || 'your setup'} into this browser.`);
  if (!ok) { stripHash(); toast('Move-in cancelled — nothing was imported'); return; }

  cfg = importSettings(cfg, payload);
  // importSettings keeps only {id, provider, model} per selection; restore the
  // flags and fields it doesn't cover so the move is lossless.
  if (Array.isArray(payload.selections)) {
    const src = new Map(payload.selections.filter(s => s && s.id).map(s => [s.id, s]));
    (cfg.selections || []).forEach(s => { if (src.get(s.id)?.arbiterOnly) s.arbiterOnly = true; });
  }
  if (typeof payload.systemPrompt === 'string') cfg.systemPrompt = payload.systemPrompt;
  if (payload.ui && typeof payload.ui === 'object') cfg.ui = payload.ui;
  if (typeof payload.private === 'boolean') cfg.private = payload.private;
  persist();
  if (nChats) {                                   // merge by id, newest first (same as openImport)
    const have = new Set(history.map(t => t.id));
    payload.history.forEach(t => { if (t && t.id && !have.has(t.id)) history.push(t); });
    history.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    saveHistory(history);
  }
  if (typeof payload.theme === 'string' && payload.theme) {
    try { localStorage.setItem('polecat_theme', payload.theme.includes(':') ? payload.theme : 'polecat:' + payload.theme); } catch { /* ignore */ }
    applyTheme(); syncHljsTheme();
  }
  if (payload.seen != null && payload.seen !== '') { try { localStorage.setItem(CHANGELOG_SEEN_KEY, String(payload.seen)); } catch { /* ignore */ } }
  migrateChangelogSeen();                          // the old origin may hand over the pre-shell date format
  localStorage.setItem(WELCOME_KEY, '1');          // a mover is an existing user — no first-run tour
  localStorage.setItem(KEYS_NUDGE_KEY, '1');
  stripHash();
  buildChips(); renderModels(); renderKeys(); renderArbitration(); updatePrivateUI();
  refreshRailFurniture(); updateWhatsNewBadge();
  toast("Welcome to Polecat's new home — your chats, settings & keys moved in", 6000);
}

// ════════════════════════════════════════════════════════════════════════════
//  SIDEBAR + CONVERSATION HISTORY
// ════════════════════════════════════════════════════════════════════════════
// The old overlay sidebar is now the Polecat Shell rail: persistent on
// desktop, an overlay drawer under 860px (the shell's hamburger opens it).
// closeSidebar() only ever closes the MOBILE drawer — and without touching
// the persisted desktop open-state, so a phone session can't collapse the
// rail a user keeps open on their laptop.
const MOBILE_MQ = '(max-width: 860px)';
function refreshRailFurniture() { renderHistoryList(); renderBackupStatus(); maybeShowIosInstallHint(); maybeShowBackupNudge(); }
function openSidebar() { refreshRailFurniture(); _shell?.setOpen(true); }
function closeSidebar() {
  if (!_shell || !window.matchMedia(MOBILE_MQ).matches) return;
  const keep = localStorage.getItem('polecat.rail.open');
  _shell.setOpen(false);
  if (keep == null) localStorage.removeItem('polecat.rail.open');
  else localStorage.setItem('polecat.rail.open', keep);
}

// One-tap backup nudge: a quiet "last backed up" note plus a rare, dismissible
// reminder — never shown to brand-new users, never more than once every few weeks.
function hasBackupWorthyData() { return history.length > 0 || configuredProviders(cfg).length > 0; }
function renderBackupStatus() {
  const note = $('sbBackupStatus'); if (!note) return;
  if (!hasBackupWorthyData()) { note.hidden = true; return; }
  const last = Number(localStorage.getItem(BACKUP_KEY)) || 0;
  note.hidden = false;
  note.textContent = last ? `Backed up ${timeAgo(last)}` : 'Never backed up — Export keeps a copy of your chats & keys';
}
function maybeShowBackupNudge() {
  const banner = $('sbBackupNudge'); if (!banner) return;
  if (!hasBackupWorthyData() || !$('sbIosInstallHint')?.hidden) { banner.hidden = true; return; }
  const now = Date.now();
  const firstUse = Number(localStorage.getItem(FIRST_USE_KEY)) || now;
  const lastBackup = Number(localStorage.getItem(BACKUP_KEY)) || 0;
  const lastNudge = Number(localStorage.getItem(BACKUP_NUDGE_KEY)) || 0;
  const dueForBackup = (now - lastBackup) > BACKUP_STALE_MS && (now - firstUse) > BACKUP_STALE_MS;
  const dueForNudge = (now - lastNudge) > BACKUP_NUDGE_QUIET_MS;
  if (dueForBackup && dueForNudge) {
    banner.hidden = false;
    localStorage.setItem(BACKUP_NUDGE_KEY, String(now));
  } else {
    banner.hidden = true;
  }
}

// iOS Home Screen install hint: iOS Safari evicts localStorage (keys/chats) after
// ~7 days of not visiting a non-installed site. Installing as a PWA is the durable
// fix (see manifest.webmanifest + apple-mobile-web-app-* meta tags). Nudge once,
// only on iOS, only when not already installed, only once there's real data to lose.
function isIosDevice() {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}
function isStandaloneApp() {
  return window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
}
function maybeShowIosInstallHint() {
  const banner = $('sbIosInstallHint'); if (!banner) return;
  const show = isIosDevice() && !isStandaloneApp() && hasBackupWorthyData() && !localStorage.getItem(IOS_INSTALL_DISMISS_KEY);
  banner.hidden = !show;
}

function timeAgo(ts) {
  const s = (Date.now() - (ts || 0)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  const d = Math.floor(s / 86400); return d === 1 ? 'yesterday' : d + 'd ago';
}
function threadDateGroup(ts) {
  const now = new Date();
  const d = new Date(ts || 0);
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((todayMs - dMs) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This week';
  if (diffDays < 30) return 'This month';
  return 'Older';
}
function historyMatches(t, q) {
  if (!q) return true;
  if ((t.title || '').toLowerCase().includes(q)) return true;
  return (t.turns || []).some(tn => (tn.prompt || '').toLowerCase().includes(q));
}
function renderHistoryList() {
  const wrap = $('sbHistory'); if (!wrap) return;
  const search = $('sbSearch');
  if (search) search.style.display = history.length ? '' : 'none';
  if (!history.length) {
    wrap.innerHTML = `<div class="sb-empty">No conversations yet.<br>Your chats are saved here, on this device.</div>`;
    return;
  }
  const q = (search?.value || '').toLowerCase().trim();
  const items = history.filter(t => historyMatches(t, q))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updatedAt || 0) - (a.updatedAt || 0));
  if (!items.length) { wrap.innerHTML = `<div class="sb-empty">No matches for "${escapeHtml(q)}".</div>`; return; }
  const itemHtml = (t) => {
    const tSels = (t.selections || []).slice(0, 5);
    const dotsHtml = tSels.length > 1
      ? `<span class="sb-model-dots">${tSels.map(s => `<span class="sb-model-dot" style="background:${escapeHtml(PROVIDERS[s.provider]?.color || '#888')}" title="${escapeHtml(selectionLabel(s))}"></span>`).join('')}${t.selections.length > 5 ? `<span class="sb-model-dot-more">+${t.selections.length - 5}</span>` : ''}</span>`
      : '';
    return `<div class="sb-item${currentThread && currentThread.id === t.id ? ' active' : ''}${t.pinned ? ' pinned' : ''}" data-id="${escapeHtml(t.id)}">` +
    `<div class="sb-item-main"><div class="sb-item-title">${t.pinned ? '<span class="sb-pin-dot">' + PIN_SVG + '</span> ' : ''}${escapeHtml(t.title || 'Untitled')}</div>` +
    `<div class="sb-item-meta">${dotsHtml}${escapeHtml(timeAgo(t.updatedAt || t.createdAt))} · ${t.turns.length} turn${t.turns.length === 1 ? '' : 's'}</div></div>` +
    `<div class="sb-item-actions">` +
    `<button class="sb-act sb-pin${t.pinned ? ' on' : ''}" title="${t.pinned ? 'Unpin' : 'Pin to top'}" data-id="${escapeHtml(t.id)}">${PIN_SVG}</button>` +
    `<button class="sb-act sb-rename" title="Rename" data-id="${escapeHtml(t.id)}">${EDIT_SVG}</button>` +
    `<button class="sb-act sb-del" title="Delete" aria-label="Delete conversation" data-id="${escapeHtml(t.id)}">×</button>` +
    `</div></div>`;
  };
  let html = '';
  if (q) {
    html = items.map(itemHtml).join('');
  } else {
    let lastGroup = null;
    for (const t of items) {
      const group = t.pinned ? 'Pinned' : threadDateGroup(t.updatedAt || t.createdAt);
      if (group !== lastGroup) { html += `<div class="sb-date-group">${escapeHtml(group)}</div>`; lastGroup = group; }
      html += itemHtml(t);
    }
  }
  wrap.innerHTML = html;
  wrap.querySelectorAll('.sb-item').forEach(it => it.onclick = (e) => { if (e.target.closest('.sb-item-actions')) return; restoreThread(it.dataset.id); });
  wrap.querySelectorAll('.sb-pin').forEach(b => b.onclick = (e) => { e.stopPropagation(); pinThread(b.dataset.id); });
  wrap.querySelectorAll('.sb-rename').forEach(b => b.onclick = (e) => { e.stopPropagation(); renameThread(b.dataset.id); });
  wrap.querySelectorAll('.sb-del').forEach(b => b.onclick = (e) => { e.stopPropagation(); deleteThread(b.dataset.id); });
}
function pinThread(id) {
  const t = history.find(x => x.id === id); if (!t) return;
  t.pinned = !t.pinned; saveHistory(history); renderHistoryList();
}
function renameThread(id) {
  const item = document.querySelector(`.sb-item[data-id="${CSS.escape(id)}"]`);
  const t = history.find(x => x.id === id); if (!item || !t) return;
  const titleEl = item.querySelector('.sb-item-title'); if (!titleEl) return;
  const input = el('input', 'sb-rename-input'); input.value = t.title || '';
  titleEl.replaceWith(input); input.focus(); input.select();
  let done = false;
  const commit = (save) => {
    if (done) return; done = true;
    if (save) { const v = input.value.trim(); if (v) { t.title = v; saveHistory(history); } }
    renderHistoryList();
  };
  input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(true); } else if (e.key === 'Escape') { e.preventDefault(); commit(false); } };
  input.onblur = () => commit(true);
  input.onclick = (e) => e.stopPropagation();
}
function deleteThread(id) {
  const t = history.find(x => x.id === id);
  if (!confirm(`Delete "${t?.title || 'Untitled'}"? This can't be undone.`)) return;
  history = history.filter(x => x.id !== id);
  if (currentThread && currentThread.id === id) currentThread = null;
  saveHistory(history); renderHistoryList();
}
function clearHistory() {
  if (!history.length) { toast('History is already empty'); return; }
  if (!confirm(`Delete all ${history.length} saved conversation${history.length === 1 ? '' : 's'}? This can't be undone.`)) return;
  history = []; currentThread = null; saveHistory(history); renderHistoryList(); toast('History cleared');
}
function newChat() {
  if ((order.length || Object.keys(results).length) && cfg.private) {
    if (!confirm("Private mode is on — this chat isn't saved. Start a new one?")) return;
  }
  resetApp(); currentThread = null; renderHistoryList(); closeSidebar();
}
function togglePrivate() {
  cfg.private = !cfg.private; persist(); updatePrivateUI();
  toast(cfg.private ? "Private mode on — new chats won't be saved" : 'Private mode off');
}
function updatePrivateUI() {
  const sw = $('privateSwitch'); if (sw) { sw.classList.toggle('on', cfg.private); sw.setAttribute('aria-checked', String(cfg.private)); }
  const badge = $('privateBadge'); if (badge) badge.hidden = !cfg.private;
}

// Restore a saved conversation — rebuild its tabs + transcript, ready to continue.
function restoreThread(id) {
  const t = history.find(x => x.id === id); if (!t) return;
  cfg.selections = (t.selections || []).map(s => ({ id: s.id, provider: s.provider, model: s.model }));
  persist();
  Object.keys(convos).forEach(k => delete convos[k]);
  results = {}; order = []; runStatus = {}; consensusPhase = ''; lastConsensusText = ''; lastConsensusProvenance = null;
  $('tabBar').innerHTML = ''; $('tabPanels').innerHTML = ''; activeTab = null;
  currentThread = t;
  buildChips();
  hideGreeting();
  // Build tabs for every model this thread actually talked to, not just the ones
  // sels() currently considers "answering" — a restored chat can reference a
  // provider the browser no longer has a key for (cleared keys, new device,
  // imported history), and its past replies should still be readable.
  ensureTabs(cfg.selections);
  const lastTurn = (t.turns || []).length > 0 ? t.turns[t.turns.length - 1] : null;
  (t.turns || []).forEach(turn => {
    (t.selections || []).forEach(sel => {
      const ans = turn.answers ? turn.answers[sel.id] : undefined;
      const co = getConvo(sel.id);
      co.push({ role: 'user', content: turn.prompt });
      if (ans != null) co.push({ role: 'assistant', content: ans });
      renderStaticPair(sel.id, selectionLabel(sel), turn.prompt, ans, turn.attachments);
    });
    if (turn.consensus != null) {
      renderStaticConsensus(turn.prompt, turn.consensus);
      // Restore the "How this was formed" panel for EARLIER turns inline. The last
      // turn's panel is rendered after its snapshot/chips strip below (live order).
      if (turn.provenance && turn !== lastTurn) {
        const cp = $('conv_consensus')?.querySelector('.qa-pair:last-child');
        if (cp) renderProvenancePanel(cp, turn.provenance);
      }
    }
  });
  lastPrompt = t.turns && t.turns.length ? t.turns[t.turns.length - 1].prompt : '';

  // Re-populate live state from the last turn so model snapshot cards, follow-up
  // chips, the re-synthesis strip, AND the provenance panel work on restored
  // conversations just like live ones.
  if (lastTurn && lastTurn.consensus && cfg.consensus) {
    const rSels = (t.selections || []);
    order = rSels.map(s => s.id);
    rSels.forEach(s => { results[s.id] = lastTurn.answers?.[s.id] ?? null; });
    lastConsensusText = lastTurn.consensus;
    lastConsensusProvenance = lastTurn.provenance || null;
    lastSynthesisOrdered = order.filter(id => results[id]).map(id => ({
      selection: selById(id) || { id, provider: 'openai', model: '' },
      text: results[id],
    }));
    lastSynthesisPrompt = lastTurn.prompt;
    applyTabBadges(lastConsensusProvenance);
    const lastConsPair = $('conv_consensus')?.querySelector('.qa-pair:last-child');
    if (lastConsPair) {
      renderModelSnapshotsEl(lastConsPair);
      renderFollowUpChips(lastConsPair, lastConsensusProvenance);
      if (lastSynthesisOrdered.length >= 2)
        renderResynthStrip(lastConsPair, lastSynthesisOrdered, lastSynthesisPrompt, activeStrategy(cfg).id);
      if (lastConsensusProvenance) renderProvenancePanel(lastConsPair, lastConsensusProvenance);
      tryApplyInlineAttribution(lastConsPair);
    }
  }

  if (cfg.consensus && $('tab_consensus')) switchTab('consensus');
  closeSidebar(); renderHistoryList();
}
function renderStaticPair(selId, label, userContent, answerText, attachments) {
  const conv = $('conv_' + selId); if (!conv) return;
  $('empty_' + selId)?.remove();
  const pair = el('div', 'qa-pair');
  pair.innerHTML =
    userMsgHtml(userContent, attachments) +
    `<div class="msg assistant"><div class="msg-head"><span class="msg-label">${escapeHtml(label)}</span>` +
    (answerText == null ? '' : `<button class="copy-btn" title="Copy" aria-label="Copy">${COPY_SVG}</button>`) + `</div>` +
    `<div class="msg-bubble">${answerText == null ? '<span class="msg-error">No response recorded</span>' : renderMarkdown(answerText)}</div></div>`;
  conv.appendChild(pair); scrollBottom(conv);
  if (answerText != null) { highlightBubble(pair); const b = pair.querySelector('.copy-btn'); if (b) b.onclick = () => copyText(answerText, b); }
}
function renderStaticConsensus(prompt, text) {
  if (!$('conv_consensus')) return;
  const prev = lastPrompt; lastPrompt = prompt;
  showConsensusStatic(text, false);
  lastPrompt = prev;
}

// ── What's new (changelog) ──────────────────────────────────────────────────
// The feed is the shell's initWhatsNew() in a rightPanel, rendering the
// generated js/changelog.js (fleet format) instead of fetching changelog.json.
const CHANGELOG_SEEN_KEY = 'polecat_changelog_seen';

// Pre-shell versions stored the newest entry's DATE ('2026-07-04') under the
// seen key; the shell stores the seen VERSION int. Translate once so existing
// users neither lose their read-state nor get a stale unseen dot forever.
function migrateChangelogSeen() {
  const seen = localStorage.getItem(CHANGELOG_SEEN_KEY) || '';
  if (!seen.includes('-')) return;
  const newestDate = (CHANGELOG[0]?.ts || '').slice(0, 10);
  try {
    localStorage.setItem(CHANGELOG_SEEN_KEY, (newestDate && seen >= newestDate) ? String(LATEST_VERSION) : '0');
  } catch { /* storage full — dot may light once, harmless */ }
}
function updateWhatsNewBadge() {
  const dot = $('whatsNewDot'); if (!dot) return;
  dot.hidden = !hasUnseen(CHANGELOG_SEEN_KEY, LATEST_VERSION);
}
function openWhatsNew() {
  closeSidebar();   // mobile drawer would sit under the panel's backdrop
  const body = initWhatsNew({
    entries: CHANGELOG, latest: LATEST_VERSION, storageKey: CHANGELOG_SEEN_KEY,
    labels: { title: 'Polecat keeps getting better' },   // the panel header already says "What's new"
  });
  rightPanel({ title: "What's new", body, onClose: updateWhatsNewBadge });
  updateWhatsNewBadge();
}

// ── Support ─────────────────────────────────────────────────────────────────
function renderDonate() {
  const wrap = $('donateArea'); if (!wrap) return;
  const tiers = ['$1', '$2', '$5', 'More'];
  wrap.innerHTML =
    `<div class="donate-copy">Polecat is free and runs on your own API keys — tips help offset hosting &amp; dev costs. Thank you!</div>` +
    `<div class="donate-row">` + tiers.map(t => `<a class="donate-btn" href="${DONATE_URL}" target="_blank" rel="noopener">${escapeHtml(t)}</a>`).join('') + `</div>`;
}

// ════════════════════════════════════════════════════════════════════════════
//  WELCOME TOUR
// ════════════════════════════════════════════════════════════════════════════
let _wslide = 1; const W_TOTAL = 6;
function showWelcome() {
  _wslide = 1; gotoWelcome(1);
  const wasOpen = $('welcomeOverlay').classList.contains('open');
  $('welcomeOverlay').classList.add('open');
  if (!wasOpen) pushModalFocus($('wClose'));
}
function dismissWelcome(openCfg = false) {
  localStorage.setItem(WELCOME_KEY, '1');
  const wasOpen = $('welcomeOverlay').classList.contains('open');
  $('welcomeOverlay').classList.remove('open');
  if (wasOpen) popModalFocus();
  if (openCfg) { localStorage.setItem(KEYS_NUDGE_KEY, '1'); setTimeout(() => openConfig('keys'), 200); }
  else if (!configuredProviders(cfg).length) { localStorage.setItem(KEYS_NUDGE_KEY, '1'); setTimeout(() => openConfig('keys'), 400); }
}
function welcomeNext() { if (_wslide < W_TOTAL) gotoWelcome(++_wslide, 'forward'); else dismissWelcome(true); }
function welcomeBack() { if (_wslide > 1) gotoWelcome(--_wslide, 'back'); }
function gotoWelcome(n, dir) {
  document.querySelectorAll('.welcome-slide').forEach((s, i) => {
    s.classList.remove('active', 'going-back');
    if (i + 1 === n) { if (dir === 'back') s.classList.add('going-back'); s.classList.add('active'); }
  });
  document.querySelectorAll('.wd').forEach((d, i) => d.classList.toggle('active', i + 1 === n));
  const nxt = $('wNext'); if (nxt) nxt.textContent = n === W_TOTAL ? 'Get Started →' : 'Next →';
  const bk = $('wBack'); if (bk) bk.style.visibility = n > 1 ? 'visible' : 'hidden';
}

// ════════════════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════════════════
// Ask the browser to keep our localStorage (API keys, chats, settings) durable so
// it isn't evicted under storage pressure or inactivity. Best-effort and silent:
// unsupported on some browsers (notably iOS Safari — there, "Add to Home Screen"
// is the durable path). App updates never wipe storage; this guards against the
// browser's own eviction.
function requestPersistentStorage() {
  try {
    const s = navigator.storage;
    if (!s || !s.persist) return;
    Promise.resolve(s.persisted ? s.persisted() : false)
      .then(already => { if (!already) return s.persist(); })
      .catch(() => {});
  } catch { /* no-op */ }
}

// ── Polecat Shell frame ─────────────────────────────────────────────────────
// Builds the fleet-standard frame (rail + topbar + view) and mounts the app's
// own chrome into it. The rail carries the chat furniture (New chat, search,
// history, footer links) instead of section nav — pinned app-owned nodes,
// the same pattern Manager uses for its rail furniture.
let _shell = null;

// The app highlights code with highlight.js's github-dark stylesheet; disable
// it in light mode (theme.js doesn't know about app stylesheets).
function syncHljsTheme() {
  const l = $('hljs-theme'); if (l) l.disabled = (effectiveMode() === 'light');
}

function buildFrame() {
  configureTheme({
    storageKey: 'polecat_theme',   // historical key — kept forever (see config.js)
    defaultTheme: 'polecat:dark',
    palettes: [{ key: 'polecat', label: 'Polecat', hint: 'Warm amber house style' }],
  });
  // The index.html pre-paint snippet normalizes the pre-shell bare 'dark' /
  // 'light' value; repeat here so direct js loads (tests) behave identically.
  const legacy = localStorage.getItem('polecat_theme');
  if (legacy && !legacy.includes(':')) { try { localStorage.setItem('polecat_theme', 'polecat:' + legacy); } catch { /* read-only storage */ } }
  applyTheme();
  syncHljsTheme();

  const holder = $('chromeHolder');
  const logo = holder.querySelector('.logo');
  const wordmark = holder.querySelector('.logo-mark').outerHTML;
  const waffle = appSwitcher(publicFleet().map(a => ({ ...a, icon: shellIcon(a.icon, 20) })), { current: 'chat' });

  _shell = initShell({
    app: { id: 'chat', name: 'Polecat', wordmark },
    sections: [],                          // the chat rail is content, not section nav
    rail: { storageKey: 'polecat.rail' },
    topbar: { left: [logo], right: [$('privateBadge'), $('resetBtn'), waffle] },
  });

  // Rail furniture: New chat + search pinned above the scrolling history;
  // the footer (private mode, What's-new, settings, theme, export…) pinned below.
  const rail = _shell.els.rail;
  const scroll = rail.querySelector('.ps-rail-scroll');
  rail.insertBefore(holder.querySelector('.sb-top'), scroll);
  rail.insertBefore(holder.querySelector('.sb-search-wrap'), scroll);
  rail.insertBefore(holder.querySelector('.sb-section-label'), scroll);
  scroll.append($('sbHistory'));
  rail.append(holder.querySelector('.sb-foot'));
  holder.remove();

  // The chat rail has no icon-only mode — it is always open on desktop (the
  // collapse chevron is hidden in CSS), so a persisted '0' must not strand it shut.
  if (!window.matchMedia(MOBILE_MQ).matches) _shell.setOpen(true);

  // Opening the mobile drawer via the shell's hamburger refreshes the history
  // list + backup nudges, exactly as the old openSidebar() did.
  _shell.els.topbar.querySelector('.ps-topbar-menu')?.addEventListener('click', refreshRailFurniture);

  // The chat surface (transcript + composer) moves into the shell's main view.
  _shell.els.main.append(document.querySelector('.app'));
}

function init() {
  if (typeof marked !== 'undefined') marked.setOptions({ breaks: true, gfm: true });
  buildFrame();
  requestPersistentStorage();
  buildChips();
  $('modelChips').addEventListener('scroll', updateChipsFade, { passive: true });
  window.addEventListener('resize', updateChipsFade);
  $('tabBar').addEventListener('scroll', updateTabBarFade, { passive: true });
  window.addEventListener('resize', updateTabBarFade);
  { const lv = $('logoVer'); if (lv) lv.textContent = buildStamp(); }

  const note = takeMigrationNote();                  // e.g. "Your saved setup carried over"
  if (note) setTimeout(() => toast(note, 4000), 700);

  document.querySelectorAll('.cfg-tab').forEach(b => b.onclick = () => setConfigTab(b.dataset.tab));
  $('configBtn').onclick   = () => openConfig();
  $('closeConfig').onclick = closeConfig;
  $('doneConfig').onclick  = closeConfig;
  $('configModal').onclick = (e) => { if (e.target === $('configModal')) closeConfig(); };
  // Skip if a higher-stacked overlay (e.g. Export, opened from the Keys tab) is
  // showing on top — Escape should close just that overlay first, not both at once.
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('configModal').classList.contains('open') && !document.querySelector('.exp-overlay, .compare-overlay')) closeConfig(); });
  $('tourBtn').onclick = () => { closeConfig(); setTimeout(showWelcome, 200); };

  $('clearKeys').onclick = () => {
    if (!confirm('Remove all saved API keys? (Your model picks and strategies stay.)')) return;
    cfg.providers = {}; persist(); renderKeys(); buildChips(); renderModels(); toast('Keys cleared');
  };

  $('resetBtn').onclick = newChat;

  $('sendBtn').onclick = sendAll;
  $('stopBtn').onclick = stopGeneration;
  // Enter sends on desktop (Shift+Enter = newline); on touch devices Enter makes
  // a newline and the Send button submits. Cmd/Ctrl+Enter always sends.
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  $('promptInput').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (e.metaKey || e.ctrlKey) { e.preventDefault(); sendAll(); return; }
    if (e.shiftKey || e.isComposing) return;           // newline / IME composition
    if (!isTouch) { e.preventDefault(); sendAll(); }    // desktop: plain Enter sends
  });
  $('promptInput').placeholder = isTouch
    ? 'Type your prompt — sent to all selected models at once\nTap ➤ to send · attach images or text files'
    : 'Type your prompt — sent to all selected models at once\nEnter to send · Shift+Enter for new line · paste or drop images / text files';
  autoGrowComposer($('promptInput')); // fit the placeholder hint so it isn't clipped on load
  $('promptInput').addEventListener('input', function () { autoGrowComposer(this); updateSendEnabled(); saveDraft(this.value); });
  // Prompt history recall: ↑ (when empty or already browsing) loads previous prompts;
  // ↓ moves forward; any other edit key exits history mode.
  $('promptInput').addEventListener('keydown', e => {
    const inp = $('promptInput');
    if (e.key === 'ArrowUp') {
      if (inp.value.trim() && _promptHistIdx < 0) return; // not in history mode and input has content
      const hist = loadPromptHistory();
      if (!hist.length) return;
      e.preventDefault();
      if (_promptHistIdx < 0) _promptHistDraft = inp.value; // save current draft
      _promptHistIdx = Math.min(_promptHistIdx + 1, hist.length - 1);
      applyPromptHistory(inp, hist, _promptHistIdx);
    } else if (e.key === 'ArrowDown' && _promptHistIdx >= 0) {
      e.preventDefault();
      _promptHistIdx--;
      applyPromptHistory(inp, loadPromptHistory(), _promptHistIdx);
    } else if (_promptHistIdx >= 0 && e.key !== 'ArrowUp' && e.key !== 'ArrowDown' &&
               e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Meta' && e.key !== 'Alt') {
      _promptHistIdx = -1; // user is editing — exit history mode
    }
  });
  $('sbTheme').onclick = () => { toggleMode(); syncHljsTheme(); };

  // ── Tab bar keyboard navigation (← / → to switch model tabs) ──────────────
  // Implements the ARIA tablist pattern: arrow keys move between tabs while
  // keeping Polecat's multi-model comparison fast to navigate with a keyboard.
  $('tabBar').addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const tabs = [...$('tabBar').querySelectorAll('[role="tab"]')];
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();
    const next = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
    const target = tabs[Math.max(0, Math.min(next, tabs.length - 1))];
    if (target) { target.focus(); switchTab(target.dataset.svc); }
  });

  // ── Attachments: pick · paste · drag-drop ──
  $('attachBtn').onclick = () => $('fileInput').click();
  $('fileInput').onchange = (e) => { addFiles(e.target.files); e.target.value = ''; };
  $('promptInput').addEventListener('paste', (e) => {
    const items = e.clipboardData?.items; if (!items) return;
    const files = [];
    for (const it of items) {
      if (it.kind === 'file' && (it.type.startsWith('image/') || isTextFile({ type: it.type, name: '' }))) {
        const f = it.getAsFile(); if (f) files.push(f);
      }
    }
    if (files.length) { e.preventDefault(); addFiles(files); }
  });
  // Greeting quick-start suggestions → rotating, clickable example questions.
  renderSuggestions();
  startSuggestionRotation();
  // Free-demo CTA (greeting). Hidden if the demo is disabled or already in use.
  const cgTry = $('cgTry');
  const demoActive = !!PROVIDERS.demo && (cfg.selections || []).some(s => s.provider === 'demo');
  if (cgTry) {
    cgTry.hidden = !PROVIDERS.demo || demoActive;
    cgTry.onclick = startFreeDemo;
  }
  { const hint = $('cgHint'); if (hint) hint.hidden = !demoActive; }   // show "pick a question" once demo is active

  // Image lightbox — click any thumbnail to view full-size
  const openLightbox = (src, alt) => {
    const lb = $('lightbox'); $('lightboxImg').src = src; $('lightboxImg').alt = alt || '';
    const wasOpen = lb.classList.contains('open');
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    if (!wasOpen) pushModalFocus($('lightboxClose'));
  };
  const closeLightbox = () => {
    const lb = $('lightbox');
    const wasOpen = lb.classList.contains('open');
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); $('lightboxImg').src = '';
    if (wasOpen) popModalFocus();
  };
  document.addEventListener('click', (e) => {
    const img = e.target.closest('.msg-thumb, .attach-thumb img');
    if (img && img.src) { e.preventDefault(); openLightbox(img.src, img.alt); }
  });
  // User message "Edit" button — copy the prompt back to the composer for editing / resending
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-edit-prompt]');
    if (btn) fillPrompt(btn.dataset.editPrompt);
  });
  // Close any open race-bar tooltip when tapping/clicking elsewhere.
  document.addEventListener('click', (e) => {
    if (e.target.closest('.cs-race-dot')) return;
    document.querySelectorAll('.cs-race-dot.cs-tip-open').forEach(d => d.classList.remove('cs-tip-open'));
  });
  $('lightbox').onclick = (e) => { if (e.target.id !== 'lightboxImg') closeLightbox(); };
  $('lightboxClose').onclick = closeLightbox;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('lightbox').classList.contains('open')) closeLightbox(); });

  const composer = $('composer');
  let dragDepth = 0;
  const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');
  composer.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; composer.classList.add('dragover'); });
  composer.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  composer.addEventListener('dragleave', (e) => { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) composer.classList.remove('dragover'); });
  composer.addEventListener('drop', (e) => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth = 0; composer.classList.remove('dragover'); addFiles(e.dataTransfer.files); });

  // rail (shell) + conversation history
  $('sbNewChat').onclick = newChat;
  $('sbSearch') && ($('sbSearch').oninput = renderHistoryList);
  $('sbExport').onclick = openExport;
  $('sbImport').onclick = openImport;
  $('sbClear').onclick = clearHistory;
  $('sbWhatsNew') && ($('sbWhatsNew').onclick = openWhatsNew);
  $('sbBackupNudgeGo') && ($('sbBackupNudgeGo').onclick = () => { $('sbBackupNudge').hidden = true; openExport(); });
  $('sbBackupNudgeLater') && ($('sbBackupNudgeLater').onclick = () => { $('sbBackupNudge').hidden = true; });
  $('sbIosInstallGo') && ($('sbIosInstallGo').onclick = () => {
    localStorage.setItem(IOS_INSTALL_DISMISS_KEY, '1');
    $('sbIosInstallHint').hidden = true;
    toast('Tap the Share icon, then "Add to Home Screen"', 6000);
  });
  $('sbIosInstallLater') && ($('sbIosInstallLater').onclick = () => { localStorage.setItem(IOS_INSTALL_DISMISS_KEY, '1'); $('sbIosInstallHint').hidden = true; });
  migrateChangelogSeen();
  updateWhatsNewBadge();
  if (!localStorage.getItem(FIRST_USE_KEY)) localStorage.setItem(FIRST_USE_KEY, String(Date.now()));
  $('privateSwitch').onclick = togglePrivate;
  $('privateSwitch').onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); togglePrivate(); } };
  // The rail is persistent on desktop now, so its furniture (history, backup
  // status, nudges) renders at boot — not just when a drawer opens.
  refreshRailFurniture(); updatePrivateUI();

  $('wNext').onclick = welcomeNext; $('wBack').onclick = welcomeBack;
  $('wSkip').onclick = () => dismissWelcome(); $('wClose').onclick = () => dismissWelcome();
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('welcomeOverlay').classList.contains('open')) dismissWelcome(); });
  $('wDonate') && ($('wDonate').onclick = (e) => { e.preventDefault(); window.open(DONATE_URL, '_blank', 'noopener'); });
  { const wt = $('wTryDemo'); if (wt) { wt.hidden = !PROVIDERS.demo; wt.onclick = startFreeDemo; } }

  $('closeShare').onclick = closeShareModal;
  $('shareModal').onclick = (e) => { if (e.target === $('shareModal')) closeShareModal(); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('shareModal').classList.contains('open')) closeShareModal(); });

  $('sbKbd').onclick = openKbd;
  $('closeKbd').onclick = closeKbd;
  $('kbdModal').onclick = (e) => { if (e.target === $('kbdModal')) closeKbd(); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('kbdModal').classList.contains('open')) closeKbd(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      e.preventDefault(); openKbd();
    }
    // 'c' — open the side-by-side compare modal when 2+ model responses exist
    if (e.key === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      const cmpEntries = buildCompareEntries();
      if (cmpEntries.length >= 2) { e.preventDefault(); openCompareModal(cmpEntries); }
    }
    if (e.key === ',' && (e.metaKey || e.ctrlKey) && !e.altKey) { e.preventDefault(); openConfig(); }
    // Escape stops an active generation when no modal/overlay is open.
    if (e.key === 'Escape' && _runCtrl && !_userStopped) {
      const anyOverlay = $('configModal').classList.contains('open') ||
        $('kbdModal').classList.contains('open') ||
        $('shareModal').classList.contains('open') ||
        $('lightbox').classList.contains('open') ||
        $('welcomeOverlay').classList.contains('open') ||
        !!document.querySelector('.compare-overlay, .exp-overlay');
      if (!anyOverlay) { e.preventDefault(); stopGeneration(); }
    }
    // Number keys 1-9 jump to model tabs; 0 jumps to the Consensus tab.
    // Only fires when no input/textarea is focused and no modifier key is held.
    if (/^[0-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      const allTabs = [...($('tabBar')?.querySelectorAll('[role="tab"]') || [])];
      if (!allTabs.length) return;
      let target;
      if (e.key === '0') {
        target = allTabs.find(t => t.dataset.svc === 'consensus');
      } else {
        const modelTabs = allTabs.filter(t => t.dataset.svc !== 'consensus');
        target = modelTabs[parseInt(e.key) - 1];
      }
      if (target) { e.preventDefault(); switchTab(target.dataset.svc); target.focus(); }
    }
  });

  // Restore any draft the user was typing before the page closed/refreshed.
  restoreComposerDraft();
  // Save draft when the tab is hidden (navigation, close) so nothing is lost.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveDraft($('promptInput').value);
    else document.title = DEFAULT_TITLE;
  });

  const hasKeys = configuredProviders(cfg).length > 0 || (cfg.selections || []).some(s => s.provider === 'demo');
  const seen = !!localStorage.getItem(WELCOME_KEY);
  if (location.hash.startsWith('#handoff=')) {
    // Arriving from the old origin's "we moved" stub — apply before anything
    // else can greet the user (this branch also keeps the welcome tour away).
    setTimeout(tryApplyHandoffFromHash, 100);
  } else if (location.hash.startsWith('#share=')) {
    setTimeout(tryShowShareFromHash, 100);
  } else if (location.hash === '#settings') {
    setTimeout(() => openConfig(), 200);   // deep-link to settings
  } else if (!hasKeys && !seen) {
    // Guard against a share link arriving (via hashchange) in the gap before
    // this fires — it must never pop the welcome tour over a shared answer.
    setTimeout(() => { if (!location.hash.startsWith('#share=')) showWelcome(); }, 350);
  } else if (!hasKeys && !localStorage.getItem(KEYS_NUDGE_KEY)) {
    // One-time nudge for a returning visitor who dismissed the welcome tour
    // without adding a key or trying the demo. Without this flag it would
    // re-open Settings on every single reload forever, even right after the
    // user closes it — this fires once, not on every future visit.
    localStorage.setItem(KEYS_NUDGE_KEY, '1');
    setTimeout(() => { if (!location.hash.startsWith('#share=')) openConfig('keys'); }, 400);
  }
  // A same-document hash change (no reload) doesn't re-run init() — e.g. an
  // installed PWA window reused for a new deep link, or a second share link
  // opened in a tab that already has Polecat loaded. Handle #share= links
  // that arrive this way too, so the recipient always sees the shared answer.
  window.addEventListener('hashchange', tryShowShareFromHash);
}
function tryShowShareFromHash() {
  if (!location.hash.startsWith('#share=')) return;
  const data = decodeSharePayload(location.hash.slice(7));
  if (!data) return;
  // A shared link always wins over whatever else was about to greet the
  // visitor (first-run welcome tour, the settings deep-link) — otherwise a
  // higher-stacked overlay can hide the very thing they clicked through for.
  const wasWelcomeOpen = $('welcomeOverlay')?.classList.contains('open');
  $('welcomeOverlay')?.classList.remove('open');
  if (wasWelcomeOpen) popModalFocus();
  closeConfig();
  showShareModal(data);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
