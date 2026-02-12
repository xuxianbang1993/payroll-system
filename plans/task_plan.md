# Task Plan: P1 SQLite Foundation and Migration Start

## Goal
Complete P1 foundation by introducing SQLite as main data storage with safe test isolation, while preserving rollback capability and evidence-driven delivery.

## Current Phase
Phase 5

## Phases

### Phase 1: Requirements & Discovery
- [x] Summarize current project status from prior conversation
- [x] Read P1-related SOP/PRD files and confirm constraints
- [x] Align on migration guardrails (APP_ENV, TEST_DB_PATH, READ_SOURCE, WRITE_MODE)
- **Status:** complete

### Phase 2: Planning & Structure
- [x] Initialize planning memory files (task_plan/findings/progress)
- [x] Draft P1 implementation plan file under plans/
- [x] Confirm sequence for foundation-first delivery (DB -> repository -> test harness -> features)
- **Status:** complete

### Phase 3: Implementation
- [x] Add SQLite client bootstrap (WAL, foreign_keys, schema version)
- [x] Add migration runner and initial schema
- [x] Add DB admin IPC contract (runtime info + guarded reset bridge)
- [x] Add repository abstraction with read/write source switching
- [x] Add test-only reset guard and temporary DB lifecycle support
- [x] Integrate settings + employee + backup/storage paths to new repository layer
- **Status:** complete

### Phase 4: Testing & Verification
- [x] Add/extend unit tests for DB init, migration, read/write modes
- [x] Add db-isolation spec (test mode reset allowed, prod mode denied)
- [x] Run npm run test and npm run test:e2e (P1 targeted suites + db-isolation)
- [x] Produce raw JSON + case-map evidence, then milestone XLSX
- **Status:** complete

### Phase 5: Delivery
- [ ] Summarize code changes and risks
- [ ] Prepare commit(s) with clear scopes
- [ ] Request code review before merge
- **Status:** pending

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Start P1 with docs + SOP alignment before coding | Reduces migration ambiguity and protects production data handling |
| Foundation-first sequence for P1 | Prevents feature code from coupling to unstable storage APIs |
| Enforce test DB isolation using APP_ENV and TEST_DB_PATH | Allows safe CRUD/reset testing without touching production data |
| Store planning artifacts in `/Users/xuxianbang/Documents/payroll system/plans/` by default | Aligns with user requirement for centralized planning updates |
| Introduce automated ABI switching before test commands | Prevents Node/Electron native module mismatch when alternating Vitest and Playwright |

## Errors Encountered
| Error | Resolution |
|-------|------------|
| `TS7016` missing declaration for `better-sqlite3` | Installed `@types/better-sqlite3` as dev dependency |
| `TS2835` NodeNext requires extension for relative import | Updated `electron/db/client.ts` import to `./config.js` |
| `NODE_MODULE_VERSION` mismatch (Node vs Electron) | Added `abi:node`/`abi:electron` auto-switch scripts and test command wiring |
| Electron opened default page / renderer blank in db-isolation | Fixed app entry launch semantics, preload CJS output, and Vite `base: "./"` |
