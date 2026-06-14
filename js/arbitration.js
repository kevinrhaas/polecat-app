// ─────────────────────────────────────────────────────────────────────────
// arbitration.js — consensus strategies + the engine that runs them.
//
// A strategy has a `structure` that decides the control flow:
//   chain  → each model refines a running draft in turn (last one streams)
//   judge  → one arbiter sees all N answers and produces the result in one pass
//   debate → arbiter critiques all answers (silent), then synthesizes (streamed)
//
// runArbitration() is DOM-free: app.js passes a `ctx` of callbacks so this stays
// pure orchestration and is easy to test/extend.
// ─────────────────────────────────────────────────────────────────────────

import { PROVIDERS } from './providers.js';
import { newId } from './config.js';

export const DEFAULT_STRATEGIES = [
  {
    id: 'sequential', name: 'Sequential Refinement', builtin: true,
    description: 'Each model refines a running draft in turn. Balanced default.',
    structure: 'chain', arbiter: 'last-done',
    prompts: {
      refine: `Here is a well-researched draft answer to the question:\n\n---\n{draft}\n---\n\nUsing your own knowledge alongside this draft, produce the most complete and accurate answer possible — well-organized, correct, and self-contained.`,
    },
  },
  {
    id: 'comprehensive', name: 'Single Judge — Comprehensive', builtin: true,
    description: 'One arbiter merges all answers into the most complete, well-structured response.',
    structure: 'judge', arbiter: 'most-capable',
    prompts: {
      judge: `You are synthesizing the best possible answer to this question:\n\n"{prompt}"\n\nBelow are {n} independent answers from different AI models:\n\n{answers}\n\nMerge them into a single, comprehensive, well-organized answer that captures every useful insight. Resolve overlaps, keep the best phrasing, and ensure nothing valuable is lost. Do not mention the individual models or that you are merging — just give the answer.`,
    },
  },
  {
    id: 'best', name: 'Single Judge — Best Answer', builtin: true,
    description: 'Arbiter picks the single strongest answer and lightly corrects it. Decisive over exhaustive.',
    structure: 'judge', arbiter: 'most-capable',
    prompts: {
      judge: `Evaluate these {n} independent answers to the question:\n\n"{prompt}"\n\n{answers}\n\nIdentify the single strongest, most correct answer. Return that answer, lightly corrected for any clear errors or omissions — but do NOT blend the others in. Prioritize accuracy and decisiveness over completeness. Output only the final answer.`,
    },
  },
  {
    id: 'validated', name: 'Validated Synthesis', builtin: true,
    description: 'Merges everything, but cross-checks claims, keeps only well-supported points, and flags real disagreements.',
    structure: 'judge', arbiter: 'most-capable',
    prompts: {
      judge: `You are a careful, skeptical editor producing a validated answer to:\n\n"{prompt}"\n\nHere are {n} independent answers:\n\n{answers}\n\nProduce the most comprehensive answer you can, but VALIDATE as you go:\n- Include a claim only if it is well-supported or you are confident it is correct.\n- Drop unsupported, speculative, or likely-wrong claims.\n- Where the answers genuinely disagree on something important, briefly flag the disagreement and give your best judgment.\nReturn a clear, trustworthy answer.`,
    },
  },
  {
    id: 'debate', name: 'Debate & Synthesize', builtin: true,
    description: 'Critiques the answers against each other, then synthesizes the validated best. Highest quality, more calls.',
    structure: 'debate', arbiter: 'most-capable',
    prompts: {
      critique: `Here are {n} independent answers to the question:\n\n"{prompt}"\n\n{answers}\n\nCritically analyze them: where do they agree, where do they disagree, and what are the likely errors or weak points in each? Be specific and concise.`,
      synth: `Based on your critique above, now write the single definitive best answer to the question. Integrate the strongest, validated points, correct the errors you identified, and resolve the disagreements. Output only the final answer.`,
    },
  },
];

// ── Strategy registry ───────────────────────────────────────────────────────
export function allStrategies(cfg) {
  return [...DEFAULT_STRATEGIES, ...(cfg.arbitration?.custom || [])];
}
export function getStrategy(cfg, id) {
  return allStrategies(cfg).find(s => s.id === id) || DEFAULT_STRATEGIES[0];
}
export function activeStrategy(cfg) {
  return getStrategy(cfg, cfg.arbitration?.activeId);
}

// ── Helpers ───────────────────────────────────────────────────────────────
function fill(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
function formatAnswers(results, labelOf) {
  return results.map((r, i) => `### Answer ${i + 1} — ${labelOf(r.selection)}\n${r.text}`).join('\n\n');
}
const PROV_RANK = { claude: 6, openai: 5, gemini: 4, openrouter: 3, hf: 2, groq: 1 };
function modelPriceScore(sel) {
  const m = PROVIDERS[sel.provider]?.models.find(x => x.value === sel.model);
  return m ? (m.price.match(/\$/g) || []).length : 1;
}
function mostCapable(results) {
  return [...results].map(r => r.selection).sort((a, b) =>
    ((PROV_RANK[b.provider] || 0) + modelPriceScore(b) * 2) -
    ((PROV_RANK[a.provider] || 0) + modelPriceScore(a) * 2)
  )[0];
}
function resolveArbiter(strategy, results, overrideId) {
  if (overrideId && overrideId !== 'auto') {            // explicit user pick from settings
    const f = results.find(r => r.selection.id === overrideId);
    if (f) return f.selection;                          // (only if it actually produced a result)
  }
  const a = strategy.arbiter;
  if (a === 'first-done')   return results[0].selection;
  if (a === 'last-done')    return results[results.length - 1].selection;
  if (a === 'most-capable') return mostCapable(results);
  const found = results.find(r => r.selection.id === a);  // specific selection id
  return found ? found.selection : results[0].selection;
}

// ── Engine ───────────────────────────────────────────────────────────────
// ctx = { prompt, results:[{selection,text}], labelOf(sel)->str,
//         silent(sel,msgs)->Promise<str>, stream(sel,msgs)->Promise<str>,
//         status(text), step(label), showStatic(text), fail(text) }
export async function runArbitration(strategy, ctx) {
  const { results } = ctx;
  if (!results.length) { ctx.fail('All models failed to respond — no consensus available.'); return; }
  if (results.length === 1) { ctx.showStatic(results[0].text); return; }

  if (strategy.structure === 'chain')  return runChain(strategy, ctx);
  if (strategy.structure === 'debate') return runDebate(strategy, ctx);
  return runJudge(strategy, ctx);
}

async function runChain(strategy, ctx) {
  const { prompt } = ctx;
  // Order results so a chosen arbiter (if any) produces the final, streamed answer.
  let seq = ctx.results;
  if (ctx.arbiterId && ctx.arbiterId !== 'auto') {
    const fin = ctx.results.find(r => r.selection.id === ctx.arbiterId);
    if (fin) seq = [...ctx.results.filter(r => r.selection.id !== ctx.arbiterId), fin];
  }
  let draft = seq[0].text;
  for (let i = 1; i < seq.length; i++) {
    const r = seq[i];
    const msgs = [
      { role: 'user', content: prompt },
      { role: 'assistant', content: r.text },
      { role: 'user', content: fill(strategy.prompts.refine, { draft, prompt }) },
    ];
    ctx.step(`${ctx.labelOf(r.selection)} refining`);
    if (i < seq.length - 1) {
      ctx.status(`Refining (${i}/${seq.length - 1})…`);
      try { draft = await ctx.silent(r.selection, msgs); } catch { /* keep draft */ }
    } else {
      ctx.status('Finalizing consensus…');
      try { await ctx.stream(r.selection, msgs); } catch { ctx.showStatic(draft); }
    }
  }
}

async function runJudge(strategy, ctx) {
  const { prompt, results } = ctx;
  const arbiter = resolveArbiter(strategy, results, ctx.arbiterId);
  const answers = formatAnswers(results, ctx.labelOf);
  const judgePrompt = fill(strategy.prompts.judge, { prompt, answers, n: results.length });
  ctx.status('Synthesizing…');
  ctx.step(`${ctx.labelOf(arbiter)} judging`);
  try { await ctx.stream(arbiter, [{ role: 'user', content: judgePrompt }]); }
  catch { ctx.showStatic(results[0].text); }
}

async function runDebate(strategy, ctx) {
  const { prompt, results } = ctx;
  const arbiter = resolveArbiter(strategy, results, ctx.arbiterId);
  const answers = formatAnswers(results, ctx.labelOf);
  const critiquePrompt = fill(strategy.prompts.critique, { prompt, answers, n: results.length });
  ctx.status('Reviewing perspectives…');
  ctx.step(`${ctx.labelOf(arbiter)} critiquing`);
  let critique = '';
  try { critique = await ctx.silent(arbiter, [{ role: 'user', content: critiquePrompt }]); } catch {}
  ctx.status('Finalizing consensus…');
  ctx.step(`${ctx.labelOf(arbiter)} synthesizing`);
  const msgs = [
    { role: 'user', content: critiquePrompt },
    { role: 'assistant', content: critique || '(no critique produced)' },
    { role: 'user', content: strategy.prompts.synth },
  ];
  try { await ctx.stream(arbiter, msgs); }
  catch { ctx.showStatic(results[0].text); }
}

// ── Settings portability (export / import to another instance) ──────────────
export function exportSettings(cfg, { includeKeys = false } = {}) {
  const providers = {};
  for (const id of Object.keys(cfg.providers || {})) {
    providers[id] = includeKeys ? { key: cfg.providers[id].key } : {};
  }
  return JSON.stringify({
    _polecat: 1,
    exportedAt: new Date().toISOString(),
    includesKeys: includeKeys,
    consensus: cfg.consensus !== false,
    selections: cfg.selections || [],
    arbitration: cfg.arbitration || { activeId: 'sequential', arbiter: 'auto', custom: [] },
    providers,
  }, null, 2);
}

export function importSettings(cfg, json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  const next = { ...cfg, providers: { ...(cfg.providers || {}) } };
  if (Array.isArray(data.selections))
    next.selections = data.selections.map(s => ({ id: s.id || newId(), provider: s.provider, model: s.model }));
  if (data.arbitration)
    next.arbitration = { activeId: data.arbitration.activeId || 'sequential', arbiter: data.arbitration.arbiter || 'auto', custom: Array.isArray(data.arbitration.custom) ? data.arbitration.custom : [] };
  if (typeof data.consensus === 'boolean') next.consensus = data.consensus;
  if (data.providers)
    for (const [k, v] of Object.entries(data.providers)) if (v && v.key) next.providers[k] = { key: v.key };
  return next;
}
