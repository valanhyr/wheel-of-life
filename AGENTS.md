# AGENTS.md

## Required Superpowers Workflow

All development work in this repository must use the applicable `superpowers` skills. At the start of each task, invoke `superpowers:using-superpowers`, identify the relevant process and domain skills, and follow their instructions before exploring or editing the code.

For any feature, behavior change, or bug fix, use this workflow:

1. **Spec first:** capture the agreed requirements and acceptance criteria in `docs/superpowers/specs/YYYY-MM-DD-<feature-name>.md`. The spec is the authority for implementation decisions and review.
2. **Plan second:** create `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md` using `superpowers:writing-plans`. The plan must reference its spec, identify files and interfaces, and break the work into independently testable `Task N` sections.
3. **TDD for every implementation task:** use `superpowers:test-driven-development`. Write a focused failing test, run it and confirm the expected failure, implement the minimum code, then run the test and the complete project suite. Do not write production code first or add tests after the implementation.
4. **Execute the plan:** use `superpowers:subagent-driven-development` when tasks are substantially independent; otherwise use `superpowers:executing-plans`. Do not skip task-level review, progress tracking, or the final whole-branch review required by the selected workflow.
5. **Verify before completion:** use `superpowers:verification-before-completion`, run `npm test` and `npm run build`, and report the actual results. Do not claim completion from inspection alone.

### Specification, Plan, and Task Artifacts

- `docs/superpowers/specs/` contains durable product or behavior specifications. Name files `YYYY-MM-DD-<feature-name>.md`.
- `docs/superpowers/plans/` contains implementation plans. Every plan must begin with the standard `writing-plans` header and include the path to its governing spec.
- A plan's `Task N` is the canonical task definition. Each task must list exact files, interfaces, tests, RED/GREEN commands, and a commit boundary.
- `.superpowers/sdd/<plan-id>/` contains git-ignored execution artifacts for the plan: `progress.md`, task briefs, implementation reports, review packages, and review reports. Create and maintain the plan-specific SDD ledger; never reuse another plan's ledger.
- Record decisions and conflicts in the SDD ledger as rulings. If a plan conflicts with its spec, the spec wins.

### Trello Operational Sync (Opt-in)

Trello sync is **only performed when the user explicitly requests it**. Do not create, move, or update Trello cards unless asked.

- **Board:** `Rueda de la Vida — Plan de proyecto` in the `Siguiente paso` workspace. Lists: `Cronograma`, `En curso`, `Revisión y validación`, `Completado`.
- **Task cards:** one per `Task N`, named `[<plan-id>] Task N — <short title>`, linking to spec and plan.
- **SDD ledger:** `.superpowers/sdd/<plan-id>/progress.md` records card URL/ID, status, and rulings.

For small documentation-only or maintenance changes, apply the same skills proportionally; a full spec/plan may be omitted only when the relevant skill explicitly permits it or the user explicitly waives it. Never waive TDD for a code or behavior change without the user's explicit permission.

## Commands

- `npm install` — install dependencies
- `npm run dev` — start Vite dev server
- `npm test` — run tests (requires **Node 22.12+**; uses built-in `node --test`, not Jest/Vitest)
- `npm run build` — production build

There is no linter, formatter, or typecheck. `npm test` and `npm run build` are the only verification steps.

## Architecture

Single React + Vite app. All scoring logic lives in `src/data/scoring.js` as pure functions with no React dependency. The UI (`src/App.jsx`) is a thin layer over these functions.

**Data-driven design**: Each of the 8 life areas has a `*-rules.json` (dimension weights, focus order, pattern rules, context rules) and `*-results.json` (interpretation catalogs) in `src/data/`. Questions are in `src/data/questions.json` (224 total: 28 per area = 22 scored + 2 priorities + 4 context).

**Area registration**: `src/data/additional-areas.js` maps the 6 newer areas (salud, emocional, relaciones, familia, crecimiento, ocio) to their catalog/rules/patterns. Finance and Work have hardcoded entry points (`financeResult`, `workResult`) in `scoring.js`. To add a new area, register it in `additional-areas.js` and add the corresponding JSON files.

## Scoring rules (non-obvious)

- **Completeness gate**: An area score is `null` until all 22 scored questions are answered. Partial dimension scores are shown but never published to the wheel.
- **Dimension weights**: Each dimension weighs 25% regardless of question count (dimensions have 5, 5, 6, 6 questions). The area score is a weighted mean of dimension scores, not a mean of all answers.
- **Focus selection**: The lowest-scoring dimension is the focus. Ties within 0.25 points are broken by the `focusOrder` array in the area's rules JSON.
- **Pattern rules**: `patternRules` in rules JSON use explicit `gte`/`lt` operators and are checked in order. The `condition` string fields in result catalogs are **documentation only** — they are never evaluated as code.
- **Transversal factors**: Require at least 2 answers per factor. Shown as provisional signals, not combined across areas.
- **Gap sign convention**: The visible gap is `result - perception`. Catalog internally uses the opposite sign (`perception - result`). Bands: 4, 6, 7.5; alignment tolerance < 1 point.

## Testing

- Tests are in `tests/` using `node:test` and `node:assert/strict`.
- Fixtures in `tests/fixtures/*-demo.json` are synthetic examples with expected scores. They are **never preloaded** in the app.
- `tests/rendering.test.js` uses Vite's `ssrLoadModule` in middleware mode to server-render React components — it does not use a separate test renderer.
- To run a single test file: `node --test tests/scoring.test.js`

## Build config

`vite.config.js` sets `css.transformer: 'postcss'` to ensure PostCSS runs before the LightningCSS minifier, avoiding unknown Tailwind rule errors. Do not remove this.

## Frontend design

For any task related to frontend design — UI layout, styling, component structure, visual hierarchy, or user experience — use the `frontend-design` skill before writing code.

## Engram Persistent Memory

Engram MCP server is installed and auto-starts with OpenCode. Use it to persist decisions, discoveries, and context across sessions.

**When to save:**
- After any architecture/design decision
- After fixing a non-obvious bug
- When discovering project conventions or gotchas
- At the end of each task (session summary)

**Topic key convention:** `<category>/<short-slug>` (e.g., `config/engram`, `bugfix/scoring`, `decision/area-registry`)

**Key tools:** `mem_save`, `mem_search`, `mem_context`, `mem_session_summary`
