// ─────────────────────────────────────────────────────────────────────────
// providers.js — provider catalog, model lists, and streaming API generators.
//
// `kind` drives which generator runs:
//   anthropic          → apiClaude          (x-api-key + direct-browser header)
//   gemini             → apiGemini          (?key= query param, streamGenerateContent)
//   openai-compatible  → apiOpenAICompatible (Bearer key, /chat/completions SSE)
//
// CORS for browser-direct calls verified June 2026 for OpenRouter / Groq / HF
// (all return access-control-allow-origin: * and accept the authorization header).
// baseUrl is intentionally overridable so a future serverless proxy can be
// dropped in without touching call sites.
// ─────────────────────────────────────────────────────────────────────────

import { providerKey } from './config.js';

// Free zero-config demo: routes through a rate-limited Cloudflare Worker that
// holds the key server-side (never in the browser). No API key required here.
// Set to '' to hide the demo entirely.
export const DEMO_PROXY_URL = 'https://polecat-app.kevinrhaas.workers.dev';

// Polecat's own free community model server (OpenAI-compatible: FastAPI + Ollama
// behind Caddy). BYO-key (sk-ms-…) so the box stays healthy — no shared key to
// abuse. To ENABLE it, set POLECAT_MS_URL to the deployed origin (no trailing
// slash). It stays hidden while '' (same pattern as the demo).
//   ⚠ Browser-direct calls require CORS on the server: Access-Control-Allow-Origin
//     for https://polecat.live (+ OPTIONS preflight, allow Authorization +
//     Content-Type). If Caddy can't send those, front it with a Worker proxy and
//     point POLECAT_MS_URL at the proxy instead.
//   POLECAT_MS_KEY_URL → the captcha-gated "get a free key" page once it exists.
// Live as of 2026-06-27 — CORS enabled in Caddy (OPTIONS → 204 with
// Access-Control-Allow-Origin), so browser-direct calls work. Set to '' to hide.
export const POLECAT_MS_URL     = 'https://modelserver.polecat.live';
export const POLECAT_MS_KEY_URL = '';   // → the captcha get-key page once it exists

export const PROVIDERS = {
  demo: {
    id: 'demo', name: 'Free demo', short: 'Free demo', vendor: 'Polecat',
    color: '#10b981', kind: 'openai-compatible',
    baseUrl: DEMO_PROXY_URL + '/v1',
    noKey: true, demo: true,
    rateNote: 'No key needed — rate-limited free models so you can try Polecat instantly.',
    models: [
      { value: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B', price: 'free', free: true },
      { value: 'openai/gpt-oss-120b:free',               label: 'GPT-OSS 120B',  price: 'free', free: true },
      { value: 'qwen/qwen3-coder:free',                  label: 'Qwen3 Coder',   price: 'free', free: true },
      { value: 'google/gemma-4-31b-it:free',             label: 'Gemma 4 31B',   price: 'free', free: true },
    ],
  },
  claude: {
    id: 'claude', name: 'Claude', short: 'Claude', vendor: 'Anthropic',
    color: '#d4773b', kind: 'anthropic',
    placeholder: 'sk-ant-api03-…',
    keyUrl: 'https://console.anthropic.com', keyLabel: 'console.anthropic.com',
    openUrl: 'https://claude.ai/new',
    models: [
      { value: 'claude-opus-4-8',            label: 'Opus 4.8',   price: '$$$$', vision: true },
      { value: 'claude-sonnet-4-6',          label: 'Sonnet 4.6', price: '$$$',  vision: true },
      { value: 'claude-haiku-4-5-20251001',  label: 'Haiku 4.5',  price: '$$',   vision: true },
      { value: 'claude-opus-4-7',            label: 'Opus 4.7',   price: '$$$$', vision: true },
      { value: 'claude-sonnet-4-5-20250929', label: 'Sonnet 4.5', price: '$$$',  vision: true },
      { value: 'claude-opus-4-1-20250805',   label: 'Opus 4.1',   price: '$$$$', vision: true },
    ],
  },
  gemini: {
    id: 'gemini', name: 'Gemini', short: 'Gemini', vendor: 'Google',
    color: '#4285f4', kind: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    placeholder: 'AIzaSy…',
    keyUrl: 'https://aistudio.google.com', keyLabel: 'aistudio.google.com',
    openUrl: 'https://gemini.google.com/app',
    models: [
      { value: 'gemini-3.5-flash',       label: '3.5 Flash', price: '$$',  vision: true },
      { value: 'gemini-3.1-pro-preview', label: '3.1 Pro',   price: '$$$', vision: true },
      { value: 'gemini-3-flash-preview', label: '3 Flash',   price: '$$',  vision: true },
      { value: 'gemini-3.1-flash-lite',  label: '3.1 Lite',  price: '$',   vision: true },
      { value: 'gemini-2.5-pro',         label: '2.5 Pro',   price: '$$$', vision: true },
      { value: 'gemini-2.5-flash',       label: '2.5 Flash', price: '$',   vision: true },
      { value: 'gemini-2.5-flash-lite',  label: '2.5 Lite',  price: '$',   vision: true },
      { value: 'gemini-2.0-flash',       label: '2.0 Flash', price: '$',   vision: true },
      { value: 'gemini-2.0-flash-lite',  label: '2.0 Lite',  price: '$',   vision: true },
    ],
  },
  openai: {
    id: 'openai', name: 'ChatGPT', short: 'GPT', vendor: 'OpenAI',
    color: '#10a37f', kind: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    placeholder: 'sk-proj-…',
    keyUrl: 'https://platform.openai.com', keyLabel: 'platform.openai.com',
    openUrl: 'https://chatgpt.com/',
    models: [
      { value: 'gpt-5.5',      label: 'GPT-5.5',  price: '$$$', vision: true },
      { value: 'gpt-5.4',      label: 'GPT-5.4',  price: '$$$', vision: true },
      { value: 'gpt-5.4-mini', label: '5.4 mini', price: '$$',  vision: true },
      { value: 'gpt-4o',       label: 'GPT-4o',   price: '$$$', vision: true },
      { value: 'gpt-4o-mini',  label: '4o mini',  price: '$',   vision: true },
    ],
  },

  // ── Free / public-model providers (OpenAI-compatible) ───────────────────
  openrouter: {
    id: 'openrouter', name: 'OpenRouter', short: 'OpenRouter', vendor: 'OpenRouter',
    color: '#8b5cf6', kind: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    placeholder: 'sk-or-v1-…',
    keyUrl: 'https://openrouter.ai/keys', keyLabel: 'openrouter.ai/keys',
    allowCustomModel: true,
    rateNote: 'Free models: ~20 req/min, ~200/day. 337+ models — type any model id.',
    extraHeaders: { 'HTTP-Referer': 'https://polecat.live', 'X-Title': 'Polecat' },
    models: [
      { value: 'meta-llama/llama-3.3-70b-instruct:free',      label: 'Llama 3.3 70B',   price: 'free', free: true },
      { value: 'openai/gpt-oss-120b:free',                    label: 'GPT-OSS 120B',    price: 'free', free: true },
      { value: 'openai/gpt-oss-20b:free',                     label: 'GPT-OSS 20B',     price: 'free', free: true },
      { value: 'qwen/qwen3-coder:free',                       label: 'Qwen3 Coder',     price: 'free', free: true },
      { value: 'qwen/qwen3-next-80b-a3b-instruct:free',       label: 'Qwen3 Next 80B',  price: 'free', free: true },
      { value: 'nvidia/nemotron-3-super-120b-a12b:free',      label: 'Nemotron 120B',   price: 'free', free: true },
      { value: 'nousresearch/hermes-3-llama-3.1-405b:free',   label: 'Hermes 3 405B',   price: 'free', free: true },
      { value: 'google/gemma-4-31b-it:free',                  label: 'Gemma 4 31B',     price: 'free', free: true },
    ],
  },
  groq: {
    id: 'groq', name: 'Groq', short: 'Groq', vendor: 'Groq',
    color: '#f55036', kind: 'openai-compatible',
    baseUrl: 'https://api.groq.com/openai/v1',
    placeholder: 'gsk_…',
    keyUrl: 'https://console.groq.com/keys', keyLabel: 'console.groq.com/keys',
    allowCustomModel: true,
    rateNote: 'Ultra-fast LPU inference. Free tier ~30 req/min.',
    models: [
      { value: 'llama-3.3-70b-versatile',  label: 'Llama 3.3 70B', price: 'free', free: true },
      { value: 'llama-3.1-8b-instant',     label: 'Llama 3.1 8B',  price: 'free', free: true },
      { value: 'openai/gpt-oss-120b',      label: 'GPT-OSS 120B',  price: 'free', free: true },
      { value: 'openai/gpt-oss-20b',       label: 'GPT-OSS 20B',   price: 'free', free: true },
      { value: 'qwen/qwen3-32b',           label: 'Qwen3 32B',     price: 'free', free: true },
      { value: 'moonshotai/kimi-k2-instruct', label: 'Kimi K2',    price: 'free', free: true },
    ],
  },
  hf: {
    id: 'hf', name: 'Hugging Face', short: 'HF', vendor: 'Hugging Face',
    color: '#ffb000', kind: 'openai-compatible',
    baseUrl: 'https://router.huggingface.co/v1',
    placeholder: 'hf_…',
    keyUrl: 'https://huggingface.co/settings/tokens', keyLabel: 'huggingface.co/settings/tokens',
    allowCustomModel: true,
    rateNote: 'Routes to 15+ open-source inference partners. Monthly free credits.',
    models: [
      { value: 'meta-llama/Llama-3.3-70B-Instruct',   label: 'Llama 3.3 70B',  price: 'open', free: true },
      { value: 'Qwen/Qwen3-235B-A22B-Instruct-2507',  label: 'Qwen3 235B',     price: 'open', free: true },
      { value: 'deepseek-ai/DeepSeek-V3.1',           label: 'DeepSeek V3.1',  price: 'open', free: true },
      { value: 'openai/gpt-oss-120b',                 label: 'GPT-OSS 120B',   price: 'open', free: true },
    ],
  },

  // ── Polecat's own free community model server (OpenAI-compatible) ────────
  polecatms: {
    id: 'polecatms', name: 'Polecat Model Server', short: 'Polecat MS', vendor: 'Polecat',
    color: '#06b6d4', kind: 'openai-compatible',
    baseUrl: POLECAT_MS_URL + '/v1',
    placeholder: 'sk-ms-…',
    keyUrl: POLECAT_MS_KEY_URL || POLECAT_MS_URL, keyLabel: POLECAT_MS_KEY_URL ? 'get a free key' : 'modelserver.polecat.live',
    allowCustomModel: true,
    rateNote: "Polecat's own free community server — bring a free sk-ms- key. Per-key rate limits apply; be kind so it stays up for everyone.",
    models: [
      { value: 'qwen2.5:7b',     label: 'Qwen2.5 7B',     price: 'free', free: true },
      { value: 'llama3.2:3b',    label: 'Llama 3.2 3B',   price: 'free', free: true },
      { value: 'deepseek-r1:7b', label: 'DeepSeek-R1 7B', price: 'free', free: true },
    ],
  },
};

if (!DEMO_PROXY_URL) delete PROVIDERS.demo;        // demo disabled → hide it entirely
if (!POLECAT_MS_URL) delete PROVIDERS.polecatms;   // model server URL unset → hide it

export const PROVIDER_IDS = Object.keys(PROVIDERS);

export function modelLabel(providerId, value) {
  const p = PROVIDERS[providerId];
  return p?.models.find(m => m.value === value)?.label || value;
}
// Does this model accept image inputs? Only curated models carry the flag;
// custom / live-browsed model ids are treated as text-only (conservative — we
// never claim a model can see images unless we know it can).
export function modelSupportsVision(providerId, value) {
  const p = PROVIDERS[providerId];
  return !!p?.models.find(m => m.value === value)?.vision;
}
export function defaultModel(providerId) {
  return PROVIDERS[providerId]?.models[0]?.value;
}
export function selectionLabel(selection) {
  const p = PROVIDERS[selection?.provider];
  if (!p) return selection?.model || 'Model';
  return `${p.short} · ${modelLabel(selection.provider, selection.model)}`;
}

// ── SSE reader (shared) ─────────────────────────────────────────────────────
async function* sseReader(response, extract) {
  const reader = response.body.getReader();
  const dec = new TextDecoder();
  let buf = '', evtName = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('event:'))     { evtName = line.slice(6).trim(); }
      else if (line.startsWith('data:')) {
        const raw = line.slice(5).trim();
        if (raw === '[DONE]') return;
        try { const d = JSON.parse(raw); const c = extract(evtName, d); if (c) yield c; } catch {}
        evtName = null;
      } else if (line === '') { evtName = null; }
    }
  }
}

// ── Request timeout (targets "model never responds": aborts if no first byte) ──
const DEFAULT_TIMEOUT_MS = 90000;
function reqSignal(opts = {}) {
  if (opts.signal) return { signal: opts.signal, done() {} };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS);
  return { signal: ctrl.signal, done() { clearTimeout(timer); } };
}
async function* streamWithTimeout(resp, extract, onFirst) {
  let first = true;
  for await (const c of sseReader(resp, extract)) {
    if (first) { first = false; if (onFirst) onFirst(); }   // got data → cancel the abort timer
    yield c;
  }
}

// ── Image attachments ─────────────────────────────────────────────────────
// A message may carry `images: [{ mime, data(base64) }]`. Each provider wants a
// different shape; these builders fold images into the content only when the
// target model is vision-capable (opts.vision) — otherwise the model gets the
// text alone (so a mixed line-up "just works", text-only models silently skip).
function hasImages(m) { return m.role === 'user' && Array.isArray(m.images) && m.images.length > 0; }
function claudeContent(m, vision) {
  if (!vision || !hasImages(m)) return m.content;
  return [
    ...m.images.map(im => ({ type: 'image', source: { type: 'base64', media_type: im.mime, data: im.data } })),
    ...(m.content ? [{ type: 'text', text: m.content }] : []),
  ];
}
function oaiContent(m, vision) {
  if (!vision || !hasImages(m)) return m.content;
  return [
    ...(m.content ? [{ type: 'text', text: m.content }] : []),
    ...m.images.map(im => ({ type: 'image_url', image_url: { url: `data:${im.mime};base64,${im.data}` } })),
  ];
}

// ── Anthropic ───────────────────────────────────────────────────────────────
async function* apiClaude(messages, key, model, opts = {}) {
  const { signal, done } = reqSignal(opts);
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal,
      headers: {
        'x-api-key': key, 'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true', 'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'claude-opus-4-8', max_tokens: opts.maxTokens || 8096, stream: true,
        messages: messages.map(m => ({ role: m.role, content: claudeContent(m, opts.vision) })),
      }),
    });
    if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${resp.status}`); }
    yield* streamWithTimeout(resp, (_, d) => d?.type === 'content_block_delta' && d?.delta?.type === 'text_delta' ? d.delta.text : null, done);
  } finally { done(); }
}

// ── Gemini ──────────────────────────────────────────────────────────────────
function geminiContents(messages, vision) {
  const out = [];
  for (const m of messages) {
    const role = m.role === 'assistant' ? 'model' : 'user';
    const parts = [];
    if (vision && hasImages(m)) for (const im of m.images) parts.push({ inline_data: { mime_type: im.mime, data: im.data } });
    if (m.content) parts.push({ text: m.content });
    if (!parts.length) parts.push({ text: '' });
    const last = out[out.length - 1];
    // merge consecutive same-role text turns, but never merge a turn carrying images
    if (last && last.role === role && !(vision && hasImages(m))) last.parts.push(...parts);
    else out.push({ role, parts });
  }
  return out;
}
async function* apiGemini(messages, key, model, opts = {}) {
  const m = model || 'gemini-3.5-flash';
  const { signal, done } = reqSignal(opts);
  try {
    const body = { contents: geminiContents(messages, opts.vision) };
    if (opts.maxTokens) body.generationConfig = { maxOutputTokens: opts.maxTokens };
    const resp = await fetch(
      `${PROVIDERS.gemini.baseUrl}/models/${m}:streamGenerateContent?key=${key}&alt=sse`,
      { method: 'POST', signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
    );
    if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${resp.status}`); }
    yield* streamWithTimeout(resp, (_, d) => d?.candidates?.[0]?.content?.parts?.[0]?.text ?? null, done);
  } finally { done(); }
}

// ── OpenAI-compatible (OpenAI / OpenRouter / Groq / HF) ──────────────────────
async function* apiOpenAICompatible(messages, key, model, provider, opts = {}) {
  const { signal, done } = reqSignal(opts);
  try {
    const body = { model, stream: true, messages: messages.map(m => ({ role: m.role, content: oaiContent(m, opts.vision) })) };
    if (opts.maxTokens) body.max_tokens = opts.maxTokens;
    const headers = { 'content-type': 'application/json', ...(provider.extraHeaders || {}) };
    if (key) headers['authorization'] = `Bearer ${key}`;   // demo proxy needs none — it holds the key
    const resp = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST', signal, headers,
      body: JSON.stringify(body),
    });
    if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error?.message || e.message || `HTTP ${resp.status}`); }
    yield* streamWithTimeout(resp, (_, d) => d?.choices?.[0]?.delta?.content ?? null, done);
  } finally { done(); }
}

// ── Dispatch ─────────────────────────────────────────────────────────────────
// selection = { id, provider, model };  opts = { maxTokens, signal, timeoutMs }
export function makeGen(selection, messages, cfg, opts = {}) {
  const p   = PROVIDERS[selection.provider];
  const key = providerKey(cfg, selection.provider);
  if (!p) throw new Error(`Unknown provider: ${selection.provider}`);
  // Only forward images to models we know can read them.
  opts = { ...opts, vision: modelSupportsVision(selection.provider, selection.model) };
  if (p.kind === 'anthropic') return apiClaude(messages, key, selection.model, opts);
  if (p.kind === 'gemini')    return apiGemini(messages, key, selection.model, opts);
  return apiOpenAICompatible(messages, key, selection.model, p, opts);
}

// Lightweight availability probe: tiny request + short timeout. Returns { ok, error? }.
export async function probeModel(selection, cfg, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const gen = makeGen(selection, [{ role: 'user', content: 'ping' }], cfg, { maxTokens: 5, signal: ctrl.signal });
    for await (const _ of gen) break;   // first token (or clean completion) ⇒ alive
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.name === 'AbortError' ? 'timed out' : (e?.message || 'error') };
  } finally {
    clearTimeout(timer); ctrl.abort();
  }
}

// ── Live model catalog (OpenAI-compatible /models) ──────────────────────────
const _modelCache = {};   // providerId -> { ts, list }
export function modelListSupported(providerId) {
  const p = PROVIDERS[providerId];
  return !!(p && p.kind === 'openai-compatible' && p.baseUrl);   // OpenRouter/Groq/HF/OpenAI
}
export async function listModels(providerId, cfg, force = false) {
  if (!modelListSupported(providerId)) throw new Error('No live model list for this provider');
  const p = PROVIDERS[providerId];
  const cached = _modelCache[providerId];
  if (!force && cached && Date.now() - cached.ts < 3600000) return cached.list;   // 1h cache
  const key = providerKey(cfg, providerId);
  const headers = { ...(p.extraHeaders || {}) };
  if (key) headers['authorization'] = `Bearer ${key}`;        // OpenRouter /models is public; others need a key
  const resp = await fetch(`${p.baseUrl}/models`, { headers });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error?.message || `HTTP ${resp.status}${resp.status === 401 ? ' — add an API key first' : ''}`);
  }
  const data = await resp.json();
  const list = (data.data || data.models || []).map(m => {
    const id = m.id || m.name || '';
    const pr = m.pricing || {};
    const free = (pr.prompt === '0' && pr.completion === '0') || /:free$/.test(id);
    return { id, free, ctx: m.context_length || m.context_window || 0 };
  }).filter(m => m.id);
  list.sort((a, b) => (b.free - a.free) || a.id.localeCompare(b.id));   // free first, then alpha
  _modelCache[providerId] = { ts: Date.now(), list };
  return list;
}
