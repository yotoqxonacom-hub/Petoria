# Completed Tasks: Nestar → Petoria

> **Status as of 2026-10-04:** Phase 1 (safe rename layer) is complete. Domain refactor not started.
> Commits: `d94035e feat: start migration process` → `26dce13 fix: modify project name into Petoria` (branch `develop`).
> Related: [BACKEND_MIGRATION](BACKEND_MIGRATION.md) · [NEXT_STEPS](NEXT_STEPS.md)

## 1. Monorepo analysis (read-only)

| Area | Finding |
|---|---|
| Apps | `nestar-api` (GraphQL, Apollo, code-first), `nestar-batch` (cron rank jobs) |
| API modules | auth, member, property, board-article, comment, like, view, follow, socket (`ws` chat) |
| Code coupled to Property | `comment.service.ts` (`propertyStatsEditor`), `like.service.getFavoriteProperties`, `view.service.getVisitedProperties`, `libs/config.ts` (`lookupFavorite`, `lookupVisit`, sort allowlists), the `PROPERTY` value in the group enums, `Member.memberProperties`, `MemberType.AGENT`, `Notification.propertyId`, the batch app |
| Known debt | Duplicate `libs/dto/board-articles/board-article.input (1).ts`. Duplicate `nestar-batch/src/lib/config.ts`. `Notice` and `Notification` have schemas but no modules. API e2e test expects "Hello World!". README is boilerplate |

## 2. Decisions collected from the user

| Question | Answer |
|---|---|
| Replacement for Property | Product + Pet + Order |
| AGENT role | SELLER |
| App folder names | Rename to `petoria-*` |
| Execution scope (after reviewing the full plan) | **Safe rename layer only.** No business logic change; APIs and collections unchanged |

## 3. Phase 1: Safe rename layer

| File | Change |
|---|---|
| `apps/nestar-api/` → `apps/petoria-api/` | `git mv` |
| `apps/nestar-batch/` → `apps/petoria-batch/` | `git mv` |
| `nest-cli.json` | Top-level `sourceRoot`/`root`/`tsConfigPath`; project keys and their paths → `petoria-api` / `petoria-batch` |
| `package.json` | `name: petoria`; scripts `start:dev:batch`, `start:prod`, `start:prod:batch`, `test:e2e` |
| `package-lock.json` | The two top-level `name` fields → `petoria` (edited by hand, no reinstall) |
| `apps/petoria-api/tsconfig.app.json` | `outDir: ../../dist/apps/petoria-api` |
| `apps/petoria-batch/tsconfig.app.json` | `outDir: ../../dist/apps/petoria-batch` |
| `apps/petoria-api/src/app.service.ts` | Welcome string → "Welcome to Petoria Rest API Server!" |
| `apps/petoria-batch/src/batch.module.ts` | Schema imports → `../../petoria-api/src/schemas/*` |
| `apps/petoria-batch/src/batch.service.ts` | DTO/enum imports → `../../petoria-api/src/...`; welcome string → Petoria |
| `apps/petoria-batch/test/app.e2e-spec.ts` | `NestarBatchModule` (never existed) → `BatchModule`; describe label → `PetoriaBatchController (e2e)` |

Diff size: 9 files with content changes (31 insertions, 31 deletions) plus the two folder renames. Line endings were kept as they were.

## 4. Validation

| Check | Command | Before | After |
|---|---|---|---|
| Typecheck (api) | `npx tsc --noEmit -p apps/petoria-api/tsconfig.app.json` | ✅ 0 errors | ✅ 0 errors |
| Typecheck (batch) | `npx tsc --noEmit -p apps/petoria-batch/tsconfig.app.json` | ✅ 0 errors | ✅ 0 errors |
| Lint (report-only) | `npx eslint "apps/**/*.ts"` | 20 errors | 20 errors (same; none new) |
| Build (api) | `npm run build` | — | ✅ webpack compiled → `dist/apps/petoria-api/main.js` |
| Build (batch) | `npx nest build petoria-batch` | — | ✅ webpack compiled → `dist/apps/petoria-batch/main.js` |
| Smoke: API root | `GET /` | — | ✅ "Welcome to Petoria Rest API Server!" |
| Smoke: GraphQL | `POST /graphql {__typename}` | — | ✅ `{"data":{"__typename":"Query"}}` |
| Smoke: DB | API boot log | — | ✅ "MongoDB is connected into development db" |
| Smoke: batch root | `GET /` on `PORT_BATCH` | — | ✅ "Welcome to Petoria BATCH Server!" |
| Leftover identifiers | `grep -ri nestar` (excl. node_modules, dist, .git) | many | ✅ 0 matches |

The 20 lint errors already existed (unused vars, `await-thenable`, `no-unsafe-*`). They are in `auth.service.ts`, `authMember.decorator.ts`, `without.guard.ts`, `Notice.model.ts`, `socket.gateway.ts`, `batch.controller.ts` and `petoria-batch/test/app.e2e-spec.ts`.

## 5. Deliberately not done

- No changes to the domain (Property, AGENT), GraphQL schema, Mongoose schemas or collections.
- No changes to `.env` keys or values.
- Lint errors not fixed. `npm run lint` was not used because its `--fix` flag would rewrite unrelated files.
- Stale `dist/apps/nestar-*` not deleted (gitignored).
- `README.md`, `AGENTS.md` and `SKILLS.md` not updated.

## 6. Documentation

- `docs/` created with `BACKEND_MIGRATION.md`, `DECISIONS.md`, `FRONTEND_MIGRATION.md`, `COMPLETED_TASKS.md`, `NEXT_STEPS.md` and `PROMPTS.md`. No source code changed.
