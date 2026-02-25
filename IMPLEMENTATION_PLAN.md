# Implementation Plan: PR #1 Improvements

Based on the [PR Analysis](./PR_ANALYSIS.md), this plan organizes 67 issues into 8 work
streams across 4 phases. Streams within a phase can run **in parallel**; phases are
**sequential** (each phase depends on the prior phase completing).

---

## Dependency Graph

```
Phase 1 (Foundation)
├── Stream A: Security — Electron IPC Hardening  [no blockers]
├── Stream B: Security — Nginx / Docker           [no blockers]
├── Stream C: Build & CI Pipeline Fixes            [no blockers]
└── Stream D: Dead Code Cleanup                    [no blockers]

Phase 2 (Core Refactoring) — blocked by Phase 1D
├── Stream E: Shared Utilities Extraction          [blocked by 1D]
└── Stream F: pdfGenerator.ts Decomposition        [blocked by 1D, partially by 1E]

Phase 3 (Component & Store Improvements) — blocked by Phase 2
├── Stream G: Component Refactoring & Performance  [blocked by 2E, 2F]
└── Stream H: Store & Hook Improvements            [blocked by 2E]

Phase 4 (Testing & Polish) — blocked by Phase 3
└── Stream I: Test Hardening                       [blocked by all above]
```

---

## Phase 1: Foundation (all 4 streams in parallel)

### Stream A — Electron IPC Security Hardening
> Files: `electron/ipc/*.ts`, `electron/main.ts`
> No blockers — these files have no incoming dependencies from `src/`

| # | Task | Issues | Files | Blocker |
|---|------|--------|-------|---------|
| A1 | Remove plaintext credential fallback — throw error when encryption unavailable | 1.1 | `electron/ipc/storeHandlers.ts` | — |
| A2 | Add path traversal validation to `showItemInFolder` — reject `..`, resolve against allowlist | 1.8 | `electron/ipc/fileHandlers.ts` | — |
| A3 | Fix `openExternal` URL validation — use `URL` constructor, validate `.protocol` | 1.9 | `electron/ipc/fileHandlers.ts` | — |
| A4 | Add SMTP config validation — port range, hostname format, per-minute rate limit | 1.10 | `electron/ipc/emailHandlers.ts` | — |
| A5 | Harden temp file handling — `crypto.randomUUID()`, permissions 0o600, reduce cleanup delay | 1.7 | `electron/ipc/printHandlers.ts` | — |
| A6 | Strengthen Electron CSP — remove `unsafe-inline` for scripts, add `frame-ancestors`, `form-action`, `base-uri` | 1.4 | `electron/main.ts` | — |

### Stream B — Nginx & Docker Security
> Files: `nginx.conf`, `Dockerfile`, `docker-compose.yml`
> No blockers — infra config is independent of source code

| # | Task | Issues | Files | Blocker |
|---|------|--------|-------|---------|
| B1 | Add HTTPS listener with TLS config + HTTP→HTTPS redirect + HSTS header | 1.2 | `nginx.conf` | — |
| B2 | Add Content-Security-Policy, Permissions-Policy headers | 1.3 | `nginx.conf` | — |
| B3 | Add `limit_req_zone` and `limit_conn_zone` for rate limiting | 1.13 | `nginx.conf` | — |
| B4 | Add `USER nginx` directive to Dockerfile production stage | 1.12 | `Dockerfile` | — |

### Stream C — Build & CI Pipeline Fixes
> Files: `.github/workflows/*`, `package.json`, `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `electron-builder.yml`
> No blockers — config files don't affect source code

| # | Task | Issues | Files | Blocker |
|---|------|--------|-------|---------|
| C1 | Remove redundant `npm run build` from CI quality job — share build artifact | 4.1 | `.github/workflows/ci.yml` | — |
| C2 | Deduplicate `tsc` invocations in package.json scripts | 4.2 | `package.json` | — |
| C3 | Add Node version matrix (18, 20, 22) to CI | 4.3 | `.github/workflows/ci.yml` | — |
| C4 | Add coverage upload step (Codecov) | 4.4 | `.github/workflows/ci.yml` | — |
| C5 | Set `testTimeout` in vitest config, add per-file coverage thresholds | 4.5, 4.6 | `vitest.config.ts` | — |
| C6 | Tighten ESLint: `no-console` to error, re-enable `react-hooks/set-state-in-effect`, add `no-floating-promises` | 4.7, 4.8, 4.9 | `eslint.config.js` | — |
| C7 | Conditionally set platform-specific secrets in electron-build workflow | 4.10 | `.github/workflows/electron-build.yml` | — |
| C8 | Update Linux deb dependencies (replace `gconf2`) | 4.13 | `electron-builder.yml` | — |
| C9 | Add `qrcode` and split `react-dom` chunks in Vite config | 4.14 | `vite.config.ts` | — |

### Stream D — Dead Code & Quick Cleanup
> Files: various isolated files
> No blockers — removing dead code before refactoring reduces noise

| # | Task | Issues | Files | Blocker |
|---|------|--------|-------|---------|
| D1 | Delete `CardPreviewUnified.tsx` (never imported) | 2.6 | `src/components/CardPreviewUnified.tsx` | — |
| D2 | Remove unused `ContainerElement` type from layoutSchema | 2.16 | `src/utils/layoutSchema.ts` | — |
| D3 | Remove dead test helper `_createTestBrandIcons()` | 3.3 | `src/test/__tests__/utils/pdfGenerator.test.ts` | — |
| D4 | Remove or convert `ELECTRON_PLAN.md` to actual arch docs | 6.2 | `ELECTRON_PLAN.md` | — |
| D5 | Remove `void _newConfig` hack — delete unused parameter from `pushToHistory` | 2.13 | `src/stores/configStore.ts` | — |

**Phase 1 Deliverable:** All security holes patched, CI pipeline fixed, dead code removed.
Run `npm run lint && npm test && npm run build` to validate.

---

## Phase 2: Core Refactoring (2 streams in parallel)

### Stream E — Extract Shared Utilities
> Blocked by: **D2** (layoutSchema cleanup) — must be done first so new module starts clean

| # | Task | Issues | Files | Blocker |
|---|------|--------|-------|---------|
| E1 | Create `src/utils/colorUtils.ts` — consolidate `hexToRgb`, `lightenColor`, `darkenColor` from 3 files, fix short hex support | 2.1, 2.19 | new `colorUtils.ts`, edit `pdfGenerator.ts`, `layoutSchema.ts`, `colorContrast.ts` | D2 |
| E2 | Create shared badge builder — extract from `pdfGenerator.ts` and `layoutBuilders.ts`, adapter pattern for output format | 2.2 | new `src/utils/badgeBuilder.ts`, edit `pdfGenerator.ts`, `layoutBuilders.ts` | — |
| E3 | Create shared spec item builder — extract from `CardPreview.tsx` and `layoutBuilders.ts` | 2.3 | new `src/utils/specBuilder.ts`, edit `CardPreview.tsx`, `layoutBuilders.ts` | — |
| E4 | Harden Google Sheets fetch — add `AbortController` timeout (10s), Content-Type validation, max response size (5MB), formula injection prefix | 1.5, 1.6 | `src/utils/googleSheets.ts` | — |
| E5 | Improve email validation — enforce RFC 5321 length limit (254), tighten regex | 1.11 | `src/utils/emailService.ts` | — |
| E6 | Add input validation to `buildSpecItems` — guard against empty/non-string component values | 2.17 | `src/utils/layoutBuilders.ts` | — |
| E7 | Replace global `elementIdCounter` with factory class pattern | 2.15 | `src/utils/layoutSchema.ts` | D2 |

### Stream F — Decompose pdfGenerator.ts
> Blocked by: **E1** (color utils extracted first), **E2** (badge builder extracted first)
> `pdfGenerator.ts` is lazy-loaded by `PDFExporter.tsx` — no compile-time dependents

| # | Task | Issues | Files | Blocker |
|---|------|--------|-------|---------|
| F1 | Extract `src/utils/pdfHelpers.ts` — move `addImageToPdf`, barcode/QR helpers, fix image memory leak | 2.5, 2.18 | new `pdfHelpers.ts`, edit `pdfGenerator.ts` | E1, E2 |
| F2 | Extract `src/utils/pdfRenderers/shelf.ts` — shelf tag rendering logic | 2.5 | new file, edit `pdfGenerator.ts` | F1 |
| F3 | Extract `src/utils/pdfRenderers/price.ts` — price card rendering logic | 2.5 | new file, edit `pdfGenerator.ts` | F1 |
| F4 | Extract `src/utils/pdfRenderers/poster.ts` — poster rendering logic | 2.5 | new file, edit `pdfGenerator.ts` | F1 |
| F5 | Standardize all async code in pdfGenerator to async/await with try/catch | 2.10 | `pdfGenerator.ts` and new renderer files | F2, F3, F4 |

**Phase 2 Deliverable:** Shared utils extracted, pdfGenerator decomposed from 1,421 → ~300 lines.
Run `npm run lint && npm test && npm run build` to validate.

---

## Phase 3: Component & Store Improvements (2 streams in parallel)

### Stream G — Component Refactoring & Performance
> Blocked by: **E3** (shared spec builder), **F*** (pdfGenerator split — PDFExporter imports it)

| # | Task | Issues | Files | Blocker |
|---|------|--------|-------|---------|
| G1 | Extract `ShelfTagPreview.tsx`, `PriceCardPreview.tsx`, `PosterPreview.tsx` from CardPreview | 2.4, 2.7 | new component files, edit `CardPreview.tsx` | E3 |
| G2 | Hoist array constants, extract `SpecRow` component, add `useMemo`/`useCallback` where needed | 5.1, 5.2 | `CardPreview.tsx` and new sub-components | G1 |
| G3 | Add debouncing (300ms) to QR/barcode preview + useEffect cleanup function | 5.5, 5.6 | `src/components/VisualSettings.tsx` | — |
| G4 | Replace 4 boolean `isGenerating*` states with `GeneratingMode` enum, fix error cache | 5.4, 5.9 | `src/components/PDFExporter.tsx` | — |
| G5 | Add async error handling — `.catch()` for QR/barcode generation in CardPreview | 2.8 | `CardPreview.tsx` | G1 |
| G6 | Wrap `brandIcons` selector with `useShallow` in App.tsx | 5.3 | `src/App.tsx` | — |

### Stream H — Store & Hook Improvements
> Blocked by: **E1** (color utils — configStore may reference color logic)

| # | Task | Issues | Files | Blocker |
|---|------|--------|-------|---------|
| H1 | Replace `JSON.stringify` equality check in useHistory with `fast-deep-equal` | 2.11 | `src/hooks/useHistory.ts`, `package.json` | — |
| H2 | Add runtime shape validation to persisted state rehydration in brandIconsStore | 2.12 | `src/stores/brandIconsStore.ts` | — |
| H3 | Consolidate history/undo into single system — evaluate zustand temporal middleware | 2.14 | `src/hooks/useHistory.ts`, `src/stores/configStore.ts` | H1 |
| H4 | Add predefined selector exports to all stores | 5.8 | `src/stores/*.ts` | — |
| H5 | Surface error messages for preset import failures | 2.9 | `src/stores/presetsStore.ts` | — |
| H6 | Move filename sanitization to queue insertion time, add batch processing (3 at a time) | 5.7, 5.10 | `src/stores/printQueueStore.ts` | — |

**Phase 3 Deliverable:** CardPreview split into focused components, stores hardened, performance fixed.
Run `npm run lint && npm test && npm run build` to validate.

---

## Phase 4: Test Hardening (1 stream)

### Stream I — Test Quality Improvements
> Blocked by: All prior phases (tests must target the new code structure)

| # | Task | Issues | Files | Blocker |
|---|------|--------|-------|---------|
| I1 | Fix PDF generator tests — assert on `mockDoc.text()`, `setFontSize()`, `addImage()` call args | 3.1 | `src/test/__tests__/utils/pdfGenerator.test.ts` | F* |
| I2 | Fix barcode tests — verify format arg, add error path tests | 3.2 | `src/test/__tests__/utils/barcode.test.ts` | — |
| I3 | Import validation constants instead of hardcoding (barcode 80-char limit) | 3.7 | `src/test/__tests__/utils/barcode.test.ts` | I2 |
| I4 | Add FileReader failure tests, rapid upload tests, oversized file tests | 3.4 | `src/test/__tests__/components/BrandIconManager.test.tsx` | — |
| I5 | Add localStorage quota exceeded tests, name collision tests, corrupted data tests | 3.5 | `src/test/__tests__/components/PresetManager.test.tsx` | — |
| I6 | Add long text wrapping / overflow tests for PDF generation | 3.6 | `src/test/__tests__/utils/pdfGenerator.test.ts` | I1 |
| I7 | Replace hardcoded price formatting in PresetManager tests with dynamic assertion | 3.8 | `src/test/__tests__/components/PresetManager.test.ts` | — |
| I8 | Add JSDoc documentation to layoutSchema exported types | 2.20 | `src/utils/layoutSchema.ts` | — |
| I9 | Update test for new pdfRenderer module structure (shelf/price/poster split) | — | `src/test/__tests__/utils/pdfGenerator.test.ts` | F*, I1 |

**Phase 4 Deliverable:** Tests verify actual behavior, edge cases covered, brittle values removed.
Run full `npm test -- --coverage` — all thresholds must pass.

---

## Execution Summary

```
Phase 1 ─────────────────────────────────  (parallel: A + B + C + D)
  │  20 tasks, ~2 days
  ▼
Phase 2 ─────────────────────────────────  (parallel: E + F)
  │  12 tasks, ~2 days  (F blocked by E1+E2)
  ▼
Phase 3 ─────────────────────────────────  (parallel: G + H)
  │  12 tasks, ~2 days
  ▼
Phase 4 ─────────────────────────────────  (sequential: I)
  │   9 tasks, ~1.5 days
  ▼
Done ─── 53 tasks total ─── ~7.5 days estimated
```

## Blockers & Risks

| Blocker | Impact | Mitigation |
|---------|--------|------------|
| ESLint rule changes (C6) may surface new errors across codebase | Could cascade into unexpected failures | Run `npx eslint . --fix` immediately after C6, fix remaining manually |
| `fast-deep-equal` dependency addition (H1) | New runtime dependency | Small, zero-dep, well-maintained package; acceptable |
| Consolidating history systems (H3) | Could break undo/redo for users | Feature-flag the migration, test thoroughly with manual undo/redo |
| Splitting pdfGenerator (F1-F4) | Most impactful refactoring — touches lazy import path | Keep the module's public API identical; only internal reorganization |
| Deleting `CardPreviewUnified.tsx` (D1) | Loses the unified rendering approach | Decision: if we want unified rendering later, we can rebuild from `renderToHtml.tsx` + `layoutBuilders.ts` which remain |
| Platform-specific CI changes (C7) | GitHub Actions matrix syntax complexity | Test in a PR first, don't merge broken CI to main |

## Validation Gates

Each phase must pass before the next begins:

1. **Phase 1 gate:** `npm run lint && npm test && npm run build` pass; no security findings in manual review of changed IPC handlers
2. **Phase 2 gate:** `npm run lint && npm test && npm run build` pass; `pdfGenerator.ts` < 400 lines; no new `any` types
3. **Phase 3 gate:** `npm run lint && npm test && npm run build` pass; `CardPreview.tsx` < 200 lines; no unnecessary re-renders in React DevTools
4. **Phase 4 gate:** `npm test -- --coverage` passes all thresholds; no `vi.fn()` mocks without call-argument assertions in PDF tests
