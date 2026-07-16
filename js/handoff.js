// ─────────────────────────────────────────────────────────────────────────
// handoff.js — the one-time origin-handoff codec for the GATED
// app.polecat.live → chat.polecat.live rename (polecat-platform
// docs/DOMAINS.md). Installed PWAs pin to their origin and localStorage
// does not cross origins, so the old origin's "we moved" stub packs the
// user's data into a `#handoff=<payload>` fragment and the new origin
// imports it on boot (see app.js tryApplyHandoffFromHash).
//
// Payload: JSON → deflate-raw (CompressionStream) → base64url, prefixed
// `v1.`; `v0.` is the uncompressed fallback for browsers without
// CompressionStream. The fragment never reaches any server.
//
// SECURITY: this module only DECODES on the app side. The outbound side
// (handoff-stub/index.html) hardcodes its destination — a URL-chosen
// target would let a crafted link exfiltrate keys. Inbound apply is
// guarded by an explicit user confirmation in app.js.
// ─────────────────────────────────────────────────────────────────────────

function bytesToB64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function b64urlToBytes(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - b64.length % 4) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function pipeThrough(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

export async function encodeHandoff(data) {
  const raw = new TextEncoder().encode(JSON.stringify(data));
  if (typeof CompressionStream === 'function') {
    try {
      const packed = await pipeThrough(raw, new CompressionStream('deflate-raw'));
      return 'v1.' + bytesToB64url(packed);
    } catch { /* fall through to uncompressed */ }
  }
  return 'v0.' + bytesToB64url(raw);
}

export async function decodeHandoff(str) {
  try {
    const dot = str.indexOf('.');
    const ver = str.slice(0, dot), body = str.slice(dot + 1);
    let bytes = b64urlToBytes(body);
    if (ver === 'v1') bytes = await pipeThrough(bytes, new DecompressionStream('deflate-raw'));
    else if (ver !== 'v0') return null;
    const d = JSON.parse(new TextDecoder().decode(bytes));
    return (d && d._polecat === 1) ? d : null;
  } catch { return null; }
}
