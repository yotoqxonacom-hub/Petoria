# Architectural Decisions: Nestar → Petoria

> **Status as of 2026-10-04:** Phase 1 (safe rename layer) is complete. Phase 2 (domain refactor) has not started.
> Related: [BACKEND_MIGRATION](BACKEND_MIGRATION.md) · [NEXT_STEPS](NEXT_STEPS.md)

## Summary

| ID | Decision | Status |
|---|---|---|
| D-01 | Migrate in phases: a safe rename layer first, then the domain refactor | Accepted, applied |
| D-02 | Keep the NestJS monorepo with two apps (api + batch) | Accepted, applied |
| D-03 | Rename the app folders and Nest project keys to `petoria-*` | Accepted, applied |
| D-04 | Phase 1 keeps the GraphQL API, Mongo collections and env keys unchanged | Accepted, applied |
| D-05 | Target domain: Product + Pet + Order | Accepted, planned |
| D-06 | Rename `MemberType.AGENT` to `SELLER` | Accepted, planned |
| D-07 | Build new modules by mirroring the `property` module pattern 1:1 | Accepted, planned |
| D-08 | `OrderItem` is its own collection and stores a price snapshot | Accepted, planned |
| D-09 | Generalize the like/view "favorites/visited" aggregations | Accepted, planned |
| D-10 | Run lint in report-only mode during refactors (no `--fix`) | Accepted, applied |
| D-11 | Fix the broken batch e2e import as part of the rename | Accepted, applied |
| D-12 | Keep `.env` keys and DB URIs unchanged | Accepted, applied |
| D-13 | Defer README, AGENTS.md and SKILLS.md updates | Accepted |
| D-14 | Data migration is a manual `mongosh` step, not app code | Accepted, planned |

---

### D-01: Phased migration (rename first)
- **Decision:** Phase 1 renames only identifiers (project and app names, strings, paths). The domain refactor is a separate set of phases (2a–2g).
- **Why:** The first full plan (Product + Pet + Order in one pass) was rejected in favor of a "safe rename layer with no business logic change". A small diff that changes no behavior is easy to review and validate (tsc, build and smoke test all pass) and gives a clean baseline commit (`26dce13`).
- **Risks:** For a while, the code has Petoria names around Nestar domain terms (Property, Agent), which can confuse readers.
- **Alternatives:** Do everything in one big refactor (rejected: hard to review, hard to bisect). Start a new repo from scratch (rejected: throws away working auth, community and socket code).

### D-02: Keep the monorepo with api + batch
- **Decision:** Keep the Nest CLI monorepo, `petoria-api` and `petoria-batch`, and the webpack build.
- **Why:** The ranking jobs belong in a separate process from the request-serving API. The existing structure already works.
- **Risks:** Batch imports API code with relative paths (`../../petoria-api/src/...`), so the two apps are tightly coupled.
- **Alternatives:** Move shared schemas, DTOs and enums into `libs/` as a Nest library with tsconfig `paths`. This is cleaner, but it is a structural change, so it is deferred.

### D-03: Rename app folders and project keys
- **Decision:** `apps/nestar-*` → `apps/petoria-*` using `git mv`, and update `nest-cli.json`, the `package.json` scripts and the `tsconfig.app.json` `outDir`s.
- **Why:** The user wanted all visible identifiers to say Petoria. `git mv` keeps file history.
- **Risks:** External scripts, CI and deployment configs that use `dist/apps/nestar-*` or `nest start nestar-batch` will break. None exist in this repo. OneDrive file locks can block a folder rename.
- **Alternatives:** Keep the folder names and change only the strings (rejected by the user).

### D-04: Phase 1 keeps the API, collections and env stable
- **Decision:** In Phase 1, no GraphQL operation, type, enum, collection or `.env` key changes.
- **Why:** The existing frontend keeps working, and no data migration is needed for Phase 1.
- **Risks:** None for Phase 1. The breaking changes are only postponed to Phase 2.
- **Alternatives:** Rename the API at the same time (rejected: mixes the safe and breaking steps).

### D-05: Target domain is Product + Pet + Order
- **Decision:** `Property` becomes `Product` (supplies). Add `Pet` (live animals) and `Order` (+ `OrderItem`).
- **Why:** The user chose the most complete petshop scope. Products and pets have very different attributes (stock and brand vs breed, age and vaccination), so each gets its own schema.
- **Risks:** Order logic is new code with no existing pattern to copy (stock consistency, cancel and restore). Mongo has no multi-document transactions unless it runs as a replica set, so stock updates can race.
- **Alternatives:** Product only (smallest change). One generic `Listing` with a discriminator (fewer modules, but a weaker schema and validation).

### D-06: `AGENT` → `SELLER`
- **Decision:** Rename the role value and every related name: `getAgents` → `getSellers`, `AgentsInquiry` → `SellersInquiry`, `availableAgentSorts` → `availableSellerSorts`, `BATCH_TOP_AGENTS` → `BATCH_TOP_SELLERS`.
- **Why:** "Agent" is a real-estate term. "Seller" fits a marketplace.
- **Risks:** `memberType` is stored in `members`, so the data must be migrated (see D-14). Tokens issued before the change carry `AGENT`, so users must log in again.
- **Alternatives:** `SHOP` (store accounts). Keep `AGENT` (rejected: domain mismatch).

### D-07: Mirror the `property` module pattern 1:1
- **Decision:** Product and Pet copy the structure of `components/property`: `module`/`service`/`resolver`, `dto/<x>/{x.ts, x.input.ts, x.update.ts}`, `schemas/X.model.ts`, `enums/x.enum.ts`, `xStatsEditor`, `$facet` pagination with `metaCounter`, and the `lookupMember` / `lookupAuthMemberLiked` helpers.
- **Why:** The new code matches the existing code, the pattern is already proven, and it reuses the helpers in `libs/config.ts` and the guards and decorators in `components/auth`.
- **Risks:** Product and Pet will contain duplicated code.
- **Alternatives:** A generic base service or resolver. This is less duplication but more abstraction than the rest of the codebase uses; consider it after Phase 2.

### D-08: `OrderItem` collection with a price snapshot
- **Decision:** `orders` holds the header (buyer, total, status, address). `orderItems` holds one row per product with `itemPrice` copied when the order is created.
- **Why:** Order history must not change when a seller later edits a price. A separate collection keeps the order document small and makes it easy to aggregate by product.
- **Risks:** Order and items are written in two steps; a failure in between leaves orphan rows without a transaction.
- **Alternatives:** Embed the items in the order document. This makes writes atomic and is simpler, but per-product reporting is harder. Still an option if transactions are not available.

### D-09: Generalize the favorites/visited aggregations
- **Decision:** Replace `getFavoriteProperties` / `getVisitedProperties` and the hardcoded `from: 'properties'` with one private helper that takes `(group, collection, alias)`, and make `lookupFavorite(field)` / `lookupVisit(field)` take a field.
- **Why:** Products and pets both need favorites and visited lists. Without this, the same code would be copied four times.
- **Risks:** One shared helper used by two domains needs regression tests for both.
- **Alternatives:** Copy the methods per domain.

### D-10: Report-only lint during refactors
- **Decision:** Validate with `npx eslint "apps/**/*.ts"`, not `npm run lint`.
- **Why:** `npm run lint` passes `--fix`, which rewrites files that have nothing to do with the change. That would break the "no logic change" rule and add noise to the diff.
- **Risks:** The 20 existing lint errors stay until a separate cleanup task.
- **Alternatives:** Fix the lint errors as part of the rename (rejected: out of scope).

### D-11: Fix the batch e2e import during the rename
- **Decision:** `apps/petoria-batch/test/app.e2e-spec.ts` imported `NestarBatchModule`, which does not exist. Changed it to `{ BatchModule }`.
- **Why:** The rename touched this identifier anyway, and renaming it to `PetoriaBatchModule` would still have pointed at nothing.
- **Risks:** None. Test code only.
- **Alternatives:** Rename the module class to `PetoriaBatchModule` (more churn).

### D-12: Keep `.env` keys and DB URIs
- **Decision:** `PORT_API`, `PORT_BATCH`, `MONGO_DEV`, `MONGO_PROD` and `SECRET_TOKEN` are unchanged.
- **Why:** They contain no Nestar label, and changing them would break deployed environments.
- **Risks:** The database name inside the URIs may still say Nestar. That is a deployment concern, not a code concern.
- **Alternatives:** Prefix them (`PETORIA_*`). Not needed.

### D-13: Defer documentation rebranding
- **Decision:** `README.md` (Nest boilerplate), `AGENTS.md` and `SKILLS.md` were not touched in Phase 1. The migration state lives in `docs/`.
- **Why:** Phase 1 was limited to code identifiers.
- **Risks:** New contributors see out-of-date top-level docs.
- **Alternatives:** Update them now (scheduled in [NEXT_STEPS](NEXT_STEPS.md)).

### D-14: Data migration is manual
- **Decision:** Ship a `mongosh` snippet (see [BACKEND_MIGRATION §7](BACKEND_MIGRATION.md#7-mongodb-collection-and-schema-changes-planned)) and do not run migrations on app startup.
- **Why:** The dev data can be thrown away, and auto-migrations on boot are risky.
- **Risks:** Someone forgets to run it, and old enum values then fail Mongoose validation on update.
- **Alternatives:** A migration framework such as `migrate-mongo`. Worth adopting before production data exists.
