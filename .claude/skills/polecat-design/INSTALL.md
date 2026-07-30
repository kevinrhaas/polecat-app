# Installing the Polecat design system in Claude Code

This folder is a self-contained Claude Code skill. `SKILL.md` carries the
Agent-Skills front matter, so once it's in a skills directory Claude Code
discovers it automatically — no prompt pasting, no per-session setup.

## Option 1 — project skill (recommended)

Drop the folder into the repo you're working in:

```
cp -R polecat-design-skill .claude/skills/polecat-design
```

Result: `<repo>/.claude/skills/polecat-design/SKILL.md`. Anyone who clones the
repo gets the design system with it, and it's version-controlled alongside the
code it styles. Commit it.

## Option 2 — personal skill (all your projects)

```
cp -R polecat-design-skill ~/.claude/skills/polecat-design
```

Available in every Claude Code session on that machine. Use this for the hub +
spokes fleet, where the same system applies across eight separate repos —
then you don't vendor eight copies.

## Option 3 — one repo, symlinked into the spokes

Keep the canonical copy in `polecat-platform`, symlink it everywhere else:

```
# in polecat-platform
mkdir -p .claude/skills && cp -R polecat-design-skill .claude/skills/polecat-design

# in each spoke repo
ln -s ../../polecat-platform/.claude/skills/polecat-design .claude/skills/polecat-design
```

One place to update, no drift between apps. The tradeoff: it only works for
people who have both repos checked out side by side.

## Verifying it loaded

In a Claude Code session, run `/polecat-design`. The skill is `user-invocable`,
so it should appear in the slash-command list and, when invoked bare, ask what
you want to build. If it doesn't appear, check the path — the folder must
contain `SKILL.md` at its root, not one level down.

## Keeping it current

The design system is derived from real shipped code, and `github.md` records
exactly which files. When `lib/tokens.css`, `lib/shell.css`, `lib/icons.js` or
`docs/BRAND.md` change upstream in `kevinrhaas/polecat-platform`, this copy is
stale. Two ways to handle it:

- **Point Claude Code at the source.** If it has repo access, tell it the repos
  in `github.md` are the ground truth and this skill is the summary. The shell
  library is small enough to read end to end.
- **Re-export.** Regenerate this folder from the design system and re-copy.
  `github.md`'s `## Screen map` tells you which parts to check.

## What's in here

| Path | What it is |
|---|---|
| `SKILL.md` | Front matter + quick orientation. The entry point Claude Code reads. |
| `readme.md` | The full design guide — product landscape, voice, visual foundations, iconography. |
| `styles.css` | Link this one file to get every token. Imports everything in `tokens/`. |
| `tokens/` | Palette, site + app color semantics, fonts, type scale, spacing, radii/shadows, motion. |
| `assets/` | Logo marks, legacy mascot, OG image, the icon set (`icons.js` ES module + `icons-global.js`). |
| `fonts/` | Hanken Grotesk, 18 files — all nine weights, roman and italic. |
| `components/` | 33 React primitives grouped `core` / `brand` / `navigation` / `feedback` / `marketing`, each with a `.prompt.md` and `.d.ts`. |
| `ui_kits/` | Four full surface recreations to copy from. |
| `guidelines/` | Specimen cards for colors, type, spacing, brand, icons. |
| `github.md` | Source-repo association for upstream sync. |
| `_adherence.oxlintrc.json` | Lint rules that catch off-system values. Wire into your lint config if you want the system enforced, not just documented. |

## Two things to tell Claude Code up front

1. **In-app surfaces must set `data-palette="polecat|aurora|neon"` on `<html>`.**
   Marketing pages don't. Site and app are two different vocabularies and mixing
   them is the most common failure.
2. **The components are React `.jsx` with no build step assumed.** If your
   target is Vue, Svelte, native, or plain HTML, treat them as specifications —
   read the JSX and the `.prompt.md`, then implement in your own environment.
   The tokens and `styles.css` are framework-agnostic and can be used directly.
