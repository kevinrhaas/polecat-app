// ─────────────────────────────────────────────────────────────────────────
// Polecat free-demo proxy — Cloudflare Worker
//
// Lets first-time visitors try Polecat with ZERO setup. It holds ONE provider
// key as a Worker *secret* (never shipped to the browser) and exposes a
// rate-limited, OpenAI-compatible endpoint. Safe by construction:
//   • only free ($0) models are allowed (curated allowlist)
//   • max_tokens is capped, history is trimmed
//   • per-IP rate limiting (native binding if present, in-memory fallback)
//   • CORS locked to the Polecat origins; other Origins are rejected
//
// Deploy: see proxy/README.md. Set the key with:  wrangler secret put DEMO_API_KEY
// ─────────────────────────────────────────────────────────────────────────

const DEFAULTS = {
  UPSTREAM_BASE: 'https://openrouter.ai/api/v1',
  DEFAULT_MODEL: 'meta-llama/llama-3.3-70b-instruct:free',
  MAX_TOKENS: 1024,
  PER_MIN: 8,
};

// Only these models may be requested through the demo (all free on OpenRouter).
const ALLOWED_MODELS = new Set([
  'meta-llama/llama-3.3-70b-instruct:free',
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'qwen/qwen3-coder:free',
  'google/gemma-4-31b-it:free',
]);

const ALLOWED_ORIGINS = [
  'https://app.polecat.live',
  'https://polecat.live',
  'http://localhost:8137',
  'http://127.0.0.1:8137',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : 'https://app.polecat.live';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

// Per-isolate in-memory fallback limiter (used when the rate-limit binding
// isn't configured). Fixed 60s window.
const mem = new Map();
function memLimit(ip, perMin) {
  const win = Math.floor(Date.now() / 60000);
  const k = ip + ':' + win;
  const n = (mem.get(k) || 0) + 1;
  mem.set(k, n);
  if (mem.size > 5000) for (const key of mem.keys()) if (Number(key.split(':').pop()) !== win) mem.delete(key);
  return n <= perMin;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const ch = corsHeaders(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: ch });

    // Reject browser requests coming from disallowed sites (other origins
    // can't embed the demo). Requests with no Origin (e.g. curl) fall through
    // to rate limiting + the free-model cap.
    if (origin && !ALLOWED_ORIGINS.includes(origin))
      return json({ error: { message: 'Origin not allowed for the Polecat demo.' } }, 403, ch);

    if (url.pathname === '/' || url.pathname === '/health')
      return json({ ok: true, service: 'polecat-demo-proxy' }, 200, ch);

    const base = env.UPSTREAM_BASE || DEFAULTS.UPSTREAM_BASE;
    const perMin = Number(env.PER_MIN || DEFAULTS.PER_MIN);
    const ip = request.headers.get('CF-Connecting-IP') || 'anon';

    // Curated model list (so the app's "browse models" shows only free demo models).
    if (url.pathname.endsWith('/models') && request.method === 'GET')
      return json({ object: 'list', data: [...ALLOWED_MODELS].map(id => ({ id, object: 'model' })) }, 200, ch);

    if (!url.pathname.endsWith('/chat/completions') || request.method !== 'POST')
      return json({ error: { message: 'Not found' } }, 404, ch);

    if (!env.DEMO_API_KEY)
      return json({ error: { message: 'Demo is not configured yet (missing DEMO_API_KEY secret).' } }, 503, ch);

    // ── Rate limit ──
    let ok = true;
    if (env.DEMO_RL && typeof env.DEMO_RL.limit === 'function') {
      try { ok = (await env.DEMO_RL.limit({ key: ip })).success; } catch { ok = memLimit(ip, perMin); }
    } else ok = memLimit(ip, perMin);
    if (!ok)
      return json({ error: { message: `Free demo limit reached (${perMin}/min). Add your own free key in Settings → Keys for unlimited use — it stays in your browser.` } }, 429, ch);

    // ── Sanitize the request ──
    let body;
    try { body = await request.json(); } catch { return json({ error: { message: 'Invalid JSON body' } }, 400, ch); }
    const model = ALLOWED_MODELS.has(body.model) ? body.model : (env.DEFAULT_MODEL || DEFAULTS.DEFAULT_MODEL);
    const maxTokens = Math.min(Number(body.max_tokens) || DEFAULTS.MAX_TOKENS, Number(env.MAX_TOKENS || DEFAULTS.MAX_TOKENS));
    const safe = {
      model,
      stream: body.stream !== false,
      max_tokens: maxTokens,
      messages: Array.isArray(body.messages) ? body.messages.slice(-20) : [],
    };
    if (typeof body.temperature === 'number') safe.temperature = body.temperature;

    // ── Proxy upstream, falling back across free models ──
    // Free models can be individually flaky ("Provider returned error"), so we
    // try the requested model first, then the rest of the allowlist, and only
    // start streaming once one responds OK. If all fail, surface the real error.
    const upstreamHeaders = {
      'Authorization': `Bearer ${env.DEMO_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://app.polecat.live',
      'X-Title': 'Polecat Free Demo',
    };
    const candidates = [model, ...[...ALLOWED_MODELS].filter(m => m !== model)];
    let lastErr = '';
    for (const m of candidates) {
      let upstream;
      try {
        upstream = await fetch(`${base}/chat/completions`, {
          method: 'POST', headers: upstreamHeaders, body: JSON.stringify({ ...safe, model: m }),
        });
      } catch (e) { lastErr = e?.message || 'network error'; continue; }

      if (upstream.ok) {
        const headers = new Headers();
        for (const [k, v] of Object.entries(ch)) headers.set(k, v);
        headers.set('Content-Type', upstream.headers.get('Content-Type') || 'text/event-stream');
        return new Response(upstream.body, { status: 200, headers });
      }
      lastErr = (await upstream.text().catch(() => '')) || `HTTP ${upstream.status}`;
      // 401/403 = key/account problem — same for every model, so stop early.
      if (upstream.status === 401 || upstream.status === 403) break;
    }
    return json({ error: { message: 'All free demo models are unavailable right now. Upstream said: ' + String(lastErr).slice(0, 300) } }, 502, ch);
  },
};
