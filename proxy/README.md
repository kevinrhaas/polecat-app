# Polecat free-demo proxy (Cloudflare Worker)

A tiny Cloudflare Worker that lets first-time visitors try Polecat with **zero
setup**. It holds **one** provider key as a Worker *secret* (never shipped to the
browser) and exposes a rate-limited, OpenAI-compatible endpoint.

**Safe by construction:** only free (`$0`) models are allowed, `max_tokens` is
capped, conversation history is trimmed, requests are rate-limited per visitor,
and CORS is locked to the Polecat origins.

Everything runs on Cloudflare's **free** plan, and OpenRouter `:free` models cost
**nothing**, so the demo has no per-request monetary cost — only the provider's
own free-tier rate limits, which the per-IP limiter spreads across visitors.

---

## What you need
- A free **Cloudflare** account — https://dash.cloudflare.com/sign-up
- A free **OpenRouter** API key — https://openrouter.ai/keys  *(this is the key
  the Worker holds; it never touches the website)*

## Deploy in ~3 minutes (Wrangler CLI — recommended)

```bash
# 1. Install the Cloudflare CLI and sign in (opens a browser)
npm install -g wrangler
wrangler login

# 2. From this folder
cd proxy

# 3. Store your OpenRouter key as a secret (paste it when prompted)
wrangler secret put DEMO_API_KEY

# 4. Ship it
wrangler deploy
```

Wrangler prints a URL like:

```
https://polecat-demo-proxy.<your-subdomain>.workers.dev
```

**Send me that URL** and I'll wire the app's built-in `baseUrl` proxy hook plus a
**"✨ Try it free — no key needed"** button. Quick sanity check yourself:

```bash
curl https://polecat-demo-proxy.<your-subdomain>.workers.dev/health
# → {"ok":true,"service":"polecat-demo-proxy"}
```

## Alternative: Cloudflare dashboard (no CLI)
1. **Workers & Pages → Create → Create Worker** → name it `polecat-demo-proxy` → **Deploy**.
2. **Edit code** → paste the contents of [`worker.js`](./worker.js) → **Deploy**.
3. **Settings → Variables and Secrets**:
   - Add **Secret** `DEMO_API_KEY` = your OpenRouter key.
   - Add **Variables** (optional): `UPSTREAM_BASE`, `DEFAULT_MODEL`, `MAX_TOKENS`, `PER_MIN`.
4. *(Optional)* add the native rate-limit binding under **Settings → Bindings**
   (the dashboard may not expose this yet — the Worker falls back to an
   in-memory limiter, so it's fine to skip).
5. Copy the Worker URL and send it to me.

## Tuning
- `PER_MIN` — requests per minute per visitor (default 8).
- `MAX_TOKENS` — response length cap (default 1024).
- `DEFAULT_MODEL` / the `ALLOWED_MODELS` set in `worker.js` — which free models the demo offers.
- To use **Groq** instead of OpenRouter, set `UPSTREAM_BASE=https://api.groq.com/openai/v1`,
  put a Groq key in `DEMO_API_KEY`, and update `ALLOWED_MODELS` to Groq model ids.

## Endpoints
- `POST /v1/chat/completions` — OpenAI-compatible, streaming. Forces a free model + token cap.
- `GET  /v1/models` — the curated free-model list.
- `GET  /health` — liveness check.
