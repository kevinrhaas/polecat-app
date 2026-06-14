// ─────────────────────────────────────────────────────────────────────────
// ui.js — stateless view helpers (DOM utils, markdown, toast, theme).
// ─────────────────────────────────────────────────────────────────────────
import { THEME_KEY } from './config.js';

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

const SUN  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const MOON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
export function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(THEME_KEY, t);
  const btn = $('themeBtn'); if (btn) btn.innerHTML = t === 'dark' ? SUN : MOON;
  const l = $('hljs-theme'); if (l) l.disabled = (t === 'light');
}
export function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}
