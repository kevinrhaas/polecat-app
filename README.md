# Polecat

**One prompt. Every model. One synthesized answer.**

Polecat lets you ask a question to many AI models at the same time — Claude, Gemini, GPT, Llama, Qwen, and more — then blends their responses into a single consensus answer that shows you exactly where they agreed and where they diverged.

**[Try it free → app.polecat.live](https://app.polecat.live)**  
No sign-up. No API key required for the free demo.

---

## Why Polecat?

Single-model chat is a coin flip. Every model has blind spots, biases, and training gaps. Polecat makes the difference visible:

- **Cross-check**: where Claude and Gemini agree, you can trust the answer. Where they split, Polecat shows you the split — instead of hiding it.
- **Best of each**: different models are trained differently. Run them in parallel and get a synthesis that keeps the strongest parts.
- **Consensus with provenance**: the blended answer comes with a breakdown — per-model contribution percentages, notable agreements, and flagged disagreements.

---

## Features

| | |
|---|---|
| Multi-model broadcast | Send one prompt to any mix of models simultaneously |
| Consensus synthesis | Four strategies: Best, Comprehensive, Validated, Debate |
| Agreement map | See per-model contribution, agreements, and disagreements |
| Inline attribution | Hover any sentence to see which models said it |
| Document attachments | Attach PDF, PPTX, DOCX, XLSX, images, code, or plain text |
| BYOK | API keys live in your browser — never sent anywhere else |
| Free demo | Two fast free models + consensus, no key required |
| 100% client-side | No server, no backend, no tracking |
| Conversation history | Full local chat history, search, pin, rename |
| Private mode | Sessions that aren't saved |

---

## Privacy

Everything runs in your browser. Your API keys are stored in `localStorage` and sent directly to each provider. Polecat has no server that sees your prompts, keys, or conversations. Attachments are read locally and never uploaded.

---

## Architecture

```
index.html          entry point / HTML shell
css/styles.css      all styles (single file, no build step)
js/
  app.js            main controller — routing, state, event loop
  providers.js      provider definitions, model registry
  config.js         settings, defaults, local-storage keys
  arbitration.js    consensus synthesis + provenance analysis
  ui.js             stateless view helpers (DOM, markdown, toast)
changelog.json      user-facing changelog (read by What's new panel)
proxy/              Cloudflare Worker source — keyless free demo
assets/             favicon + mascot SVG
website/            marketing site component (examples carousel)
```

No build step. No bundler. No framework. `index.html` loads the modules; serve any static host.

---

## Consensus strategies

| Strategy | What it does |
|---|---|
| **Best** | Arbiter picks the strongest individual response |
| **Comprehensive** | Arbiter merges all perspectives into one complete answer |
| **Validated** | Models cross-check each other; the arbiter reconciles |
| **Debate** | Models argue; the arbiter decides the winner |

You choose which model is the arbiter (default: free/fast). For premium judgment, set Opus or Gemini Pro as the arbiter while exploring with free models.

---

## Free demo

The keyless demo uses a Cloudflare Worker (`proxy/`) that proxies two free models with a tight rate-limit. Source is in `proxy/` — you can deploy your own. No keys are embedded in the app.

---

## Self-improving loop

Polecat runs an hourly autonomous improvement agent (Claude Code) that reads this ROADMAP, picks the next unchecked step, implements it, and pushes a commit. The `changelog.json` tracks every change and powers the in-app "What's new" panel.

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full roadmap and in-progress epics.

---

## License

MIT. Free to use, fork, and self-host.
