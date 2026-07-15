// ─────────────────────────────────────────────────────────────────────────
// ui.js — stateless view helpers (DOM utils, markdown, toast).
// Theme lives in vendor/polecat-shell/theme.js (configured with the app's
// historical 'polecat_theme' key in app.js buildFrame()).
// NOTE: these helpers predate the shell and keep their historical signatures
// ($ takes an ID, el takes (tag, cls, html)) — the vendored ui.js has
// different contracts, so a wholesale swap is a shell-v2 candidate, same
// call Manager made for its js/ui.js.
// ─────────────────────────────────────────────────────────────────────────

export const $  = (id) => document.getElementById(id);
export function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
export function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
export const nl2br = (s) => escapeHtml(s).replace(/\n/g, '<br>');

export function renderMarkdown(text) {
  if (typeof marked === 'undefined') return nl2br(text);
  return marked.parse(text);
}
export function highlightBubble(node) {
  node.querySelectorAll('pre code').forEach(b => { if (typeof hljs !== 'undefined') hljs.highlightElement(b); });
}

let _tt;
export function toast(msg, dur = 2800) {
  const t = $('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(_tt); _tt = setTimeout(() => t.classList.remove('show'), dur);
}

