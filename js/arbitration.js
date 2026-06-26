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

// ── Provenance (agreement map) ──────────────────────────────────────────────
// After the consensus answer is produced, make ONE extra silent arbiter call
// that returns machine-readable JSON describing how each model shaped the
// answer and where they agreed/disagreed. Never blocks or alters the streamed
// answer; degrades to null on any failure. Gated by ctx.provenanceEnabled.
const PROVENANCE_PROMPT =
`You just helped synthesize ONE consensus answer to this question:

"{prompt}"

Here are the {n} independent model answers that were available:

{answers}

And here is the FINAL consensus answer that was produced:

---
{consensus}
---

Analyze, honestly and approximately, how the consensus relates to the individual answers. Reply with ONLY a JSON object (no prose, no markdown fences) of EXACTLY this shape:

{
  "perModel": [{"label": "<exact model label from above>", "contributionPct": <integer 0-100, approximate>, "stance": "<aligned|partial|outlier>"}],
  "agreements": ["<short point most models agreed on>"],
  "disagreements": [{"point": "<what they differed on>", "positions": [{"model": "<label>", "claim": "<their stance, short>"}]}],
  "notable": [{"claim": "<a notable or contested claim>", "models": ["<label>"], "note": "<why it stands out, short>"}]
}

Rules:
- Use the EXACT labels shown above. Include every model in "perModel".
- contributionPct is approximate; values should sum to roughly 100.
- If contribution is genuinely unclear, distribute evenly and use stance "partial".
- Keep every string short — a phrase, not a paragraph. Use [] for arrays you cannot fill.`;

// Pull a JSON object out of a model reply: tolerate ```json fences and prose.
export function extractJson(text) {
  if (!text) return null;
  let t = String(text).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{'), end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try { return JSON.parse(t.slice(start, end + 1)); } catch { return null; }
}

// Clamp/validate the parsed object into a safe shape, mapping labels back to
// selection ids so the UI can use brand colors. Returns null if nothing usable.
export function normalizeProvenance(data, results, labelOf) {
  if (!data || typeof data !== 'object') return null;
  const out = { perModel: [], agreements: [], disagreements: [], notable: [] };
  if (Array.isArray(data.perModel)) {
    out.perModel = data.perModel.map((m) => {
      const label = String(m?.label ?? '').trim();
      const match = results.find(r => labelOf(r.selection) === label);
      let pct = Number(m?.contributionPct);
      if (!isFinite(pct)) pct = 0;
      pct = Math.max(0, Math.min(100, Math.round(pct)));
      const stance = ['aligned', 'partial', 'outlier'].includes(m?.stance) ? m.stance : 'partial';
      return { id: match ? match.selection.id : null, label, contributionPct: pct, stance };
    }).filter(m => m.label);
  }
  if (Array.isArray(data.agreements))
    out.agreements = data.agreements.map(s => String(s).trim()).filter(Boolean).slice(0, 12);
  if (Array.isArray(data.disagreements))
    out.disagreements = data.disagreements.filter(d => d && d.point).map(d => ({
      point: String(d.point).trim(),
      positions: Array.isArray(d.positions)
        ? d.positions.map(p => ({ model: String(p?.model ?? '').trim(), claim: String(p?.claim ?? '').trim() })).filter(p => p.model || p.claim)
        : [],
    })).slice(0, 12);
  if (Array.isArray(data.notable))
    out.notable = data.notable.filter(x => x && x.claim).map(x => ({
      claim: String(x.claim).trim(),
      models: Array.isArray(x.models) ? x.models.map(s => String(s).trim()).filter(Boolean) : [],
      note: String(x?.note ?? '').trim(),
    })).slice(0, 12);
  if (!out.perModel.length && !out.agreements.length && !out.disagreements.length && !out.notable.length) return null;
  return out;
}

// ── EPIC 1 · P2 — Local agreement signal (no extra cost) ────────────────────
// Measure agreement straight from the raw answer text — pairwise shingle Jaccard
// between every model pair, and how much of the final consensus each model's
// wording covers. Pure & cheap (no model call). Used two ways: as a *fallback*
// when the arbiter's JSON is missing, and to *cross-check* the arbiter's
// approximate contribution percentages with a measured number.
const STOP = new Set(('the a an and or but of to in on at for with as by is are was were be been being it ' +
  'its this that these those i you he she we they them his her their our your my me do does did have has had ' +
  'not no so if then than from up out about into over after will would can could should may might just also').split(' '));

function contentTokens(text) {
  return (String(text || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length > 2 && !STOP.has(w));
}
// Bigram shingles capture phrasing overlap, not just shared vocabulary.
function shingleSet(toks, n = 2) {
  const set = new Set();
  if (toks.length < n) { toks.forEach(t => set.add(t)); return set; }
  for (let i = 0; i <= toks.length - n; i++) set.add(toks.slice(i, i + n).join(' '));
  return set;
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0; for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}
function containment(part, whole) { // fraction of `whole` covered by `part`
  if (!whole.size) return 0;
  let inter = 0; for (const x of whole) if (part.has(x)) inter++;
  return inter / whole.size;
}
function stanceFromSignal(centrality, avg) {
  if (avg <= 0) return 'partial';
  if (centrality >= avg * 1.15) return 'aligned';
  if (centrality <= avg * 0.6)  return 'outlier';
  return 'partial';
}

// Returns { perModel:[{id,label,overlap,centrality,contributionPct}],
//           pairwise:[{a,b,similarity}], avgSimilarity } or null (< 2 models).
export function computeLocalAgreement(results, consensusText, labelOf) {
  if (!Array.isArray(results) || results.length < 2) return null;
  const models = results.map(r => ({
    id: r.selection.id, label: labelOf(r.selection), sh: shingleSet(contentTokens(r.text)),
  }));
  const pairwise = [];
  let simSum = 0;
  for (let i = 0; i < models.length; i++)
    for (let j = i + 1; j < models.length; j++) {
      const similarity = jaccard(models[i].sh, models[j].sh);
      pairwise.push({ a: models[i].label, b: models[j].label, similarity });
      simSum += similarity;
    }
  const avgSimilarity = pairwise.length ? simSum / pairwise.length : 0;
  const consSh = shingleSet(contentTokens(consensusText));
  const perModel = models.map(m => {
    const overlap = containment(m.sh, consSh);          // how much of the consensus this model's text covers
    let aSum = 0, aN = 0;                                // mean similarity to the other models → "centrality"
    for (const p of pairwise) if (p.a === m.label || p.b === m.label) { aSum += p.similarity; aN++; }
    return { id: m.id, label: m.label, overlap, centrality: aN ? aSum / aN : 0 };
  });
  const totalOverlap = perModel.reduce((s, m) => s + m.overlap, 0);
  perModel.forEach(m => {
    m.contributionPct = totalOverlap > 0
      ? Math.round((m.overlap / totalOverlap) * 100)
      : Math.round(100 / perModel.length);
  });
  return { perModel, pairwise, avgSimilarity };
}

// EPIC 1 · P4 — Paragraph-level attribution for inline source highlighting.
// No extra model call; uses the same shingle helpers as computeLocalAgreement.
// Splits the consensus into paragraphs, then finds which model's text is most
// similar to each paragraph. Returns null for single-model or missing data.
export function computeParaAttribution(consensusText, results, labelOf) {
  if (!Array.isArray(results) || results.length < 2 || !consensusText) return null;
  const models = results.map(r => ({
    id: r.selection.id, label: labelOf(r.selection),
    sh: shingleSet(contentTokens(r.text)),
  }));
  const segs = consensusText.split(/\n{2,}/).map(s => s.trim()).filter(s => s.length > 20);
  if (!segs.length) return null;
  return segs.map(text => {
    const sh = shingleSet(contentTokens(text));
    const scores = models
      .map(m => ({ id: m.id, label: m.label, score: jaccard(sh, m.sh) }))
      .sort((a, b) => b.score - a.score);
    const top = scores[0].score;
    const second = scores.length > 1 ? scores[1].score : 0;
    const hasSignal = top >= 0.05;
    const agreed = hasSignal && second >= 0.05 && (second / top) >= 0.65;
    return {
      text,
      primaryId: hasSignal ? scores[0].id : null,
      primaryLabel: hasSignal ? scores[0].label : null,
      agreed, top, second,
    };
  });
}

// Build a provenance object purely from the local signal — used when the
// arbiter call fails or returns nothing parseable. Honest: no fabricated
// agreements/disagreements, just the measured contribution + stance.
export function provenanceFromLocal(local) {
  if (!local || !local.perModel.length) return null;
  return {
    perModel: local.perModel.map(m => ({
      id: m.id, label: m.label, contributionPct: m.contributionPct,
      stance: stanceFromSignal(m.centrality, local.avgSimilarity),
      localPct: m.contributionPct, overlap: m.overlap, mismatch: false,
    })),
    agreements: [], disagreements: [], notable: [],
    agreementSignal: local.avgSimilarity, pairwise: local.pairwise, source: 'local',
  };
}

// Fold the measured signal into an arbiter-produced provenance object so the UI
// can show measured agreement next to the arbiter's approximate split, and flag
// per-model where the two diverge a lot. Mutates & returns `prov`.
export function mergeLocalSignal(prov, local) {
  if (!prov) return null;
  if (!local) { prov.source = 'arbiter'; return prov; }
  prov.agreementSignal = local.avgSimilarity;
  prov.pairwise = local.pairwise;
  prov.source = 'arbiter';
  const byLabel = new Map(local.perModel.map(m => [m.label, m]));
  prov.perModel.forEach(m => {
    const lm = byLabel.get(m.label);
    if (!lm) return;
    m.localPct = lm.contributionPct;
    m.overlap = lm.overlap;
    m.mismatch = Math.abs(m.contributionPct - lm.contributionPct) >= 25;  // arbiter vs measured
  });
  return prov;
}

async function maybeProvenance(ctx, arbiter, consensusText) {
  if (!ctx.provenanceEnabled || typeof ctx.provenance !== 'function') return;
  const { results } = ctx;
  if (results.length < 2 || !arbiter || !consensusText) return;
  const local = computeLocalAgreement(results, consensusText, ctx.labelOf);
  const answers = formatAnswers(results, ctx.labelOf);
  const msg = fill(PROVENANCE_PROMPT, { prompt: ctx.prompt, answers, n: results.length, consensus: consensusText });
  let raw = '';
  try { raw = await ctx.silent(arbiter, [{ role: 'user', content: msg }]); }
  catch { ctx.provenance(provenanceFromLocal(local)); return; }
  const arb = normalizeProvenance(extractJson(raw), results, ctx.labelOf);
  ctx.provenance(arb ? mergeLocalSignal(arb, local) : provenanceFromLocal(local));
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
      let finalText = null;
      try { finalText = await ctx.stream(r.selection, msgs); } catch { ctx.showStatic(draft); }
      if (finalText) await maybeProvenance(ctx, r.selection, finalText);
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
  let finalText = null;
  try { finalText = await ctx.stream(arbiter, [{ role: 'user', content: judgePrompt }]); }
  catch { ctx.showStatic(results[0].text); }
  if (finalText) await maybeProvenance(ctx, arbiter, finalText);
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
  let finalText = null;
  try { finalText = await ctx.stream(arbiter, msgs); }
  catch { ctx.showStatic(results[0].text); }
  if (finalText) await maybeProvenance(ctx, arbiter, finalText);
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
    arbitration: cfg.arbitration || { activeId: 'sequential', arbiter: 'auto', provenance: true, custom: [] },
    providers,
  }, null, 2);
}

export function importSettings(cfg, json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  const next = { ...cfg, providers: { ...(cfg.providers || {}) } };
  if (Array.isArray(data.selections))
    next.selections = data.selections.map(s => ({ id: s.id || newId(), provider: s.provider, model: s.model }));
  if (data.arbitration)
    next.arbitration = { activeId: data.arbitration.activeId || 'sequential', arbiter: data.arbitration.arbiter || 'auto', provenance: data.arbitration.provenance !== false, custom: Array.isArray(data.arbitration.custom) ? data.arbitration.custom : [] };
  if (typeof data.consensus === 'boolean') next.consensus = data.consensus;
  if (data.providers)
    for (const [k, v] of Object.entries(data.providers)) if (v && v.key) next.providers[k] = { key: v.key };
  return next;
}
