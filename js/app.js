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
  computeParaAttribution,
} from './arbitration.js';
import { $, el, escapeHtml, nl2br, renderMarkdown, highlightBubble, toast, applyTheme, currentTheme } from './ui.js';

const DONATE_URL = 'https://ko-fi.com/polecatlive';
const WELCOME_KEY = 'polecat_welcomed';
const COPY_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
// EPIC 1 · P4 — layers icon for the inline attribution toggle
const ATTR_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;

let cfg = loadCfg();
const convos = {};                  // selectionId -> [{role, content}]
let lastPrompt = '', results = {}, order = [];
let activeTab = null;
let history = loadHistory();         // [thread] newest-first
let currentThread = null;           // the conversation being built/continued
let lastConsensusText = '';         // captured per turn for history
let lastConsensusProvenance = null; // EPIC 1 — arbiter's agreement map for the current consensus
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

// ── Rich documents: lazy parser libs from CDN (F2 PDF, F3 Office) ────────────
const MAX_DOC_BYTES = 10 * 1024 * 1024;          // 10MB per rich doc (before reading)

// Generic one-shot lazy <script> loader keyed by URL. Resolves with the named
// global once the script runs; rejects (and lets a retry re-attempt) on failure
// so offline / CDN-blocked environments degrade gracefully.
const _scriptCache = {};
function loadScript(src, globalName) {
  if (globalName && window[globalName]) return Promise.resolve(window[globalName]);
  if (_scriptCache[src]) return _scriptCache[src];
  _scriptCache[src] = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => {
      const g = globalName ? window[globalName] : true;
      if (globalName && !g) { delete _scriptCache[src]; reject(new Error(globalName + ' unavailable')); return; }
      resolve(g);
    };
    s.onerror = () => { delete _scriptCache[src]; reject(new Error('Could not load ' + src)); };
    document.head.appendChild(s);
  });
  return _scriptCache[src];
}

// Append a labelled block to `blocks`, respecting the shared char budget.
// Returns false once the budget is exhausted (caller should stop). `st` is
// { chars, truncated }.
function pushCapped(blocks, st, block) {
  if (st.chars + block.length > MAX_TEXT_CHARS) {
    const room = Math.max(0, MAX_TEXT_CHARS - st.chars);
    if (room) blocks.push(block.slice(0, room));
    st.truncated = true; return false;
  }
  blocks.push(block); st.chars += block.length + 2; return true;
}

function decodeXmlEntities(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, '&');
}

// ── PDF (F2) ──
const PDFJS_VER = '3.11.174';
const PDFJS_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VER}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VER}/pdf.worker.min.js`;
function loadPdfJs() {
  return loadScript(PDFJS_SRC, 'pdfjsLib').then(lib => {
    try { lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; } catch {}
    return lib;
  });
}
function isPdfFile(f) {
  if (f.type === 'application/pdf') return true;
  return ((f.name || '').split('.').pop() || '').toLowerCase() === 'pdf';
}
// Extract selectable text from a PDF, page by page, with light page markers and
// a char cap. onProgress(page, total) drives the per-file progress indicator.
function readPdfFile(file, id, onProgress) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = async () => {
      try {
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument({ data: new Uint8Array(r.result) }).promise;
        const numPages = doc.numPages;
        const blocks = []; const st = { chars: 0, truncated: false };
        for (let p = 1; p <= numPages; p++) {
          if (onProgress) onProgress(p, numPages);
          const page = await doc.getPage(p);
          const content = await page.getTextContent();
          const txt = content.items.map(it => it.str).join(' ')
            .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
          if (!pushCapped(blocks, st, `[Page ${p}]\n${txt}`)) break;
        }
        try { doc.destroy(); } catch {}
        const text = blocks.join('\n\n').trim();
        if (!text) { reject(new Error('No selectable text')); return; }
        resolve({ id, name: file.name || 'document.pdf', mime: 'application/pdf',
          kind: 'text', size: file.size, textContent: text, truncated: st.truncated, isPdf: true, pageCount: numPages });
      } catch (e) { reject(e); }
    };
    r.readAsArrayBuffer(file);
  });
}

// ── Office docs: PPTX / DOCX / XLSX (F3) ──
const JSZIP_SRC   = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
const MAMMOTH_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
const SHEETJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

// Returns 'pptx' | 'docx' | 'xlsx' | null
function officeKind(f) {
  const ext = ((f.name || '').split('.').pop() || '').toLowerCase();
  if (ext === 'pptx' || ext === 'docx' || ext === 'xlsx') return ext;
  const m = f.type || '';
  if (m.includes('presentationml')) return 'pptx';
  if (m.includes('wordprocessingml')) return 'docx';
  if (m.includes('spreadsheetml')) return 'xlsx';
  return null;
}
function isOfficeFile(f) { return !!officeKind(f); }

// PPTX = a zip of slideN.xml; pull <a:t> runs, one line per paragraph (<a:p>).
function pptxSlideText(xml) {
  return xml.split('</a:p>').map(p => {
    const runs = []; const re = /<a:t>([\s\S]*?)<\/a:t>/g; let m;
    while ((m = re.exec(p))) runs.push(decodeXmlEntities(m[1]));
    return runs.join('');
  }).filter(s => s.trim()).join('\n').replace(/[ \t]+/g, ' ').trim();
}
async function readPptxFile(file, id, onProgress) {
  const buf = await file.arrayBuffer();
  const JSZip = await loadScript(JSZIP_SRC, 'JSZip');
  const zip = await JSZip.loadAsync(buf);
  const slideNo = n => parseInt((n.match(/slide(\d+)\.xml$/) || [])[1] || '0', 10);
  const names = Object.keys(zip.files)
    .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => slideNo(a) - slideNo(b));
  const blocks = []; const st = { chars: 0, truncated: false };
  for (let i = 0; i < names.length; i++) {
    if (onProgress) onProgress(i + 1, names.length);
    const xml = await zip.files[names[i]].async('string');
    const txt = pptxSlideText(xml);
    if (txt && !pushCapped(blocks, st, `[Slide ${i + 1}]\n${txt}`)) break;
  }
  const text = blocks.join('\n\n').trim();
  if (!text) throw new Error('No slide text');
  return { id, name: file.name, mime: file.type || 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    kind: 'text', size: file.size, textContent: text, truncated: st.truncated, isOffice: true, office: 'pptx' };
}
async function readDocxFile(file, id, onProgress) {
  if (onProgress) onProgress(1, 1);
  const buf = await file.arrayBuffer();
  const mammoth = await loadScript(MAMMOTH_SRC, 'mammoth');
  const res = await mammoth.extractRawText({ arrayBuffer: buf });
  let text = ((res && res.value) || '').replace(/\n{3,}/g, '\n\n').trim();
  if (!text) throw new Error('No document text');
  const truncated = text.length > MAX_TEXT_CHARS;
  if (truncated) text = text.slice(0, MAX_TEXT_CHARS);
  return { id, name: file.name, mime: file.type, kind: 'text', size: file.size,
    textContent: text, truncated, isOffice: true, office: 'docx' };
}
async function readXlsxFile(file, id, onProgress) {
  const buf = await file.arrayBuffer();
  const XLSX = await loadScript(SHEETJS_SRC, 'XLSX');
  const wb = XLSX.read(buf, { type: 'array' });
  const blocks = []; const st = { chars: 0, truncated: false };
  for (let i = 0; i < wb.SheetNames.length; i++) {
    if (onProgress) onProgress(i + 1, wb.SheetNames.length);
    const name = wb.SheetNames[i];
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]).trim();
    if (csv && !pushCapped(blocks, st, `[Sheet: ${name}]\n${csv}`)) break;
  }
  const text = blocks.join('\n\n').trim();
  if (!text) throw new Error('No sheet data');
  return { id, name: file.name, mime: file.type, kind: 'text', size: file.size,
    textContent: text, truncated: st.truncated, isOffice: true, office: 'xlsx' };
}

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

// ── Attachment prompt-injection & budgeting (F4) ─────────────────────────────
// Combined cap across ALL attachment text (per-file is MAX_TEXT_CHARS). ~12k
// tokens, so several large docs can't blow the context window of smaller/free
// models. Shared across every selected model + the arbiter.
const MAX_TOTAL_ATTACH_CHARS = 48000;

function attachTypeLabel(a) {
  if (a.isPdf) return 'PDF';
  if (a.office === 'pptx') return 'PowerPoint';
  if (a.office === 'docx') return 'Word';
  if (a.office === 'xlsx') return 'Excel';
  return 'text';
}

// Fairly allocate the shared budget across attachments: small files keep their
// full text; the remaining budget is split evenly among the larger ones
// (water-fill). Returns { blocks:[{name,type,text,truncated}], budgetTrimmed }.
function budgetAttachmentText(files) {
  const lenOf = f => (f.textContent || '').length;
  const total = files.reduce((s, f) => s + lenOf(f), 0);
  if (total <= MAX_TOTAL_ATTACH_CHARS) {
    return { budgetTrimmed: false, blocks: files.map(f => ({
      name: f.name, type: attachTypeLabel(f), text: f.textContent || '', truncated: !!f.truncated })) };
  }
  const take = new Array(files.length).fill(0);
  let remaining = MAX_TOTAL_ATTACH_CHARS, left = files.length;
  files.map((f, i) => ({ i, len: lenOf(f) })).sort((a, b) => a.len - b.len).forEach(o => {
    const share = Math.floor(remaining / left);
    const t = Math.min(o.len, share);
    take[o.i] = t; remaining -= t; left--;
  });
  return { budgetTrimmed: true, blocks: files.map((f, i) => ({
    name: f.name, type: attachTypeLabel(f),
    text: (f.textContent || '').slice(0, take[i]),
    truncated: !!f.truncated || take[i] < lenOf(f) })) };
}

async function addFiles(fileList) {
  const all = Array.from(fileList || []);
  const ok = f => isImageFile(f) || isPdfFile(f) || isOfficeFile(f) || isTextFile(f);
  const accepted = all.filter(ok);
  const rejected = all.filter(f => !ok(f));
  if (rejected.length) toast(`Unsupported: ${rejected.map(f => '"' + f.name + '"').join(', ')}`);

  for (const f of accepted) {
    if (attachments.length >= MAX_ATTACH) { toast(`Up to ${MAX_ATTACH} attachments`); break; }
    const isImg = isImageFile(f);
    const isPdf = !isImg && isPdfFile(f);
    const office = (!isImg && !isPdf) ? officeKind(f) : null;
    const isRichDoc = isPdf || !!office;   // PDF + Office share the 10MB cap and the note-fallback
    const limit = isImg ? MAX_ATTACH_BYTES : (isRichDoc ? MAX_DOC_BYTES : MAX_TEXT_ATTACH_BYTES);
    if (f.size > limit) { toast(`"${f.name}" is too large (max ${isImg ? '8' : (isRichDoc ? '10' : '5')} MB)`); continue; }

    // Add pending placeholder so the chip appears immediately with a spinner
    const id = 'a' + Date.now().toString(36) + (_attc++).toString(36);
    attachments.push({ id, name: f.name, mime: f.type, kind: isImg ? 'image' : 'text', pending: true, size: f.size });
    renderAttachments(); updateSendEnabled();

    const prog = (p, n) => setAttachProgress(id, p, n);
    try {
      let att;
      if (isImg) att = await readImageFile(f, id);
      else if (isPdf) att = await readPdfFile(f, id, prog);
      else if (office === 'pptx') att = await readPptxFile(f, id, prog);
      else if (office === 'docx') att = await readDocxFile(f, id, prog);
      else if (office === 'xlsx') att = await readXlsxFile(f, id, prog);
      else att = await readTextFile(f, id);
      const idx = attachments.findIndex(a => a.id === id);
      if (idx >= 0) attachments[idx] = att;
    } catch (e) {
      if (isRichDoc) {
        // Graceful degradation: keep the file as a labelled note so models still know
        // it was attached (CDN blocked, scanned/image-only PDF, empty/parse failure).
        const why = isPdf ? 'the PDF may be scanned/image-only, or the PDF reader was unavailable'
          : 'the document reader was unavailable or the file had no extractable text';
        const note = `[Attached "${f.name}" — could not extract text in-browser (${why}).]`;
        const fallback = { id, name: f.name, mime: f.type, kind: 'text', size: f.size,
          textContent: note, truncated: false, failed: true, isPdf, isOffice: !!office, office: office || undefined };
        const idx = attachments.findIndex(a => a.id === id);
        if (idx >= 0) attachments[idx] = fallback; else attachments.push(fallback);
        toast(`Couldn't read text from "${f.name}" — attached as a note`);
      } else {
        toast(`Could not read "${f.name}"`); attachments = attachments.filter(a => a.id !== id);
      }
    }
    renderAttachments(); buildChips(); updateVisionNote(); updateSendEnabled();
  }
  if (!accepted.length) renderAttachments();
}

// Live per-file progress while a slow parse (PDF) runs — updates the pending chip.
function setAttachProgress(id, page, total) {
  const a = attachments.find(x => x.id === id);
  if (!a || !a.pending) return;
  a.progressText = total > 1 ? `page ${page}/${total}` : 'reading…';
  renderAttachments();
}

function removeAttachment(id) { attachments = attachments.filter(a => a.id !== id); renderAttachments(); buildChips(); updateVisionNote(); updateSendEnabled(); }
function clearAttachments() { attachments = []; renderAttachments(); buildChips(); updateVisionNote(); updateSendEnabled(); }
const DOC_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
function renderAttachments() {
  const strip = $('attachStrip'); if (!strip) return;
  strip.hidden = attachments.length === 0;
  strip.innerHTML = attachments.map(a => {
    if (a.kind === 'image') {
      if (a.pending) return `<div class="attach-file-chip pending" title="Reading ${escapeHtml(a.name)}…"><span class="afc-spinner"></span><span class="afc-name">${escapeHtml(a.name)}</span></div>`;
      return `<div class="attach-thumb" title="${escapeHtml(a.name)}"><img src="${a.dataUrl}" alt="${escapeHtml(a.name)}">` +
        `<button class="at-x" data-id="${a.id}" title="Remove" aria-label="Remove ${escapeHtml(a.name)}">×</button></div>`;
    }
    // text / pdf file chip
    if (a.pending) {
      const prog = a.progressText ? `<span class="afc-size">${escapeHtml(a.progressText)}</span>` : '';
      return `<div class="attach-file-chip pending" title="Reading ${escapeHtml(a.name)}…"><span class="afc-spinner"></span><span class="afc-name">${escapeHtml(a.name)}</span>${prog}</div>`;
    }
    return `<div class="attach-file-chip" title="${escapeHtml(a.name)} · ${fmtBytes(a.size)}">${DOC_ICON}<span class="afc-name">${escapeHtml(a.name)}</span><span class="afc-size">${fmtBytes(a.size)}</span>` +
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
  const txtAtts = attachments.filter(a => a.kind === 'text' && !a.pending);
  if (!imgAtts.length && !txtAtts.length) { note.hidden = true; note.innerHTML = ''; return; }
  note.hidden = false;
  const parts = [];
  if (imgAtts.length) {
    const { total, can, cannot } = visionSplit();
    const n = imgAtts.length, iw = n === 1 ? 'image' : 'images';
    if (!total) parts.push(`📎 ${n} ${iw} attached — add a model to send.`);
    else if (cannot === 0) parts.push(`📎 ${n} ${iw} attached — <b>all ${total} models</b> will see ${n === 1 ? 'it' : 'them'}. 👁`);
    else if (can === 0) parts.push(`<span class="vn-warn">⚠ None of your selected models can read images</span> — they'll get text only. Add a vision model (👁).`);
    else parts.push(`📎 ${n} ${iw} attached — <b>${can} of ${total}</b> models can read ${n === 1 ? 'it' : 'them'} (👁); the other ${cannot} get <span class="vn-warn">text only</span>.`);
  }
  if (txtAtts.length) {
    const n = txtAtts.length, fw = n === 1 ? 'file' : 'files';
    const truncNote = txtAtts.some(a => a.truncated) ? ' <span class="vn-warn">(some truncated)</span>' : '';
    const failNote = txtAtts.some(a => a.failed) ? ' <span class="vn-warn">(one couldn\'t be read — sent as a note)</span>' : '';
    const hasExtract = txtAtts.some(a => a.isPdf || a.isOffice);
    const kindWord = hasExtract ? 'extracted text' : 'text';
    const totalChars = txtAtts.reduce((s, a) => s + ((a.textContent || '').length), 0);
    const budgetNote = totalChars > MAX_TOTAL_ATTACH_CHARS ? ' <span class="vn-warn">(large — trimmed to fit when sent)</span>' : '';
    parts.push(`📄 ${n} ${fw} — ${kindWord} sent to all models.${truncNote}${failNote}${budgetNote}`);
  }
  note.innerHTML = parts.join('<br>');
}
function updateSendEnabled() {
  const send = $('sendBtn'); if (!send) return;
  const hasPending = attachments.some(a => a.pending);
  const hasContent = $('promptInput').value.trim().length > 0 || attachments.some(a => !a.pending);
  send.disabled = !sels().length || !hasContent || hasPending;
  send.title = hasPending ? 'Reading files…' : 'Send to all (⌘↵)';
}

// ── Model chips (prompt footer) ─────────────────────────────────────────────
function buildChips() {
  const row = $('modelChips'), send = $('sendBtn');
  row.innerHTML = '';
  const list = sels();

  if (!list.length) {
    const why = configuredProviders(cfg).length ? 'No models selected' : 'No models';
    row.innerHTML = `<span class="no-config-hint">${why} — <button id="hintAdd">add one ⚙</button></span>`;
    $('hintAdd').onclick = () => openConfig('models');
    send.disabled = true;
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
    const visionMark = vision ? `<span class="m-chip-vision" title="Reads images">👁</span>`
      : (haveImages ? `<span class="m-chip-novision" title="Can't read images — gets text only">⊘</span>` : '');
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
    btn.onclick = () => switchTab(sel.id);
    btn.innerHTML = `<span class="tab-dot" id="tdot_${sel.id}" style="background:${p.color};--dot-c:${p.color}"></span><span class="tab-label">${escapeHtml(selectionLabel(sel))}</span>`;
    tabBar.insertBefore(btn, $('tab_consensus') || null);

    const panel = el('div', 'tab-panel');
    panel.id = 'panel_' + sel.id;
    panel.innerHTML =
      `<div class="conversation" id="conv_${sel.id}"><div class="empty-state" id="empty_${sel.id}">` +
      `<div class="empty-icon">◎</div><div>Send a prompt to see ${escapeHtml(selectionLabel(sel))}</div></div></div>`;
    panels.appendChild(panel);
  });

  if (cfg.consensus && !$('tab_consensus')) {
    const btn = el('button', 'tab');
    btn.id = 'tab_consensus'; btn.dataset.svc = 'consensus';
    btn.onclick = () => switchTab('consensus');
    btn.innerHTML =
      `<span class="tab-dot" id="tdot_consensus" style="background:var(--consensus);--dot-c:var(--consensus)"></span>` +
      `<div class="tab-inner">Consensus<span class="tab-step" id="consensus-tab-step"></span></div>`;
    tabBar.appendChild(btn);

    const panel = el('div', 'tab-panel');
    panel.id = 'panel_consensus';
    panel.innerHTML =
      `<div class="conversation" id="conv_consensus"><div class="empty-state" id="empty_consensus">` +
      `<div class="empty-icon consensus-glyph">✦</div><div id="consensus-status">Consensus appears here after all models respond</div></div></div>`;
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
      : `<span class="msg-file-chip">🖼 ${escapeHtml(im.name || 'image')}</span>`;
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

async function streamTo(sel, userContent, images, displayAtts) {
  const co = getConvo(sel.id);
  const userMsg = { role: 'user', content: userContent };
  if (images && images.length) userMsg.images = images;  // only image attachments for API
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
    if (full) setMsgTime(pair, performance.now() - t0);
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

// Greeting placeholder (shown before any conversation exists)
function hideGreeting() { $('chatGreeting')?.classList.add('hidden'); }
function showGreeting() { const g = $('chatGreeting'); if (g && !document.querySelector('.tab')) g.classList.remove('hidden'); }

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

// ── Broadcast ───────────────────────────────────────────────────────────────
async function sendAll() {
  const text = $('promptInput').value.trim();
  const readyAtts = attachments.filter(a => !a.pending);
  const imgAtts   = readyAtts.filter(a => a.kind === 'image');
  const textFiles = readyAtts.filter(a => a.kind === 'text');

  // Fold extracted file content into labelled blocks prepended to the user
  // message, within a shared size budget so several large docs can't blow a
  // model's context. The same combined text goes to every selected model and,
  // via their answers, into consensus/arbitration. (F4)
  let userText = text;
  if (textFiles.length) {
    const { blocks, budgetTrimmed } = budgetAttachmentText(textFiles);
    const rendered = blocks.map(b => {
      const trunc = b.truncated ? `\n[Content truncated to fit size limits]` : '';
      return `<file name="${b.name}" type="${b.type}">\n${b.text}${trunc}\n</file>`;
    }).join('\n\n');
    const n = textFiles.length;
    const header = `The user attached ${n} file${n > 1 ? 's' : ''}; the text extracted from ${n > 1 ? 'them' : 'it'} is included below.` +
      (budgetTrimmed ? ' Some content was trimmed to fit a shared size budget.' : '');
    userText = `${header}\n\n${rendered}` + (text ? '\n\n' + text : '');
  }

  if (!userText && !imgAtts.length) return;
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
      const r = await streamTo(sel, userText, imgAtts, readyAtts);
      order.push(sel.id); results[sel.id] = r;
    }));

    if (cfg.consensus) {
      setConsensusDot(true);
      await runConsensus();
      setConsensusDot(false); setConsensusStep('');
    }
    recordTurn(text, readyAtts);
  } finally {
    document.body.classList.remove('processing');
    setChipsDisabled(false); updateSendEnabled();
  }
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
    const titleFallback = firstAtt ? (firstAtt.kind === 'image' ? '🖼 ' : '📄 ') + firstAtt.name : 'Untitled';
    currentThread = {
      id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      title: (prompt || titleFallback).slice(0, 80),
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
    const icon = isCons ? `<div class="empty-icon consensus-glyph">✦</div>` : `<div class="empty-icon">◎</div>`;
    conv.innerHTML = `<div class="empty-state" id="empty_${id}">${icon}<div id="${isCons ? 'consensus-status' : ''}">${label}</div></div>`;
  });
  document.querySelectorAll('.tab-dot').forEach(d => d.classList.remove('loading', 'done'));
  setConsensusStep('');
  setChipsDisabled(false);
  hideAttrTip();
  $('promptInput').focus();
}

// ── Consensus tab ───────────────────────────────────────────────────────────
const setConsensusStatus = (m) => { consensusStatusText = m; consensusPhase = 'arbitrating'; refreshConsensusProgress(); };
const setConsensusStep   = (l) => { consensusStepText = l || ''; const e = $('consensus-tab-step'); if (e) e.textContent = l || ''; refreshConsensusProgress(); };
function setConsensusDot(loading) {
  const dot = $('tdot_consensus'); if (!dot) return;
  if (loading) dot.classList.add('loading');
  else { dot.classList.remove('loading'); dot.classList.add('done'); setTimeout(() => dot.classList.remove('done'), 350); }
}
// Live progress shown in the Consensus tab while models stream + arbitration runs.
function markRun(id, state) {
  if (runStatus[id] === undefined) return;
  runStatus[id] = state;
  if (cfg.consensus) refreshConsensusProgress();
}
const STAT_ICON = { done: '✓', error: '✗', streaming: '▶', pending: '⏳' };
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
      `<span class="cp-name">${escapeHtml(selectionLabel(s))}</span><span class="cp-stat">${STAT_ICON[st] || ''}</span></li>`;
  }).join('');

  box.innerHTML =
    `<div class="cp-glyph">✦</div>` +
    `<div class="cp-title">Building consensus</div>` +
    `<div class="cp-strategy">${escapeHtml(strat.name)} · arbiter: ${escapeHtml(arbiterLabel)}</div>` +
    `<div class="cp-phase">${escapeHtml(phaseLine)}</div>` +
    `<ul class="cp-models">${modelsHtml}</ul>` +
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
      `<span class="cs-dot"></span>${escapeHtml(label)}${isArb ? ' ⚖️' : ''}</button>`;
  }).join('');
  const wrap = el('div', 'consensus-sources');
  wrap.innerHTML =
    `<span class="cs-label">✦ Blended from ${contributors.length} models · ${escapeHtml(strat.name)}</span>` +
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
    const sources = consensusSourcesEl(sel);
    if (sources) { pair.querySelector('.msg.assistant').appendChild(sources); scrollBottom(conv); }
  }
  lastConsensusText = full;
  return full;
}
function showConsensusStatic(text, isError = false) {
  const conv = $('conv_consensus');
  consensusPhase = 'done'; $('consensus-progress')?.remove(); $('empty_consensus')?.remove();
  const pair = el('div', 'qa-pair');
  pair.innerHTML =
    `<div class="msg user"><span class="msg-label">You</span><div class="msg-bubble">${nl2br(lastPrompt)}</div></div>` +
    `<div class="msg assistant"><div class="msg-head"><span class="msg-label">Consensus</span>` +
    (isError ? '' : `<button class="copy-btn" title="Copy">${COPY_SVG}</button>`) + `</div>` +
    `<div class="msg-bubble">${isError ? `<span class="msg-error">${escapeHtml(text)}</span>` : renderMarkdown(text)}</div></div>`;
  conv.appendChild(pair); scrollBottom(conv);
  if (!isError) { highlightBubble(pair); lastConsensusText = text; const b = pair.querySelector('.copy-btn'); if (b) b.onclick = () => copyText(text, b); }
}
async function runConsensus() {
  const ordered = order.filter(id => results[id]).map(id => ({ selection: selById(id) || { id, provider: 'openai', model: '' }, text: results[id] }));
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
    agreesHtml = `<div class="prov-agrees">${prov.agreements.slice(0, 4).map(a => `<div class="prov-agree-item"><span class="prov-agree-check">✓</span>${escapeHtml(a)}</div>`).join('')}</div>`;
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
    `<span class="prov-toggle-icon" aria-hidden="true">▶</span>` +
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
    toggleBtn.querySelector('.prov-toggle-icon').textContent = open ? '▶' : '▼';
    body.hidden = open;
  };

  const assistantMsg = pair.querySelector('.msg.assistant');
  if (assistantMsg) assistantMsg.appendChild(panel);
}

// EPIC 1 · P1 — receive the arbiter's machine-readable agreement map. Stamped
// on the consensus pair and rendered as the provenance panel immediately after.
// Also triggers P4: computes paragraph attribution and wires the toggle button.
function onProvenance(data) {
  lastConsensusProvenance = data || null;
  const pair = $('conv_consensus')?.querySelector('.qa-pair:last-child');
  if (!pair) return;
  pair._provenance = lastConsensusProvenance;
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
//  SETTINGS MODAL  (tabs: Models · Keys · Arbitration · Support)
// ════════════════════════════════════════════════════════════════════════════
function setConfigTab(name) {
  cfg.ui.lastTab = name; persist();
  document.querySelectorAll('.cfg-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.cfg-section').forEach(s => s.classList.toggle('active', s.dataset.tab === name));
  $('modal')?.scrollTo?.(0, 0);
}
function openConfig(tab) {
  renderModels(); renderKeys(); renderArbitration(); renderDonate();
  setConfigTab(tab || cfg.ui.lastTab || 'models');
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
  $('promptInput').focus();
  toast('Free demo ready — pick a question below or type your own ✨');
}

// ── Models tab ──────────────────────────────────────────────────────────────
function modelOptionsHtml(providerId, selected) {
  const p = PROVIDERS[providerId];
  const known = p.models.some(m => m.value === selected);
  let html = '';
  if (selected && !known)
    html += `<option value="${escapeHtml(selected)}" selected>${statusGlyph(providerId, selected)}${escapeHtml(selected)} (custom)</option>`;
  html += p.models.map(m =>
    `<option value="${escapeHtml(m.value)}"${m.value === selected ? ' selected' : ''}>${statusGlyph(providerId, m.value)}${escapeHtml(m.label)}${m.price ? ' — ' + m.price : ''}${m.vision ? ' 👁' : ''}</option>`
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
      (vision ? `<span class="sel-vision" title="Reads images">👁</span>` : '') +
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
      `<div class="browse-bar"><button class="btn btn-ghost browse-btn" id="browseBtn" hidden>🔎 Browse all models</button></div>` +
      `<div class="browse-panel" id="browsePanel" hidden><input class="field-input" id="browseSearch" placeholder="Search models…" autocomplete="off"><div class="browse-list" id="browseList"></div></div>`) +
    `<button class="btn btn-ghost test-all" id="testAllBtn">⚡ Test models</button>`;

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
    `<details class="key-help"><summary>🔑 What is an API key?</summary>` +
    `<p>An API key is a short string of letters and numbers — like a passcode. Each provider (Anthropic, Google, OpenAI…) generates one for you so Polecat can use their models on your behalf. Paste it here: it's stored only in your browser and sent straight to that provider — never to us. You stay in control — revoke or regenerate it anytime in the provider's dashboard, and set spending limits there.</p></details>` +
    `<details class="key-help"><summary>💸 What will it cost?</summary>` +
    `<p>You only ever pay the provider, for what you use — never Polecat.</p>` +
    `<ul>` +
    `<li><b>Free</b> — OpenRouter <code>:free</code> models, Groq's free tier, and Hugging Face credits cost <b>$0</b> (just rate-limited). Gemini also has a free tier.</li>` +
    `<li><b>Paid</b> — Claude, Gemini &amp; ChatGPT bill per use: cheaper models (Haiku, GPT&#8209;mini, Gemini Flash) ≈ <b>$0.001–0.01</b> a question; flagships (Opus, GPT&#8209;5, Gemini Pro) ≈ <b>$0.01–0.10</b>. Longer answers cost a bit more.</li>` +
    `<li><b>In practice</b> — light daily use on paid models is often under <b>~$1–5/month</b>; free models stay $0. Set a hard spending cap in each provider's billing settings so there are no surprises.</li>` +
    `</ul></details>`;
  if (PROVIDERS.demo) {
    const card = el('div', 'demo-card');
    card.innerHTML =
      `<div class="demo-card-head"><span class="demo-spark">✨</span><b>No key? Try it free.</b></div>` +
      `<div class="demo-card-sub">Run a free model through Polecat right now — no signup, no key. ` +
      `When you're ready, add your own free key below for unlimited use &amp; more models.</div>` +
      `<button class="btn btn-solid demo-go" id="demoGoKeys">✨ Try it free — no setup</button>`;
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
    `<label class="switch-row"><span><b>Consensus answer</b><br><span class="switch-sub">Off = just the individual model tabs</span></span>` +
      `<span class="switch ${on ? 'on' : ''}" id="consensusSwitch" role="switch" aria-checked="${on}" tabindex="0"><span class="knob"></span></span></label>` +
    `<div class="arb-body"${on ? '' : ' aria-disabled="true"'}>` +
      `<label class="mini-label">Strategy</label><select class="field-input" id="arbSelect">${stratOpts}</select>` +
      `<div class="arb-desc">${escapeHtml(strat.description || '')}</div>` +
      `<label class="mini-label">Final arbiter <span class="mini-note">model that produces the consensus</span></label><select class="field-input" id="arbiterSelect">${arbiterOpts}</select>` +
      `<div class="arb-meta">structure: <b>${escapeHtml(strat.structure)}</b> · default arbiter: <b>${escapeHtml(strat.arbiter)}</b></div>` +
      `<label class="switch-row"><span><b>Agreement map</b><br><span class="switch-sub">After each consensus, analyze how the models agreed &amp; how much each shaped the answer</span></span>` +
        `<span class="switch ${provOn ? 'on' : ''}" id="provSwitch" role="switch" aria-checked="${provOn}" tabindex="0"><span class="knob"></span></span></label>` +
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
  if (!items.length) { wrap.innerHTML = `<div class="sb-empty">No matches for “${escapeHtml(q)}”.</div>`; return; }
  wrap.innerHTML = items.map(t =>
    `<div class="sb-item${currentThread && currentThread.id === t.id ? ' active' : ''}${t.pinned ? ' pinned' : ''}" data-id="${escapeHtml(t.id)}">` +
    `<div class="sb-item-main"><div class="sb-item-title">${t.pinned ? '<span class="sb-pin-dot">📌</span> ' : ''}${escapeHtml(t.title || 'Untitled')}</div>` +
    `<div class="sb-item-meta">${escapeHtml(timeAgo(t.updatedAt || t.createdAt))} · ${t.turns.length} turn${t.turns.length === 1 ? '' : 's'}</div></div>` +
    `<div class="sb-item-actions">` +
    `<button class="sb-act sb-pin${t.pinned ? ' on' : ''}" title="${t.pinned ? 'Unpin' : 'Pin to top'}" data-id="${escapeHtml(t.id)}">📌</button>` +
    `<button class="sb-act sb-rename" title="Rename" data-id="${escapeHtml(t.id)}">✎</button>` +
    `<button class="sb-act sb-del" title="Delete" data-id="${escapeHtml(t.id)}">×</button>` +
    `</div></div>`).join('');
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
    `<div class="exp-title">✨ What's new</div>` +
    `<div class="exp-sub">Polecat keeps getting better${_changelog.updated ? ` · updated ${escapeHtml(_changelog.updated)}${_changelog.updatedTime ? ` ${escapeHtml(_changelog.updatedTime)}` : ''}` : ''}.</div>` +
    `<div class="wn-list">` + (_changelog.entries || []).map(e =>
      `<div class="wn-entry"><div class="wn-date">${escapeHtml(e.date || '')}${e.time ? ` · ${escapeHtml(e.time)}` : ''}</div>` +
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
  const tiers = ['☕ $1', '$2', '$5', 'More'];
  wrap.innerHTML =
    `<div class="donate-copy">Polecat is free and runs on your own API keys — tips just help offset hosting &amp; dev costs. Thank you! 🦡</div>` +
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
    ? 'Type your prompt — sent to all selected models at once\nTap ➤ to send · attach images, PDFs, Office docs or text files'
    : 'Type your prompt — sent to all selected models at once\nEnter to send · Shift+Enter for new line · paste or drop images, PDFs, Office docs or text files';
  $('promptInput').addEventListener('input', function () { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 200) + 'px'; updateSendEnabled(); });
  $('sbTheme').onclick = () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');

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

  const hasKeys = configuredProviders(cfg).length > 0 || (cfg.selections || []).some(s => s.provider === 'demo');
  const seen = !!localStorage.getItem(WELCOME_KEY);
  if (location.hash === '#settings') setTimeout(() => openConfig(), 200);   // deep-link to settings
  else if (!hasKeys && !seen) setTimeout(showWelcome, 350);
  else if (!hasKeys) setTimeout(() => openConfig('keys'), 400);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
