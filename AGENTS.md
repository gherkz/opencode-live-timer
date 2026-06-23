# AGENTS.md

Instructions for AI agents (opencode, Claude Code, Cursor, Aider, etc.) working on this repository.

This is the **opencode-live-timer** plugin: an opencode plugin that adds a live timer feature to sessions. Plugins extend opencode by exporting a `Plugin`-typed function that subscribes to events, defines custom tools, or injects environment into shells. See https://opencode.ai/docs/plugins for the API.

## Quick reference

| Task | Command |
| --- | --- |
| Install deps | `bun install` |
| Run tests | `bun test` |
| Run tests in watch mode | `bun test --watch` |
| Type check | `bunx tsc --noEmit` |
| Lint + format check | `bunx biome check .` |
| Lint + auto-fix | `bunx biome check --write .` |
| Local dev (link into opencode) | `bun run dev` |
| Install plugin globally | `bun run install` |
| Uninstall plugin globally | `bun run uninstall` |

A change is **not done** until `bun test`, `bunx tsc --noEmit`, and `bunx biome check .` all pass clean.

## Automation

This plugin's workflow is fully automated inside an agent session. The agent:

- **Works on a branch, never `main`.** At the start of work, create a branch off `main` named `<type>/<short-kebab-desc>` matching the commit type and a short description (e.g. `chore/scaffold`, `feat/timer-tick`).
- **Commits only at vertical-slice boundaries.** A vertical slice is one user-visible behaviour (or one refactor / config / docs change that leaves behaviour identical) wired end-to-end into `src/index.ts` and covered by tests. After a slice is fully green (`bun test`, `bunx tsc --noEmit`, and `bunx biome check .` all pass), create a single commit using the conventional-commits format below. Do not commit mid-slice. Do not ask first.
- **Pushes after every commit.** `git push` the current branch; on the first push of a new branch, pass `-u origin <branch>` to set upstream. Never force-push; never amend a pushed commit; never use `--no-verify`.

If any gate fails, fix the root cause and re-run all three before committing. Do not commit a failing state, do not skip a gate, do not use `--no-verify` to bypass one.

## Project layout

```
src/
  index.ts              # plugin entry, exports a Plugin
  hooks/                # one file per event handler
  timer/                # timer engine (pure functions only)
  ui/                   # TUI hook handlers (toast, prompt.append)
  tools/                # custom tool definitions
  types/                # shared types
  __tests__/            # mirrors src/, *.test.ts
package.json
biome.json
tsconfig.json
```

- `src/index.ts` exports a single `Plugin` object as the default export. opencode loads this file directly.
- `opencode` is a **peer dependency**, never bundled.
- The plugin must not make network calls unless explicitly behind a feature flag.

## Setup

1. `bun install` — installs runtime + dev deps.
2. For local development, bundle and install the plugin into opencode's global plugin directory with `bun run install`. This runs `bun build src/index.ts --outfile $HOME/.config/opencode/plugins/live-timer.js --target bun --format esm`, producing a self-contained `live-timer.js` snapshot of the current `src/` tree. Use `bun run uninstall` to remove it. Because it is a bundle rather than a symlink, uncommitted edits to `src/index.ts` are not visible to opencode until you re-run `bun run install`. The legacy manual `ln -s` form still works for project-local installs under `.opencode/plugins/`.
3. `bun run dev` is a placeholder script for whatever local iteration loop is added later (e.g. `bun --watch src/index.ts`).

## Code style

- TypeScript, `strict: true`, ESM only, target the version opencode runs.
- Biome defaults: **2-space indent, single quotes, no semicolons, 100-col line width**.
- `const` by default; `let` only when reassignment is required; never `var`.
- No `any`. Use `unknown` and narrow, or define a precise type.
- Exhaust `switch` statements with a `never` default branch.
- **No comments** unless the user explicitly asks for them in that change. Code should be self-explanatory through naming.
- Logging goes through `client.app.log(...)`, never `console.log`. Levels: `debug | info | warn | error`.
- Prefer pure functions in `timer/` so they are trivially testable. Side effects (file I/O, shell, time) live in `hooks/` and `tools/`.

## Testing — TDD, strict gates

Framework: **`bun test`**. Tests live in `src/__tests__/` mirroring the source tree.

### Process (red-green-refactor)

1. Write the **smallest failing test** that describes the next behaviour.
2. Run `bun test` and confirm it fails for the right reason.
3. Write the **smallest production code** that makes it pass.
4. Run `bun test` and confirm green.
5. Refactor (rename, extract, dedupe) only with green tests as a safety net.
6. Re-run the full quality gate before committing.

### Required coverage

- Every hook handler has at least one test that invokes it against a mock `ctx` and asserts on its returned hooks and side effects.
- Every pure helper in `timer/` has unit tests covering normal cases, edge cases (0, negative, overflow), and at least one error case.
- One **integration test** in `src/__tests__/integration.test.ts` loads the plugin with a mock `ctx` and asserts the expected event names are registered.

### Rules

- **No real wall-clock time in tests.** Use `bun:test`'s `setSystemTime` / `mock.date` to control time. Real `setTimeout` / `setInterval` in tests is a bug.
- **No real I/O in tests.** Mock the opencode `client` and `$` shell; never hit the network or filesystem outside a temp dir created via `os.tmpdir()` + cleanup.
- Tests must be deterministic and run in under 1 second total.
- Test names read as sentences: `it("ticks every second when running", ...)`.

## Pre-commit checklist

Before every commit, all of the following must be true:

1. `bun test` — all green.
2. `bunx tsc --noEmit` — no type errors.
3. `bunx biome check .` — no lint, format, or import-order errors. Run `bunx biome check --write .` to fix automatically, then re-run all three.
4. `git status` — only intended files are staged. No stray `package-lock.json` churn, no debug files, no secrets.
5. Commit message follows the conventional-commits format below.

If any step fails, fix the root cause. Do not skip or silence checks.

## Commit conventions — one slice per commit

> **One commit = one vertical slice.** A slice is complete only when the new behaviour (or refactor) is wired in, tested, and passes every gate. Mid-slice work — a passing helper, a passing test, a passing refactor on top of a still-broken feature — stays uncommitted.

A slice is a meaningful unit of work that an end user (or future maintainer) can recognise as one thing. Examples:

- A new feature wired into `src/index.ts` with tests at every layer.
- A bug fix with its regression test, all green.
- A dependency add, upgrade, or removal on its own.
- A config-only change (`biome.json`, `tsconfig.json`, `package.json` scripts).
- A docs-only change.
- A pure refactor (rename, extract, dedupe) that leaves behaviour identical, with all tests still green.

Helper functions, state machines, and other building blocks that are not yet wired into the plugin are **not** slices. Build them up, keep the gates green between steps, then commit once at the slice boundary.

When in doubt: split the work into more slices, not fewer. A branch with a handful of focused slice commits is better than one mega-commit or a swarm of micro-commits.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **Subject:** imperative mood ("add", not "added"), lowercase first letter, no trailing period, ≤72 characters, no emoji.
- **Body:** wrap at 100 columns, explain *why* not *what*, separate from subject with a blank line. Omit the body when the subject is self-explanatory.
- **Footer:** `Co-authored-by:` trailer(s) for AI-assisted work (see [Trailers](#trailers) below).

### Trailers

For AI-assisted commits, attribute the AI using the GitHub-standard `Co-authored-by:` trailer:

```
Co-authored-by: opencode <noreply@opencode.ai>
```

Stack multiple `Co-authored-by:` lines in author order when several AIs contributed. The email is a no-reply address on the tool's domain; GitHub renders the trailer as a clickable link on the commit. The specific model behind the tool is not part of the standard and is left out unless a project requires it.

### Types

| Type | Use for |
| --- | --- |
| `feat` | New user-visible behaviour |
| `fix` | Bug fix |
| `test` | Adding or fixing tests only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `docs` | Documentation only |
| `chore` | Tooling, config, or non-prod maintenance |
| `build` | Build system or external dependencies |
| `ci` | CI configuration and scripts |
| `style` | Formatting only (no logic change) |

### Scopes (derived from plugin structure)

| Scope | When |
| --- | --- |
| `hooks` | Changes to event hook handlers |
| `timer` | Timer engine / pure time logic |
| `ui` | TUI hooks (toast, prompt.append, command) |
| `tools` | Custom tool definitions |
| `types` | Shared type definitions |
| `config` | `biome.json`, `tsconfig.json`, `package.json` scripts |
| `deps` | Adding, upgrading, or removing dependencies |
| `ci` | CI workflow files |

Use the most specific scope. Drop the scope only if the change genuinely spans the whole plugin (rare — prefer splitting).

### Size rule

One slice = one commit. If a diff touches more than one of: a feature, a refactor, a fix, a test-only change, **split it into multiple slices**. Aim for **<400 lines changed** per slice; if a slice is larger, justify it in the body or split it.

### Slice rule — commit at the boundary, not mid-slice

Commit exactly once per vertical slice, at the moment the slice is complete and every gate is green. Do not commit mid-slice work — a green helper, a passing test for unwired code, a green refactor on top of a still-broken feature — even though those intermediate states satisfy the gates.

A slice is complete when **all** of the following are true:

- The new behaviour is wired into `src/index.ts` (or it is a standalone refactor / config / docs change).
- Every hook handler and pure helper introduced by the slice has tests.
- The integration test in `src/__tests__/integration.test.ts` reflects the new behaviour.
- `bun test`, `bunx tsc --noEmit`, and `bunx biome check .` all pass clean.

When all four are true, commit the whole slice in a single response and push.

### Git hygiene

- **Never** force-push, amend a pushed commit, or use `--no-verify`. Banned outright, not gated on user request.
- **Never** commit to `main` directly. The Automation section governs branch creation and pushing.
- **Never** include secrets, tokens, or `.env` contents, even in examples.

## Plugin-specific rules

- The plugin is a single `Plugin` export. Keep it that way; do not export multiple plugins from one file.
- All hook handlers must be **idempotent** — opencode may call them repeatedly for the same event during a session.
- All async hooks must handle rejection: a thrown error inside a hook will surface to the user. Wrap risky work in `try/catch` and report via `client.app.log` with `level: "error"`.
- TUI hooks (`tui.toast.show`, `tui.prompt.append`, `tui.command.execute`) are the user-facing surface. Keep messages short, sentence-case, and free of jargon.

## Forbidden actions

- Committing to `main` directly.
- Force-pushing, amending pushed commits, or skipping hooks (e.g. `--no-verify`).
- Adding `console.log`, `any`, `// @ts-ignore`, or `// @ts-expect-error` without a comment explaining why and a `// TODO(remove)` linked to an issue.
- Tests that depend on real time, real network, or real filesystem state outside a temp dir.
- Bundling or forking opencode itself — it is a peer dep.
- Adding new top-level dependencies without checking whether the opencode `client`, `$`, or stdlib already covers it.
- Writing documentation files (`*.md` other than this one and `README.md`) unless the user asks.

When in doubt: **the smallest change that keeps `bun test`, `tsc --noEmit`, and `biome check` green is the right change.**
