# Next Steps: Nestar → Petoria

> **Status as of 2026-10-04:** Phase 1 (rename) and Phase 2 (Property → Product) are done. Phase 2 is not committed yet. Start with **P0**.
> Each backend item must end with: `tsc --noEmit` passes for both apps, `npm run build` and `npx nest build petoria-batch` pass, `npx eslint "apps/**/*.ts"` shows ≤ 20 errors (the existing baseline), and `npx jest` passes.
> Domain rules: [`AGENTS.md`](../../AGENTS.md). Related: [BACKEND_MIGRATION](BACKEND_MIGRATION.md) · [DECISIONS](DECISIONS.md) · [PROMPTS](PROMPTS.md)

## A. Finish Phase 2

| # | Task | Done when |
|---|---|---|
| P0 | Review and commit the Property → Product working tree. Also commit the `docs/` → `docs/ai/` move (stage the deletions too) | Clean `git status` |
| P1 | Run the dev data migration (`mongosh` snippet in [BACKEND_MIGRATION §7](BACKEND_MIGRATION.md#7-mongodb-collection-and-schema-changes)) | No `PROPERTY` group docs; `properties` dropped |
| P2 | Write-path smoke test in the playground: AGENT signup → `createProduct` → `getProducts` with type/species/gender filters → `getProduct` as another user (views +1) → `likeTargetProduct` → `getFavorites` / `getVisited` → `createComment` with group `PRODUCT` (`productComments` +1) → admin operations | All steps return the expected data |
| P3 | Update the ER diagram: `notifications.propertyId` → `productId`; remove the stale reference names (`properties_views`, `cars-*`) | ER matches `schemas/*.model.ts` |

## B. Backend cleanup (non-breaking)

| # | Task | Files |
|---|---|---|
| P4 | Delete the duplicate DTO | `apps/petoria-api/src/libs/dto/board-articles/board-article.input (1).ts` |
| P5 | Delete stale build output | `dist/apps/nestar-*` |
| P6 | Fix the 20 existing lint errors | `auth.service.ts`, `authMember.decorator.ts`, `without.guard.ts`, `Notice.model.ts`, `socket.gateway.ts`, `batch.controller.ts`, batch e2e spec |
| P7 | Make Jest load ESM `uuid` (`transformIgnorePatterns` or `moduleNameMapper`), then remove the `jest.mock('uuid')` from `product.service.spec.ts` | `package.json` jest config |
| P8 | Fix the API e2e expectation ("Hello World!") | `apps/petoria-api/test/app.e2e-spec.ts` |
| P9 | Review whether the product unique index `{productType, productLocation, productTitle, productPrice}` fits the domain (e.g. `{memberId, productTitle}`) | `schemas/Product.model.ts` |
| P10 | Decide whether `productGender` should be required for non-PET products (the ER says NN) | schema + DTO |

## C. Frontend migration

| # | Task |
|---|---|
| F1 | Inspect the frontend repo and correct the assumed paths in [FRONTEND_MIGRATION](FRONTEND_MIGRATION.md) |
| F2 | Apply the operation renames in [BACKEND_MIGRATION §6](BACKEND_MIGRATION.md#6-graphql-changes-applied) (`getProperties` → `getProducts`, `propertyId` → `productId`, and so on) |
| F3 | Replace real-estate UI fields (beds/rooms/square/rent/barter/address/constructedAt) with type/species/gender |
| F4 | Terminology pass (Property → Product). **Agent stays Agent** per `AGENTS.md` |

## D. Testing

| # | Task |
|---|---|
| T1 | Extend `product.service.spec.ts`: `updateProduct` sets `soldAt` / `deletedAt` and decreases `memberProducts`; `getAgentProducts` rejects `DELETE` |
| T2 | Like/view service specs for `getFavoriteProducts` / `getVisitedProducts` pipeline shape |
| T3 | Batch spec: `batchTopProducts` rank = likes×2 + views; `batchTopAgents` uses `memberProducts` |
| T4 | e2e against a test DB (or `mongodb-memory-server`) |

## E. Documentation

| # | Task |
|---|---|
| D1 | Replace the boilerplate `README.md` with a Petoria overview, setup, env keys and scripts |
| D2 | Fix `AGENTS.md` validation typo `npx run build` → `npm run build` |
| D3 | Rename `skills/*/skill.md` → `SKILL.md` and change the `===` frontmatter fences to `---` |
| D4 | Bring `FRONTEND_MIGRATION.md` and `PROMPTS.md` in line with `AGENTS.md` (no SELLER, no Pet/Order modules) |
