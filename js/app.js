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
  listModels, modelListSupported,
} from './providers.js';
import {
  allStrategies, activeStrategy, runArbitration, exportSettings, importSettings,
} from './arbitration.js';
import { $, el, escapeHtml, nl2br, renderMarkdown, highlightBubble, toast, applyTheme, currentTheme } from './ui.js';

const DONATE_URL = 'https://ko-fi.com/polecatlive';
const WELCOME_KEY = 'polecat_welcomed';
const COPY_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

let cfg = loadCfg();
const convos = {};                  // selectionId -> [{role, content}]
let lastPrompt = '', results = {}, order = [];
let activeTab = null;
let history = loadHistory();         // [thread] newest-first
let currentThread = null;           // the conversation being built/continued
let lastConsensusText = '';         // captured per turn for history
// live consensus progress
let runStatus = {};                 // selectionId -> 'pending'|'streaming'|'done'|'error'
let consensusPhase = '';            // '' | 'waiting' | 'arbitrating' | 'done'
let consensusStatusText = '', consensusStepText = '';
let _browseList = [], _browseProvider = '';   // live model-list browse state

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
  send.disabled = false;

  list.forEach(sel => {
    const p = PROVIDERS[sel.provider];
    const st = statusOf(sel.provider, sel.model);
    const chip = el('span', 'm-chip' + (st && st.ok === false ? ' failing' : ''));
    chip.id = 'chip_' + sel.id;
    chip.style.setProperty('--c', p.color);
    chip.title = st && st.ok === false ? 'Last test failed: ' + (st.error || 'unavailable') : selectionLabel(sel);
    chip.innerHTML =
      `<span class="m-chip-dot"></span>` +
      `<span class="m-chip-label">${escapeHtml(selectionLabel(sel))}</span>` +
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
function assistantPair(label, userContent) {
  const pair = el('div', 'qa-pair');
  pair.innerHTML =
    `<div class="msg user"><span class="msg-label">You</span><div class="msg-bubble">${nl2br(userContent)}</div></div>` +
    `<div class="msg assistant"><div class="msg-head"><span class="msg-label">${escapeHtml(label)}</span>` +
    `<button class="copy-btn" title="Copy" hidden>${COPY_SVG}</button></div>` +
    `<div class="msg-bubble"><div class="loading-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div></div>`;
  return pair;
}
function finishBubble(pair, full) {
  const bubble = pair.querySelector('.msg.assistant .msg-bubble');
  const copyBtn = pair.querySelector('.copy-btn');
  if (!full) { bubble.textContent = '(no response)'; return; }
  highlightBubble(bubble);
  copyBtn.hidden = false; copyBtn.onclick = () => copyText(full, copyBtn);
}

async function streamTo(sel, userContent) {
  const co = getConvo(sel.id);
  co.push({ role: 'user', content: userContent });
  const conv = $('conv_' + sel.id);
  $('empty_' + sel.id)?.remove();

  const pair = assistantPair(selectionLabel(sel), userContent);
  conv.prepend(pair); conv.scrollTop = 0;
  const bubble = pair.querySelector('.msg.assistant .msg-bubble');

  const dot = $('tdot_' + sel.id); dot?.classList.add('loading');
  markRun(sel.id, 'streaming');
  let full = '';
  try {
    const gen = makeGen(sel, co, cfg);
    bubble.innerHTML = '';
    for await (const chunk of gen) { full += chunk; bubble.innerHTML = renderMarkdown(full); }
    finishBubble(pair, full);
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

// ── Broadcast ───────────────────────────────────────────────────────────────
async function sendAll() {
  const text = $('promptInput').value.trim();
  if (!text) return;
  const list = sels();
  if (!list.length) { openConfig('models'); return; }

  lastPrompt = text; results = {}; order = []; lastConsensusText = '';
  runStatus = {}; list.forEach(s => runStatus[s.id] = 'pending');
  consensusPhase = 'waiting'; consensusStatusText = ''; consensusStepText = '';
  $('promptInput').value = ''; $('promptInput').style.height = 'auto';
  $('sendBtn').disabled = true; $('responses').style.display = '';
  setChipsDisabled(true);
  pruneTabs(); ensureTabs();
  if (cfg.consensus) refreshConsensusProgress();

  await Promise.allSettled(list.map(async sel => {
    const r = await streamTo(sel, text);
    order.push(sel.id); results[sel.id] = r;
  }));

  if (cfg.consensus) {
    setConsensusDot(true);
    await runConsensus();
    setConsensusDot(false); setConsensusStep('');
  }
  recordTurn(text);
  setChipsDisabled(false); $('sendBtn').disabled = false;
}

// Save this round into the current conversation thread (unless private mode).
function recordTurn(prompt) {
  if (cfg.private) return;
  if (!order.length) return;
  const answers = {};
  order.forEach(id => { answers[id] = results[id] ?? null; });
  if (!currentThread) {
    currentThread = {
      id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      title: prompt.slice(0, 80), createdAt: Date.now(), updatedAt: Date.now(),
      selections: sels().map(s => ({ id: s.id, provider: s.provider, model: s.model })),
      turns: [],
    };
    history.unshift(currentThread);
  }
  currentThread.turns.push({ prompt, answers, consensus: cfg.consensus ? (lastConsensusText || null) : null });
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
  if (!box) { box = el('div', 'consensus-progress'); box.id = 'consensus-progress'; conv.prepend(box); }

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
async function streamToConsensus(sel, messages) {
  const conv = $('conv_consensus');
  consensusPhase = 'done'; $('consensus-progress')?.remove(); $('empty_consensus')?.remove();
  const pair = assistantPair('Consensus', lastPrompt);
  conv.prepend(pair); conv.scrollTop = 0;
  const bubble = pair.querySelector('.msg.assistant .msg-bubble');
  let full = '';
  bubble.innerHTML = '';
  for await (const chunk of makeGen(sel, messages, cfg)) { full += chunk; bubble.innerHTML = renderMarkdown(full); conv.scrollTop = 0; }
  finishBubble(pair, full);
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
  conv.prepend(pair); conv.scrollTop = 0;
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
  });
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

// ── Models tab ──────────────────────────────────────────────────────────────
function modelOptionsHtml(providerId, selected) {
  const p = PROVIDERS[providerId];
  const known = p.models.some(m => m.value === selected);
  let html = '';
  if (selected && !known)
    html += `<option value="${escapeHtml(selected)}" selected>${statusGlyph(providerId, selected)}${escapeHtml(selected)} (custom)</option>`;
  html += p.models.map(m =>
    `<option value="${escapeHtml(m.value)}"${m.value === selected ? ' selected' : ''}>${statusGlyph(providerId, m.value)}${escapeHtml(m.label)}${m.price ? ' — ' + m.price : ''}</option>`
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
    const hasKey = !!providerKey(cfg, sel.provider);
    const row = el('div', 'sel-row' + (hasKey ? '' : ' needs-key'));
    row.innerHTML =
      `<span class="sel-dot" style="background:${p.color}"></span>` +
      `<span class="sel-name">${escapeHtml(p.short)}</span>` +
      `<select class="field-input sel-model"></select>` +
      (hasKey ? statusBadge(sel.provider, sel.model) : `<span class="sel-warn" title="Add a ${escapeHtml(p.name)} key in the Keys tab">no key</span>`) +
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
const KEY_TIER = { claude: 'Paid', gemini: 'Free tier + paid', openai: 'Paid', openrouter: 'Free + paid', groq: 'Free tier', hf: 'Free credits' };
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
  PROVIDER_IDS.forEach(id => {
    const p = PROVIDERS[id];
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
function renderHistoryList() {
  const wrap = $('sbHistory'); if (!wrap) return;
  if (!history.length) {
    wrap.innerHTML = `<div class="sb-empty">No conversations yet.<br>Your chats are saved here, on this device.</div>`;
    return;
  }
  wrap.innerHTML = history.map(t =>
    `<div class="sb-item${currentThread && currentThread.id === t.id ? ' active' : ''}" data-id="${escapeHtml(t.id)}">` +
    `<div class="sb-item-main"><div class="sb-item-title">${escapeHtml(t.title || 'Untitled')}</div>` +
    `<div class="sb-item-meta">${escapeHtml(timeAgo(t.updatedAt || t.createdAt))} · ${t.turns.length} turn${t.turns.length === 1 ? '' : 's'}</div></div>` +
    `<button class="sb-item-x" title="Delete" data-id="${escapeHtml(t.id)}" aria-label="Delete conversation">×</button></div>`).join('');
  wrap.querySelectorAll('.sb-item').forEach(it => it.onclick = (e) => { if (e.target.closest('.sb-item-x')) return; restoreThread(it.dataset.id); });
  wrap.querySelectorAll('.sb-item-x').forEach(x => x.onclick = (e) => { e.stopPropagation(); deleteThread(x.dataset.id); });
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
  results = {}; order = []; runStatus = {}; consensusPhase = ''; lastConsensusText = '';
  $('tabBar').innerHTML = ''; $('tabPanels').innerHTML = ''; activeTab = null;
  currentThread = t;
  buildChips();
  $('responses').style.display = '';
  ensureTabs();
  (t.turns || []).forEach(turn => {
    (t.selections || []).forEach(sel => {
      const ans = turn.answers ? turn.answers[sel.id] : undefined;
      const co = getConvo(sel.id);
      co.push({ role: 'user', content: turn.prompt });
      if (ans != null) co.push({ role: 'assistant', content: ans });
      renderStaticPair(sel.id, selectionLabel(sel), turn.prompt, ans);
    });
    if (turn.consensus != null) renderStaticConsensus(turn.prompt, turn.consensus);
  });
  lastPrompt = t.turns && t.turns.length ? t.turns[t.turns.length - 1].prompt : '';
  if (cfg.consensus && $('tab_consensus')) switchTab('consensus');
  closeSidebar(); renderHistoryList();
}
function renderStaticPair(selId, label, userContent, answerText) {
  const conv = $('conv_' + selId); if (!conv) return;
  $('empty_' + selId)?.remove();
  const pair = el('div', 'qa-pair');
  pair.innerHTML =
    `<div class="msg user"><span class="msg-label">You</span><div class="msg-bubble">${nl2br(userContent)}</div></div>` +
    `<div class="msg assistant"><div class="msg-head"><span class="msg-label">${escapeHtml(label)}</span>` +
    (answerText == null ? '' : `<button class="copy-btn" title="Copy">${COPY_SVG}</button>`) + `</div>` +
    `<div class="msg-bubble">${answerText == null ? '<span class="msg-error">No response recorded</span>' : renderMarkdown(answerText)}</div></div>`;
  conv.prepend(pair); conv.scrollTop = 0;
  if (answerText != null) { highlightBubble(pair); const b = pair.querySelector('.copy-btn'); if (b) b.onclick = () => copyText(answerText, b); }
}
function renderStaticConsensus(prompt, text) {
  if (!$('conv_consensus')) return;
  const prev = lastPrompt; lastPrompt = prompt;
  showConsensusStatic(text, false);
  lastPrompt = prev;
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
  $('promptInput').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendAll(); } });
  $('promptInput').addEventListener('input', function () { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 260) + 'px'; });
  $('sbTheme').onclick = () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');

  // sidebar + conversation history
  $('sidebarToggle').onclick = toggleSidebar;
  $('sidebarBackdrop').onclick = closeSidebar;
  $('sbNewChat').onclick = newChat;
  $('sbExport').onclick = openExport;
  $('sbImport').onclick = openImport;
  $('sbClear').onclick = clearHistory;
  $('privateSwitch').onclick = togglePrivate;
  $('privateSwitch').onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); togglePrivate(); } };
  renderHistoryList(); updatePrivateUI();

  $('wNext').onclick = welcomeNext; $('wBack').onclick = welcomeBack;
  $('wSkip').onclick = () => dismissWelcome(); $('wClose').onclick = () => dismissWelcome();
  $('wDonate') && ($('wDonate').onclick = (e) => { e.preventDefault(); window.open(DONATE_URL, '_blank', 'noopener'); });

  const hasKeys = configuredProviders(cfg).length > 0;
  const seen = !!localStorage.getItem(WELCOME_KEY);
  if (location.hash === '#settings') setTimeout(() => openConfig(), 200);   // deep-link to settings
  else if (!hasKeys && !seen) setTimeout(showWelcome, 350);
  else if (!hasKeys) setTimeout(() => openConfig('keys'), 400);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
