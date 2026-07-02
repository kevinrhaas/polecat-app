#!/usr/bin/env node
// validate.mjs — pre-commit / CI guard for the Polecat static app.
//
// Catches the class of bug that has twice broken production: curly/"smart"
// quotes sneaking into source as string or HTML-attribute delimiters. Plain
// `node --check` parses .js in CommonJS/script mode and MISSES these — but the
// browser loads js/app.js as an ES *module*, where the same smart quote is an
// "Invalid or unexpected token" that crashes the whole module and kills every
// event handler (dead menus, no chips, no send).
//
// Two checks, both fatal:
//   1. ES-module parse of every js/*.js file (matches how the browser loads them).
//   2. Reject smart quotes ‘ ’ “ ” anywhere in js/*.js and in HTML attributes.
//
// Usage:  node scripts/validate.mjs        (exit 0 = clean, 1 = problems)

import { readFileSync, writeFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SMART = ['‘', '’', '“', '”']; // ‘ ’ “ ”
const problems = [];

function jsFiles() {
  return readdirSync('js').filter(f => f.endsWith('.js')).map(f => join('js', f));
}

// 1) ES-module parse (the browser's mode), via a temp .mjs so node uses the
//    module parser. Syntax-only: --check never executes the code.
function checkEsmParse(file) {
  const tmp = join(mkdtempSync(join(tmpdir(), 'pcval-')), 'm.mjs');
  writeFileSync(tmp, readFileSync(file));
  try {
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
  } catch (e) {
    const msg = (e.stderr?.toString() || e.message).split('\n').slice(0, 6).join('\n');
    problems.push(`ES-module parse failed in ${file}:\n${msg}`);
  }
}

// 2) Smart-quote scan. In js/*.js a smart quote is always a bug (string or HTML
//    attribute delimiter). In index.html, only flag them inside tag attributes
//    (class=”…”) — curly quotes in prose copy are fine.
function scanSmartQuotesJs(file) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (SMART.some(q => line.includes(q))) {
      problems.push(`Smart quote in ${file}:${i + 1}  →  ${line.trim().slice(0, 100)}`);
    }
  });
}
function scanSmartQuotesHtmlAttrs(file) {
  const src = readFileSync(file, 'utf8').split('\n');
  // match an attribute opened with a curly quote, e.g.  class=”foo”  /  id=‘bar’
  const attr = /=\s*[‘’“”]/;
  src.forEach((line, i) => {
    if (attr.test(line)) problems.push(`Smart-quote HTML attribute in ${file}:${i + 1}  →  ${line.trim().slice(0, 100)}`);
  });
}

// Auto-generated data modules: every string is JSON.stringify'd (properly
// double-quoted), so a smart quote can only ever be string *content*, never a
// delimiter — harmless, and the changelog copy legitimately contains curly
// quotes. Still ES-module-parsed below; only the raw smart-quote line scan skips
// them (the parse is what actually guards against a broken module).
const GENERATED = new Set(['js/changelog.js']);

for (const f of jsFiles()) { checkEsmParse(f); if (!GENERATED.has(f)) scanSmartQuotesJs(f); }
scanSmartQuotesHtmlAttrs('index.html');

if (problems.length) {
  console.error(`\n✗ validate.mjs found ${problems.length} problem(s):\n`);
  for (const p of problems) console.error('  • ' + p + '\n');
  console.error('Fix these before committing — they will break the live app.\n');
  process.exit(1);
}
console.log('✓ validate.mjs: all JS parses as ES modules and no smart quotes found.');
