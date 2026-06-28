// ─────────────────────────────────────────────────────────────────────────
// app.js — controller. State is keyed by SELECTION id (a {provider, model}
// instance), so the same provider can appear multiple times (Opus + Sonnet).
// ─────────────────────────────────────────────────────────────────────────
import {
  loadCfg, saveCfg, activeSelections, configuredProviders, providerKey, setProviderKey,
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
import { $, el, escapeHtml, nl2br, renderMarkdown, highlightBubble, toast, applyTheme, currentTheme } from './ui.js';

const DONATE_URL = 'https://ko-fi.com/polecatlive';
const WELCOME_KEY = 'polecat_welcomed';
const CONS_HINT_KEY = 'polecat_cons_hint';
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
let consensusPhase = '';            // '' | 'waiting' | 'arbitrating' | 'done'
let consensusStatusText = '', consensusStepText = '';
let _browseList = [], _browseProvider = '';   // live model-list browse state
let attachments = [];               // [{ id, name, mime, data(base64), dataUrl }] pending on the composer
let _attc = 0;

const persist  = () => saveCfg(cfg);
const sels     = () => activeSelections(cfg);
const selById  = (id) => (cfg.selections || []).find(s => s.id === id);
const getConvo = (id) => (convos[id] ||= []);
const statusKey = (provider, model) => provider + '|' + model;
const statusOf  = (provider, model) => cfg.modelStatus[statusKey(provider, model)];

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
  modal.classList.add('open');
  modal.removeAttribute('aria-hidden');
}
function closeShareModal() {
  const modal = $('shareModal');
  if (modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
  if (location.hash.startsWith('#share=')) history.replaceState(null, '', location.pathname);
}
function openKbd() { const m = $('kbdModal'); if (m) { m.classList.add('open'); m.removeAttribute('aria-hidden'); } }
function closeKbd() { const m = $('kbdModal'); if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); } }
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
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
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
  const truncated = text.length > MAX_TEXT_CHARS;
  if (truncated) text = text.slice(0, MAX_TEXT_CHARS);
  return { id, name: file.name || 'document.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    kind: 'text', size: file.size, textContent: text, truncated, docType: 'docx' };
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
      : fmtBytes(a.size);
    const tipText = a.mime === 'application/pdf' && a.pageCount
      ? `${escapeHtml(a.name)} · ${a.pageCount} pages extracted${a.truncated ? ' (truncated)' : ''}`
      : a.docType === 'pptx' && a.slideCount != null
      ? `${escapeHtml(a.name)} · ${a.slideCount} slides extracted${a.truncated ? ' (truncated)' : ''}`
      : a.docType === 'xlsx' && a.sheetCount != null
      ? `${escapeHtml(a.name)} · ${a.sheetCount} sheets extracted${a.truncated ? ' (truncated)' : ''}`
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
        parts.push(`Context: ~${kChars} chars extracted <span class="vn-warn">— over ${budgetK}k limit; oldest files will be trimmed on send</span>`);
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
    chip.style.setProperty('--c', p.color);
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
}
function ensureTabs() {
  const tabBar = $('tabBar'), panels = $('tabPanels');

  // consensus tab respects the toggle
  if (!cfg.consensus) {
    $('tab_consensus')?.remove(); $('panel_consensus')?.remove();
    if (activeTab === 'consensus') activeTab = null;
  }

  sels().forEach(sel => {
    if ($('tab_' + sel.id)) return;
    const p = PROVIDERS[sel.provider];
    const btn = el('button', 'tab');
    btn.id = 'tab_' + sel.id; btn.dataset.svc = sel.id;
    btn.setAttribute('role', 'tab'); btn.setAttribute('aria-selected', 'false');
    btn.onclick = () => switchTab(sel.id);
    btn.innerHTML =
      `<span class="tab-dot" id="tdot_${sel.id}" style="background:${p.color};--dot-c:${p.color}"></span>` +
      `<div class="tab-inner"><span class="tab-label">${escapeHtml(selectionLabel(sel))}</span><span class="tab-stance" id="tstance_${sel.id}" hidden></span></div>`;
    tabBar.insertBefore(btn, $('tab_consensus') || null);

    const panel = el('div', 'tab-panel');
    panel.id = 'panel_' + sel.id;
    panel.setAttribute('role', 'tabpanel');
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
    btn.onclick = () => switchTab('consensus');
    btn.innerHTML =
      `<span class="tab-dot" id="tdot_consensus" style="background:var(--consensus);--dot-c:var(--consensus)"></span>` +
      `<div class="tab-inner">Consensus<span class="tab-step" id="consensus-tab-step"></span><span class="tab-agree-badge" id="consensus-agree-badge" hidden></span></div>`;
    tabBar.appendChild(btn);

    const panel = el('div', 'tab-panel');
    panel.id = 'panel_consensus';
    panel.setAttribute('role', 'tabpanel');
    panel.innerHTML =
      `<div class="conversation" id="conv_consensus"><div class="empty-state" id="empty_consensus">` +
      `<div class="empty-icon consensus-glyph"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="5.6" y1="5.6" x2="7.8" y2="7.8"/><line x1="16.2" y1="16.2" x2="18.4" y2="18.4"/><line x1="5.6" y1="18.4" x2="7.8" y2="16.2"/><line x1="16.2" y1="7.8" x2="18.4" y2="5.6"/></svg></div>` +
      `<div id="consensus-status">Consensus appears here after all models respond</div></div></div>`;
    panels.appendChild(panel);
  }
  if ((!activeTab || !$('tab_' + activeTab)) && sels().length) switchTab(sels()[0].id);
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
    `</div>`;
}
function assistantPair(label, userContent, images) {
  const pair = el('div', 'qa-pair');
  pair.innerHTML =
    userMsgHtml(userContent, images) +
    `<div class="msg assistant"><div class="msg-head"><span class="msg-label">${escapeHtml(label)}</span>` +
    `<span class="msg-time" hidden></span>` +
    `<button class="copy-btn" title="Copy" hidden>${COPY_SVG}</button></div>` +
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
function finishBubble(pair, full) {
  const bubble = pair.querySelector('.msg.assistant .msg-bubble');
  const copyBtn = pair.querySelector('.copy-btn');
  if (!full) { bubble.textContent = '(no response)'; return; }
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
    const gen = makeGen(sel, co, cfg);
    bubble.innerHTML = '';
    // Don't auto-follow while streaming — the question is pinned to the top and
    // the answer grows below it, so the reader keeps their place (Gemini-style).
    for await (const chunk of gen) { full += chunk; bubble.innerHTML = renderMarkdown(full); }
    finishBubble(pair, full);
    if (full) {
      setMsgTime(pair, performance.now() - t0);
      addRegenBtn(sel, pair);
    }
    co.push({ role: 'assistant', content: full });
    markRun(sel.id, 'done');
    return full;
  } catch (err) {
    const msg = err?.name === 'AbortError' ? 'Request timed out' : err.message;
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
    for await (const chunk of gen) { full += chunk; bubble.innerHTML = renderMarkdown(full); }
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
    const msg = err?.name === 'AbortError' ? 'Request timed out' : err.message;
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
  t.value = q; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 200) + 'px';
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
    else if (tf.docType === 'docx') typeHint = 'Word document';
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
  if (!list.length) { openConfig('models'); return; }

  lastPrompt = text; results = {}; order = []; lastConsensusText = ''; lastConsensusProvenance = null;
  runStatus = {}; list.forEach(s => runStatus[s.id] = 'pending');
  consensusPhase = 'waiting'; consensusStatusText = ''; consensusStepText = '';
  $('promptInput').value = ''; $('promptInput').style.height = 'auto';
  clearAttachments();
  $('sendBtn').disabled = true;
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

    if (cfg.consensus) {
      setConsensusDot(true);
      await runConsensus();
      setConsensusDot(false); setConsensusStep('');
      maybeShowConsHint();
    }
    recordTurn(text, readyAtts);
  } finally {
    document.body.classList.remove('processing');
    setChipsDisabled(false); updateSendEnabled();
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
  currentThread.turns.push({ prompt, answers, attachments: attMeta, consensus: cfg.consensus ? (lastConsensusText || null) : null });
  currentThread.updatedAt = Date.now();
  saveHistory(history);
  renderHistoryList();
}

function resetApp() {
  Object.keys(convos).forEach(k => delete convos[k]);
  lastPrompt = ''; results = {}; order = [];
  runStatus = {}; consensusPhase = ''; consensusStatusText = ''; consensusStepText = '';
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
    `<span>${escapeHtml(String(doneIds.length))} of ${escapeHtml(String(order.length))} responded ` +
    `— <strong>${label}</strong> so far</span>` +
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
  const arbiterLabel = (aId && aId !== 'auto' && selById(aId)) ? selectionLabel(selById(aId)) : 'auto (strategy default)';
  const phaseLine = consensusPhase === 'arbitrating'
    ? (consensusStatusText || 'Synthesizing…')
    : `Waiting for models — ${done}/${total} responded${failed ? `, ${failed} failed` : ''}…`;

  const modelsHtml = ids.map(s => {
    const st = runStatus[s.id];
    return `<li class="cp-model cp-${st}"><span class="cp-dot" style="--c:${PROVIDERS[s.provider].color}"></span>` +
      `<span class="cp-name">${escapeHtml(selectionLabel(s))}</span><span class="cp-stat">${STAT_SVG[st] || ''}</span></li>`;
  }).join('');

  const teaserHtml = done >= 2 ? liveAgreementHtml() : '';
  box.innerHTML =
    `<div class="cp-glyph"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="5.6" y1="5.6" x2="7.8" y2="7.8"/><line x1="16.2" y1="16.2" x2="18.4" y2="18.4"/><line x1="5.6" y1="18.4" x2="7.8" y2="16.2"/><line x1="16.2" y1="7.8" x2="18.4" y2="5.6"/></svg></div>` +
    `<div class="cp-title">Building consensus</div>` +
    `<div class="cp-strategy">${escapeHtml(strat.name)} · arbiter: ${escapeHtml(arbiterLabel)}</div>` +
    `<div class="cp-phase">${escapeHtml(phaseLine)}</div>` +
    `<ul class="cp-models">${modelsHtml}</ul>` +
    teaserHtml +
    (consensusStepText ? `<div class="cp-step">${escapeHtml(consensusStepText)}…</div>` : '');
}
async function getSilentText(sel, messages) {
  let text = '';
  for await (const chunk of makeGen(sel, messages, cfg)) text += chunk;
  return text;
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
      `style="--c:${PROVIDERS[s.provider].color}" ` +
      `title="${isArb ? 'Final arbiter — wrote this consensus. ' : ''}Open ${escapeHtml(label)}'s full answer">` +
      `<span class="cs-dot"></span>${escapeHtml(label)}${isArb ? ' ' + ARB_ICON : ''}</button>`;
  }).join('');
  const wrap = el('div', 'consensus-sources');
  wrap.innerHTML =
    `<span class="cs-label">${BLEND_SVG} Blended from ${contributors.length} models · ${escapeHtml(strat.name)}</span>` +
    `<div class="cs-chips">${chips}</div>`;
  wrap.querySelectorAll('.cs-chip').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
  return wrap;
}

async function streamToConsensus(sel, messages) {
  const conv = $('conv_consensus');
  consensusPhase = 'done'; $('consensus-progress')?.remove(); $('empty_consensus')?.remove();
  const pair = assistantPair('Consensus', lastPrompt);
  conv.appendChild(pair); scrollPairToTop(conv, pair);
  const bubble = pair.querySelector('.msg.assistant .msg-bubble');
  let full = '';
  bubble.innerHTML = '';
  const t0 = performance.now();
  for await (const chunk of makeGen(sel, messages, cfg)) { full += chunk; bubble.innerHTML = renderMarkdown(full); }
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
    `<div class="msg user"><span class="msg-label">You</span><div class="msg-bubble">${nl2br(lastPrompt)}</div></div>` +
    `<div class="msg assistant"><div class="msg-head"><span class="msg-label">Consensus</span>` +
    (isError ? '' : `<button class="copy-btn" title="Copy">${COPY_SVG}</button><button class="copy-btn share-btn" title="Share this consensus" aria-label="Share this consensus">${SHARE_SVG}</button><button class="copy-btn copy-md-btn" title="Copy thread as markdown" aria-label="Copy thread as markdown">${COPY_MD_SVG}</button>`) + `</div>` +
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
    labelOf: (sel) => selectionLabel(sel),
    silent: (sel, msgs) => getSilentText(sel, msgs),
    stream: (sel, msgs) => streamToConsensus(sel, msgs),
    status: setConsensusStatus,
    step: setConsensusStep,
    showStatic: (t) => showConsensusStatic(t, false),
    fail: (t) => showConsensusStatic(t, true),
    provenanceEnabled: cfg.arbitration.provenance !== false,
    provenance: (data) => onProvenance(data),
  });
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

  const barsHtml = prov.perModel.map(m => {
    const color = getModelColor(m);
    const mismatchTip = m.mismatch ? ' title="Estimated contribution differs noticeably from measured overlap"' : '';
    const stanceCls = { aligned: 'prov-aligned', partial: 'prov-partial', outlier: 'prov-outlier' }[m.stance] || 'prov-partial';
    return `<div class="prov-bar-row">` +
      `<span class="prov-model-dot" style="background:${escapeHtml(color)}"></span>` +
      `<span class="prov-model-name" title="${escapeHtml(m.label)}">${escapeHtml(m.label)}</span>` +
      `<div class="prov-bar-track"><div class="prov-bar-fill" style="width:${m.contributionPct}%;background:${escapeHtml(color)}"></div></div>` +
      `<span class="prov-pct"${mismatchTip}>${m.contributionPct}%${m.mismatch ? '<span class="prov-mismatch" aria-hidden="true">~</span>' : ''}</span>` +
      `<span class="prov-stance ${stanceCls}">${escapeHtml(m.stance)}</span>` +
      `</div>`;
  }).join('');

  let agreesHtml = '';
  if (!isLocal && prov.agreements && prov.agreements.length) {
    agreesHtml = `<div class="prov-agrees">${prov.agreements.slice(0, 4).map(a => `<div class="prov-agree-item"><span class="prov-agree-check">${CHECK_SM_SVG}</span>${escapeHtml(a)}</div>`).join('')}</div>`;
  }

  let disagreeHtml = '';
  if (prov.disagreements && prov.disagreements.length) {
    const items = prov.disagreements.map(d =>
      `<div class="prov-dis-item"><div class="prov-dis-point">${escapeHtml(d.point)}</div>` +
      (d.positions && d.positions.length
        ? `<ul class="prov-dis-pos">${d.positions.map(p => `<li><b>${escapeHtml(p.model)}:</b> ${escapeHtml(p.claim)}</li>`).join('')}</ul>`
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

  const panel = el('div', 'provenance-panel');
  panel.innerHTML =
    `<button class="prov-toggle" aria-expanded="false" aria-controls="prov-body-${pair.id || ''}">` +
    `<span class="prov-toggle-icon" aria-hidden="true">${CHEV_R}</span>` +
    `<span class="prov-toggle-label">How this was formed</span>` +
    (agreeLevel ? `<span class="prov-badge ${agreeLevel.cls}">${escapeHtml(agreeLevel.label)}</span>` : '') +
    (isLocal ? `<span class="prov-badge prov-local" title="Contribution estimated from text overlap — no extra model call">measured</span>` : '') +
    `</button>` +
    `<div class="prov-body" hidden>` +
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
    const s = raw.trim().replace(/^[-*•>|\d.)]+\s*/, '').trim();
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
      return {
        id, label, color: PROVIDERS[sel.provider]?.color || '#888',
        time, preview, wordCount,
        rawText: results[id],   // captured at render time for the copy button
        stance: pm?.stance || null,
        distinctiveClaim,
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
  body.innerHTML = entries.map(e => {
    const stanceCls = { aligned: 'ms-aligned', partial: 'ms-partial', outlier: 'ms-outlier' }[e.stance] || '';
    const wc = e.wordCount > 20 ? `~${Math.round(e.wordCount / 10) * 10}w` : '';
    const metaParts = [];
    if (e.stance) metaParts.push(`<span class="ms-stance ${stanceCls}">${escapeHtml(e.stance)}</span>`);
    if (wc) metaParts.push(`<span class="ms-wc">${escapeHtml(wc)}</span>`);
    const claimSnippet = e.distinctiveClaim
      ? `<div class="ms-distinct"><span class="ms-distinct-label">Distinct take</span>${escapeHtml(e.distinctiveClaim.length > 110 ? e.distinctiveClaim.slice(0, 107) + '…' : e.distinctiveClaim)}</div>`
      : '';
    return `<div class="ms-card" data-tab="${escapeHtml(e.id)}" style="--ms-c:${escapeHtml(e.color)}" role="listitem" tabindex="0" aria-label="Open ${escapeHtml(e.label)}'s full reply">` +
      `<div class="ms-card-head">` +
      `<span class="ms-dot" aria-hidden="true"></span>` +
      `<span class="ms-label">${escapeHtml(e.label)}</span>` +
      (e.time ? `<span class="ms-time">${escapeHtml(e.time)}</span>` : '') +
      `<button class="ms-copy-btn" title="Copy ${escapeHtml(e.label)}'s full response" aria-label="Copy ${escapeHtml(e.label)}'s response">${COPY_SVG}</button>` +
      `</div>` +
      (metaParts.length ? `<div class="ms-meta-row">${metaParts.join('')}</div>` : '') +
      `<div class="ms-card-text">${escapeHtml(e.preview)}</div>` +
      claimSnippet +
      `<span class="ms-read-hint" aria-hidden="true">Full reply →</span>` +
      `</div>`;
  }).join('');

  body.querySelectorAll('.ms-card').forEach((card, i) => {
    const capturedText = entries[i]?.rawText || '';
    const copyBtn = card.querySelector('.ms-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyText(capturedText, copyBtn);
      });
    }
    card.onclick = () => switchTab(card.dataset.tab);
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
  assistantMsg.appendChild(wrap);
}

// ── Follow-up question chips ────────────────────────────────────────────────
// Derive 2–3 follow-up chips from provenance (disagreements, notable claims).
// When an outlier model exists, names it explicitly so the user can probe that
// specific disagreement. Falls back to generic questions when provenance is absent.
function deriveFollowUps(prov) {
  const chips = [];
  // If one model took a clearly different position, call it out by name
  if (prov?.perModel) {
    const outlier = prov.perModel.find(m => m.stance === ‘outlier’);
    if (outlier?.label) {
      const name = outlier.label.length > 28 ? outlier.label.slice(0, 25) + ‘…’ : outlier.label;
      chips.push(`What’s strongest about ${name}’s different take?`);
    }
  }
  if (prov?.disagreements?.length) {
    const point = (prov.disagreements[0].point || ‘’).trim();
    if (point) {
      const s = point.length > 66 ? point.slice(0, 63) + ‘…’ : point;
      chips.push(‘Settle the debate: ‘ + s);
    }
  }
  if (prov?.notable?.length) {
    const claim = (prov.notable[0].claim || ‘’).trim();
    if (claim) {
      const s = claim.length > 60 ? claim.slice(0, 57) + ‘…’ : claim;
      chips.push(‘Tell me more: “’ + s + ‘”’);
    }
  }
  const fallbacks = [
    ‘What are the strongest counterarguments to this?’,
    ‘Give me a concrete real-world example.’,
    ‘What\’s the most important nuance here?’,
    ‘Explain this more simply.’,
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
    chips.map(q => `<button class="followup-chip" data-q="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join('') +
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
  if (!alternatives.length) return;
  const wrap = el('div', 'resynth-strip');
  wrap.innerHTML =
    '<span class="resynth-label">Try another synthesis</span>' +
    '<div class="resynth-pills">' +
    alternatives.map(s =>
      `<button class="resynth-pill" data-strat="${escapeHtml(s.id)}" title="${escapeHtml(s.description)}">${escapeHtml(s.name)}</button>`
    ).join('') +
    '</div>';
  wrap.querySelectorAll('.resynth-pill').forEach(btn => {
    btn.onclick = () => rerunConsensusWith(orderedSnapshot, promptSnapshot, btn.dataset.strat);
  });
  assistantMsg.appendChild(wrap);
}

// Re-run consensus arbitration using a captured snapshot of model responses +
// the original prompt, but a different synthesis strategy. Produces a new
// consensus qa-pair in the Consensus tab without re-calling the AI models.
async function rerunConsensusWith(capturedOrdered, capturedPrompt, strategyId) {
  if (!capturedOrdered || capturedOrdered.length < 2) { toast('Need 2+ model responses to re-synthesize'); return; }
  const strategy = allStrategies(cfg).find(s => s.id === strategyId);
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
      labelOf: sel => selectionLabel(sel),
      silent: (sel, msgs) => getSilentText(sel, msgs),
      stream:  (sel, msgs) => streamToConsensus(sel, msgs),
      status: setConsensusStatus,
      step: setConsensusStep,
      showStatic: t => showConsensusStatic(t, false),
      fail: t => showConsensusStatic(t, true),
      provenanceEnabled: cfg.arbitration.provenance !== false,
      provenance: data => onProvenance(data),
    });
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
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  ov.onclick = (e) => { if (e.target === ov) close(); };
  document.getElementById('cmpClose' + uid).onclick = close;
  document.addEventListener('keydown', onKey);
  setTimeout(() => document.getElementById('cmpClose' + uid)?.focus(), 60);
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

// EPIC 1 · P1 — receive the arbiter's machine-readable agreement map. Stamped
// on the consensus pair and rendered as the provenance panel immediately after.
// Also triggers P4: computes paragraph attribution and wires the toggle button.
function onProvenance(data) {
  lastConsensusProvenance = data || null;
  const pair = $('conv_consensus')?.querySelector('.qa-pair:last-child');
  if (!pair) return;
  pair._provenance = lastConsensusProvenance;

  // Update Consensus tab with an agreement signal badge — visible at a glance.
  const _agreeBadge = $('consensus-agree-badge');
  if (_agreeBadge) {
    const _sig = lastConsensusProvenance?.agreementSignal;
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
  if (lastConsensusProvenance?.perModel) {
    const stanceById = {}, stanceByLabel = {};
    lastConsensusProvenance.perModel.forEach(m => {
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

  // P4 — Inline attribution (no extra model call, runs synchronously)
  if (!lastConsensusText) return;
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

// ════════════════════════════════════════════════════════════════════════════
//  MODEL TESTING (Hybrid: auto on add/select + "Test all" button; cached)
// ════════════════════════════════════════════════════════════════════════════
function refreshModelBadges() {
  if ($('configModal').classList.contains('open')) renderSelList();   // don't nuke the add-row/browse panel
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
  keyed.forEach(pid => PROVIDERS[pid].models.forEach(m => add(pid, m.value)));
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
function statusGlyph(provider, model) {
  const st = statusOf(provider, model);
  if (!st) return '';
  if (st.testing) return '⋯ ';
  return st.ok ? '✓ ' : '✗ ';
}

// ════════════════════════════════════════════════════════════════════════════
//  SETTINGS MODAL  (tabs: Models · Keys · Consensus · Support)
// ════════════════════════════════════════════════════════════════════════════
const VALID_TABS = new Set(['models', 'keys', 'consensus', 'support']);
function setConfigTab(name) {
  cfg.ui.lastTab = name; persist();
  document.querySelectorAll('.cfg-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.cfg-section').forEach(s => s.classList.toggle('active', s.dataset.tab === name));
  $('modal')?.scrollTo?.(0, 0);
}
function openConfig(tab) {
  renderModels(); renderKeys(); renderArbitration(); renderDonate(); renderSystemPrompt();
  const stored = cfg.ui.lastTab;
  setConfigTab(tab || (VALID_TABS.has(stored) ? stored : 'models'));
  $('configModal').classList.add('open');
}
function closeConfig() { $('configModal').classList.remove('open'); }

// One-tap free demo: select TWO fast, free models + a light consensus so the
// cross-model magic is obvious, then keep the clickable example questions up.
const DEMO_STARTER_MODELS = ['meta-llama/llama-3.3-70b-instruct:free', 'google/gemma-4-31b-it:free'];
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
  localStorage.setItem(WELCOME_KEY, '1'); $('welcomeOverlay')?.classList.remove('open');
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
  return st.ok ? `<span class="sel-status ok" title="Available">✓</span>`
               : `<span class="sel-status bad" title="${escapeHtml(st.error || 'Unavailable')}">✗</span>`;
}
function renderModels() { renderSelList(); renderAddRow(); }
function renderSelList() {
  const list = $('selList'); if (!list) return;
  list.innerHTML = '';
  (cfg.selections || []).forEach(sel => {
    const p = PROVIDERS[sel.provider]; if (!p) return;
    const ready = p.noKey || !!providerKey(cfg, sel.provider);
    const row = el('div', 'sel-row' + (ready ? '' : ' needs-key'));
    const vision = modelSupportsVision(sel.provider, sel.model);
    const readyBadge = p.noKey
      ? `<span class="sel-free" title="No key needed — runs through the free demo">free</span>`
      : statusBadge(sel.provider, sel.model);
    row.innerHTML =
      `<span class="sel-dot" style="background:${p.color}"></span>` +
      `<span class="sel-name">${escapeHtml(p.short)}</span>` +
      `<select class="field-input sel-model"></select>` +
      (vision ? `<span class="sel-vision" title="Reads images">${EYE_SVG_SM}</span>` : '') +
      (ready ? readyBadge : `<span class="sel-warn" title="Add a ${escapeHtml(p.name)} key in the Keys tab">no key</span>`) +
      `<button class="sel-x" title="Remove">×</button>`;
    const select = row.querySelector('.sel-model');
    select.innerHTML = modelOptionsHtml(sel.provider, sel.model);
    select.onchange = () => onSelModelChange(sel.id, sel.provider, select);
    const badge = row.querySelector('.sel-status');
    if (badge) badge.onclick = () => testOne(sel.provider, sel.model);
    row.querySelector('.sel-x').onclick = () => removeSelection(sel.id);
    list.appendChild(row);
  });
  if (!(cfg.selections || []).length)
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
  if (viaAddBtn) renderModels(); else renderSelList();        // browse: keep the panel open
  if (providerKey(cfg, provider)) testOne(provider, model);   // auto-test on add
  else toast(`Added — add a ${PROVIDERS[provider].name} key to use it`);
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
    const card = el('div', 'demo-card');
    card.innerHTML =
      `<div class="demo-card-head"><span class="demo-spark">${STAR_SVG}</span><b>No key? Try it free.</b></div>` +
      `<div class="demo-card-sub">Run a free model through Polecat right now — no signup, no key. ` +
      `When you're ready, add your own free key below for unlimited use &amp; more models.</div>` +
      `<button class="btn btn-solid demo-go" id="demoGoKeys">Try it free — no setup</button>`;
    wrap.appendChild(card);
    card.querySelector('#demoGoKeys').onclick = () => startFreeDemo();
  }
  PROVIDER_IDS.forEach(id => {
    const p = PROVIDERS[id];
    if (p.noKey) return;                       // demo needs no key field
    const has = !!providerKey(cfg, id);
    const tier = KEY_TIER[id] || '';
    const field = el('div', 'key-field');
    field.innerHTML =
      `<div class="key-head"><span class="svc-dot" style="background:${p.color}"></span>` +
      `<span class="key-name">${escapeHtml(p.name)}</span>` +
      `<span class="key-tier ${tier === 'Paid' ? 'paid' : 'free'}">${escapeHtml(tier)}</span>` +
      `<span class="key-status ${has ? 'on' : ''}">${has ? '● connected' : '○ no key'}</span></div>` +
      `<input type="password" class="field-input" id="key_${id}" placeholder="${escapeHtml(p.placeholder)}" autocomplete="off" value="${escapeHtml(providerKey(cfg, id))}">` +
      `<span class="field-hint">Key at <a href="${p.keyUrl}" target="_blank" rel="noopener">${escapeHtml(p.keyLabel)}</a>${p.rateNote ? ' · ' + escapeHtml(p.rateNote) : ''}</span>`;
    const input = field.querySelector('input');
    input.oninput  = () => { setProviderKey(cfg, id, input.value.trim()); persist(); };
    input.onchange = () => { buildChips(); const f = field.querySelector('.key-status'); const on = !!input.value.trim(); f.textContent = on ? '● connected' : '○ no key'; f.classList.toggle('on', on); };
    wrap.appendChild(field);
  });
  // Export / Import lives here — it's about your keys + overall setup
  const actions = el('div', 'key-actions');
  actions.innerHTML = `<span class="mini-note">Move your whole setup between browsers or devices</span><span class="arb-spacer"></span><button class="btn btn-ghost" id="cfgExport">Export…</button><button class="btn btn-ghost" id="cfgImport">Import…</button>`;
  wrap.appendChild(actions);
  $('cfgExport').onclick = openExport;
  $('cfgImport').onclick = openImport;
}

// ── Arbitration tab ───────────────────────────────────────────────────────
function renderArbitration() {
  const wrap = $('arbControls');
  const strat = activeStrategy(cfg);
  const on = cfg.consensus !== false;
  const provOn = cfg.arbitration.provenance !== false;
  const editable = !strat.builtin;

  const stratOpts = allStrategies(cfg).map(s =>
    `<option value="${escapeHtml(s.id)}"${s.id === strat.id ? ' selected' : ''}>${escapeHtml(s.name)}${s.builtin ? '' : ' (custom)'}</option>`).join('');
  const arbiterOpts = [`<option value="auto"${cfg.arbitration.arbiter === 'auto' ? ' selected' : ''}>Auto (strategy default)</option>`]
    .concat((cfg.selections || []).map(s => `<option value="${s.id}"${cfg.arbitration.arbiter === s.id ? ' selected' : ''}>${escapeHtml(selectionLabel(s))}</option>`)).join('');
  const promptFields = Object.entries(strat.prompts || {}).map(([k, v]) =>
    `<label class="arb-plabel">${escapeHtml(k)}</label><textarea class="field-input arb-ptext" data-key="${escapeHtml(k)}" rows="4"${editable ? '' : ' readonly'}>${escapeHtml(v)}</textarea>`).join('');

  wrap.innerHTML =
    `<label class="switch-row"><span><b>Consensus answer</b><br><span class="switch-sub">Off = individual model tabs only, no combined answer</span></span>` +
      `<span class="switch ${on ? 'on' : ''}" id="consensusSwitch" role="switch" aria-checked="${on}" tabindex="0"><span class="knob"></span></span></label>` +
    `<div class="arb-body"${on ? '' : ' aria-disabled="true"'}>` +
      `<label class="mini-label">Strategy <span class="mini-note">how the combined answer is produced</span></label><select class="field-input" id="arbSelect">${stratOpts}</select>` +
      `<div class="arb-desc">${escapeHtml(strat.description || '')}</div>` +
      `<label class="switch-row"><span><b>Agreement map</b><br><span class="switch-sub">After each answer, show how much the models agreed and what each contributed</span></span>` +
        `<span class="switch ${provOn ? 'on' : ''}" id="provSwitch" role="switch" aria-checked="${provOn}" tabindex="0"><span class="knob"></span></span></label>` +
      `<label class="mini-label">Arbiter model <span class="mini-note">synthesizes the final answer — defaults to the strategy's recommendation</span></label><select class="field-input" id="arbiterSelect">${arbiterOpts}</select>` +
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
  $('arbiterSelect').onchange = (e) => { cfg.arbitration.arbiter = e.target.value; persist(); };
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
  const close = () => ov.remove();
  ov.onclick = (e) => { if (e.target === ov) close(); };
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

// ════════════════════════════════════════════════════════════════════════════
//  SIDEBAR + CONVERSATION HISTORY
// ════════════════════════════════════════════════════════════════════════════
function openSidebar() { renderHistoryList(); $('sidebar').classList.add('open'); $('sidebarBackdrop').classList.add('open'); }
function closeSidebar() { $('sidebar').classList.remove('open'); $('sidebarBackdrop').classList.remove('open'); }
function toggleSidebar() { $('sidebar').classList.contains('open') ? closeSidebar() : openSidebar(); }

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
    wrap.innerHTML = `<div class=”sb-empty”>No conversations yet.<br>Your chats are saved here, on this device.</div>`;
    return;
  }
  const q = (search?.value || '').toLowerCase().trim();
  const items = history.filter(t => historyMatches(t, q))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updatedAt || 0) - (a.updatedAt || 0));
  if (!items.length) { wrap.innerHTML = `<div class=”sb-empty”>No matches for “${escapeHtml(q)}”.</div>`; return; }
  const itemHtml = (t) => {
    const tSels = (t.selections || []).slice(0, 5);
    const dotsHtml = tSels.length > 1
      ? `<span class=”sb-model-dots”>${tSels.map(s => `<span class=”sb-model-dot” style=”background:${escapeHtml(PROVIDERS[s.provider]?.color || '#888')}” title=”${escapeHtml(selectionLabel(s))}”></span>`).join('')}${t.selections.length > 5 ? `<span class=”sb-model-dot-more”>+${t.selections.length - 5}</span>` : ''}</span>`
      : '';
    return `<div class=”sb-item${currentThread && currentThread.id === t.id ? ' active' : ''}${t.pinned ? ' pinned' : ''}” data-id=”${escapeHtml(t.id)}”>` +
    `<div class=”sb-item-main”><div class=”sb-item-title”>${t.pinned ? '<span class=”sb-pin-dot”>' + PIN_SVG + '</span> ' : ''}${escapeHtml(t.title || 'Untitled')}</div>` +
    `<div class=”sb-item-meta”>${dotsHtml}${escapeHtml(timeAgo(t.updatedAt || t.createdAt))} · ${t.turns.length} turn${t.turns.length === 1 ? '' : 's'}</div></div>` +
    `<div class=”sb-item-actions”>` +
    `<button class=”sb-act sb-pin${t.pinned ? ' on' : ''}” title=”${t.pinned ? 'Unpin' : 'Pin to top'}” data-id=”${escapeHtml(t.id)}”>${PIN_SVG}</button>` +
    `<button class=”sb-act sb-rename” title=”Rename” data-id=”${escapeHtml(t.id)}”>${EDIT_SVG}</button>` +
    `<button class=”sb-act sb-del” title=”Delete” data-id=”${escapeHtml(t.id)}”>×</button>` +
    `</div></div>`;
  };
  let html = '';
  if (q) {
    html = items.map(itemHtml).join('');
  } else {
    let lastGroup = null;
    for (const t of items) {
      const group = t.pinned ? 'Pinned' : threadDateGroup(t.updatedAt || t.createdAt);
      if (group !== lastGroup) { html += `<div class=”sb-date-group”>${escapeHtml(group)}</div>`; lastGroup = group; }
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
  history = history.filter(t => t.id !== id);
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
  ensureTabs();
  (t.turns || []).forEach(turn => {
    (t.selections || []).forEach(sel => {
      const ans = turn.answers ? turn.answers[sel.id] : undefined;
      const co = getConvo(sel.id);
      co.push({ role: 'user', content: turn.prompt });
      if (ans != null) co.push({ role: 'assistant', content: ans });
      renderStaticPair(sel.id, selectionLabel(sel), turn.prompt, ans, turn.attachments);
    });
    if (turn.consensus != null) renderStaticConsensus(turn.prompt, turn.consensus);
  });
  lastPrompt = t.turns && t.turns.length ? t.turns[t.turns.length - 1].prompt : '';

  // Re-populate live state from the last turn so model snapshot cards, follow-up
  // chips, and the re-synthesis strip work on restored conversations just like live ones.
  const lastTurn = (t.turns || []).length > 0 ? t.turns[t.turns.length - 1] : null;
  if (lastTurn && lastTurn.consensus && cfg.consensus) {
    const rSels = (t.selections || []);
    order = rSels.map(s => s.id);
    rSels.forEach(s => { results[s.id] = lastTurn.answers?.[s.id] ?? null; });
    lastConsensusText = lastTurn.consensus;
    lastSynthesisOrdered = order.filter(id => results[id]).map(id => ({
      selection: selById(id) || { id, provider: 'openai', model: '' },
      text: results[id],
    }));
    lastSynthesisPrompt = lastTurn.prompt;
    const lastConsPair = $('conv_consensus')?.querySelector('.qa-pair:last-child');
    if (lastConsPair) {
      renderModelSnapshotsEl(lastConsPair);
      renderFollowUpChips(lastConsPair, null);
      if (lastSynthesisOrdered.length >= 2)
        renderResynthStrip(lastConsPair, lastSynthesisOrdered, lastSynthesisPrompt, activeStrategy(cfg).id);
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
    (answerText == null ? '' : `<button class="copy-btn" title="Copy">${COPY_SVG}</button>`) + `</div>` +
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
const CHANGELOG_SEEN_KEY = 'polecat_changelog_seen';
let _changelog = null;
async function loadChangelog() {
  try {
    const r = await fetch('changelog.json', { cache: 'no-cache' });
    if (r.ok) _changelog = await r.json();
  } catch { /* offline / missing — feature just stays quiet */ }
  updateWhatsNewBadge();
}
function changelogLatest() { return (_changelog?.entries?.[0]?.date) || _changelog?.updated || ''; }
function updateWhatsNewBadge() {
  const dot = $('whatsNewDot'); if (!dot) return;
  const latest = changelogLatest();
  const seen = localStorage.getItem(CHANGELOG_SEEN_KEY) || '';
  dot.hidden = !latest || latest <= seen;
}
function openWhatsNew() {
  if (!_changelog || !(_changelog.entries || []).length) { toast('No changelog yet'); return; }
  localStorage.setItem(CHANGELOG_SEEN_KEY, changelogLatest());
  updateWhatsNewBadge();
  const ov = el('div', 'exp-overlay');
  ov.innerHTML =
    `<div class="exp-card wn-card">` +
    `<div class="exp-title">${STAR_SVG} What's new</div>` +
    `<div class="exp-sub">Polecat keeps getting better${_changelog.updated ? ` · updated ${escapeHtml(_changelog.updated)}` : ''}.</div>` +
    `<div class="wn-list">` + (_changelog.entries || []).map(e =>
      `<div class="wn-entry"><div class="wn-date">${escapeHtml(e.date || '')}${e.time ? ' <span class="wn-time">' + escapeHtml(e.time) + '</span>' : ''}</div>` +
      `<div class="wn-etitle">${escapeHtml(e.title || '')}</div>` +
      `<ul class="wn-items">${(e.items || []).map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div>`).join('') +
    `</div>` +
    `<div class="exp-actions"><button class="btn btn-solid" id="wnClose">Close</button></div>` +
    `</div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.onclick = (e) => { if (e.target === ov) close(); };
  $('wnClose').onclick = close;
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
function showWelcome() { _wslide = 1; gotoWelcome(1); $('welcomeOverlay').classList.add('open'); }
function dismissWelcome(openCfg = false) {
  localStorage.setItem(WELCOME_KEY, '1');
  $('welcomeOverlay').classList.remove('open');
  if (openCfg) setTimeout(() => openConfig('keys'), 200);
  else if (!configuredProviders(cfg).length) setTimeout(() => openConfig('keys'), 400);
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
function init() {
  if (typeof marked !== 'undefined') marked.setOptions({ breaks: true, gfm: true });
  applyTheme(localStorage.getItem('polecat_theme') || 'dark');
  buildChips();
  { const lv = $('logoVer'); if (lv) lv.textContent = buildStamp(); }

  const note = takeMigrationNote();                  // e.g. "Your saved setup carried over"
  if (note) setTimeout(() => toast(note, 4000), 700);

  document.querySelectorAll('.cfg-tab').forEach(b => b.onclick = () => setConfigTab(b.dataset.tab));
  $('configBtn').onclick   = () => openConfig();
  $('closeConfig').onclick = closeConfig;
  $('doneConfig').onclick  = closeConfig;
  $('configModal').onclick = (e) => { if (e.target === $('configModal')) closeConfig(); };
  $('tourBtn').onclick = () => { closeConfig(); setTimeout(showWelcome, 200); };

  $('clearKeys').onclick = () => {
    if (!confirm('Remove all saved API keys? (Your model picks and strategies stay.)')) return;
    cfg.providers = {}; persist(); renderKeys(); buildChips(); renderModels(); toast('Keys cleared');
  };

  $('resetBtn').onclick = newChat;

  $('sendBtn').onclick = sendAll;
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
  $('promptInput').addEventListener('input', function () { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 200) + 'px'; updateSendEnabled(); });
  $('sbTheme').onclick = () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');

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
  const openLightbox = (src, alt) => { const lb = $('lightbox'); $('lightboxImg').src = src; $('lightboxImg').alt = alt || ''; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); };
  const closeLightbox = () => { const lb = $('lightbox'); lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); $('lightboxImg').src = ''; };
  document.addEventListener('click', (e) => {
    const img = e.target.closest('.msg-thumb, .attach-thumb img');
    if (img && img.src) { e.preventDefault(); openLightbox(img.src, img.alt); }
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

  // sidebar + conversation history
  $('sidebarToggle').onclick = toggleSidebar;
  $('sidebarBackdrop').onclick = closeSidebar;
  $('sbNewChat').onclick = newChat;
  $('sbSearch') && ($('sbSearch').oninput = renderHistoryList);
  $('sbExport').onclick = openExport;
  $('sbImport').onclick = openImport;
  $('sbClear').onclick = clearHistory;
  $('sbWhatsNew') && ($('sbWhatsNew').onclick = openWhatsNew);
  loadChangelog();
  $('privateSwitch').onclick = togglePrivate;
  $('privateSwitch').onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); togglePrivate(); } };
  renderHistoryList(); updatePrivateUI();

  $('wNext').onclick = welcomeNext; $('wBack').onclick = welcomeBack;
  $('wSkip').onclick = () => dismissWelcome(); $('wClose').onclick = () => dismissWelcome();
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
    if (e.key === ',' && (e.metaKey || e.ctrlKey) && !e.altKey) { e.preventDefault(); openConfig(); }
  });

  // Reset the tab title notification whenever the user focuses back to this tab.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) document.title = DEFAULT_TITLE; });

  const hasKeys = configuredProviders(cfg).length > 0 || (cfg.selections || []).some(s => s.provider === 'demo');
  const seen = !!localStorage.getItem(WELCOME_KEY);
  if (location.hash.startsWith('#share=')) {
    const data = decodeSharePayload(location.hash.slice(7));
    if (data) setTimeout(() => showShareModal(data), 100);
  } else if (location.hash === '#settings') {
    setTimeout(() => openConfig(), 200);   // deep-link to settings
  } else if (!hasKeys && !seen) {
    setTimeout(showWelcome, 350);
  } else if (!hasKeys) {
    setTimeout(() => openConfig('keys'), 400);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
