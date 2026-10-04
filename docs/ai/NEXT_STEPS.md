# Next Steps: Nestar → Petoria

> **Status as of 2026-10-04:** Phase 1 is done (`26dce13`). Start with **P1** below.
> Each backend item must end with: `tsc --noEmit` passes for both apps, `nest build` passes for both apps, and eslint shows no errors beyond the baseline of 20 (or fewer).
> Related: [BACKEND_MIGRATION](BACKEND_MIGRATION.md) · [DECISIONS](DECISIONS.md) · [PROMPTS](PROMPTS.md)

## A. Backend cleanup (non-breaking, do first)

| # | Task | Files | Done when |
|---|---|---|---|
| P1 | Delete the duplicate DTO file | `apps/petoria-api/src/libs/dto/board-articles/board-article.input (1).ts` (and the folder if it is empty) | File gone; build passes |
| P2 | Delete the duplicate batch config | `apps/petoria-batch/src/lib/config.ts` (the code imports `libs/config.ts`) | Folder gone; batch build passes |
| P3 | Delete stale build output | `dist/apps/nestar-*` | Only `dist/apps/petoria-*` remains |
| P4 | Fix the 20 existing lint errors | `auth.service.ts`, `authMember.decorator.ts`, `without.guard.ts`, `Notice.model.ts`, `socket.gateway.ts`, `batch.controller.ts`, batch e2e spec | `npx eslint "apps/**/*.ts"` shows 0 errors |
| P5 | Fix the API e2e expectation ("Hello World!" → the actual `AppController` response) | `apps/petoria-api/test/app.e2e-spec.ts` | `npm run test:e2e` passes, or is documented as needing a DB |
| P6 | Make `start:prod` work on Windows (optional) | `package.json` (`cross-env`) | Script runs in PowerShell |

## B. Backend domain refactor (breaking; one commit per phase)

| # | Phase | Summary |
|---|---|---|
| P7 | 2b SELLER | `MemberType.AGENT` → `SELLER`; `getAgents` → `getSellers`; `AgentsInquiry` → `SellersInquiry`; `availableAgentSorts` → `availableSellerSorts`; `memberProperties` → `memberProducts` + `memberPets` + `memberOrders`; every `@Roles(AGENT)` |
| P8 | 2c Product | Mirror `components/property` → `components/product` (+ dto, schema, enum); move `OrdinaryInquiry` to `dto/common`; delete the property files |
| P9 | 2f Shared rewiring | like/view generic favorites and visited helper; `lookupFavorite(field)` / `lookupVisit(field)`; comment `PRODUCT`/`PET` paths; `Notification.productId` / `petId`; group enums `PROPERTY` → `PRODUCT` + `PET` |
| P10 | 2d Pet | New `components/pet` following the product pattern |
| P11 | 2e Order | `Order` + `OrderItem` schemas, `OrderService` (stock check and decrement, cancel restores stock), resolver with buyer and admin operations |
| P12 | 2g Batch | `BATCH_TOP_PRODUCTS`, `BATCH_TOP_PETS`, `BATCH_TOP_SELLERS`; rollback resets `productRank` / `petRank` / seller `memberRank` |
| P13 | Data | Run the `mongosh` migration from [BACKEND_MIGRATION §7](BACKEND_MIGRATION.md#7-mongodb-collection-and-schema-changes-planned) against dev |

## C. Frontend migration

| # | Task |
|---|---|
| F1 | Open the frontend repo and check the assumed paths in [FRONTEND_MIGRATION §2](FRONTEND_MIGRATION.md#2-page-and-component-mapping-assumed-paths) |
| F2 | Branding only (safe now: the backend API has not changed yet) |
| F3 | Enums and types sync after P7–P11 |
| F4 | Apollo operation renames (§3 of the frontend plan) |
| F5 | Pages and components: product, pet, seller, mypage, cart/checkout/orders, admin |
| F6 | Terminology and i18n pass |

## D. Testing

| # | Task |
|---|---|
| T1 | Add a GraphQL smoke checklist / script: signup SELLER + USER → login → create product and pet → list with filters → get detail (view count +1) → like → favorites/visited → comment (counter +1) → createOrder (stock −qty) → order over stock (`OUT_OF_STOCK`) → cancel (stock restored) → admin operations |
| T2 | Unit tests for `OrderService` stock logic and the generic favorites/visited helper |
| T3 | e2e: boot `AppModule` against a test DB (or `mongodb-memory-server`) |
| T4 | Batch: call the `BatchService` rank methods directly in a test and check the computed ranks |
| T5 | Role checks: USER must be rejected by every `@Roles(SELLER)` / `@Roles(ADMIN)` operation |

## E. Documentation

| # | Task |
|---|---|
| D1 | Replace the boilerplate `README.md` with a Petoria overview, setup, env keys and scripts |
| D2 | Expand `AGENTS.md` with the domain map (Product, Pet, Order, SELLER), app names and validation commands |
| D3 | Fill `SKILLS.md` with repeatable workflows (add domain module, rename phase, validate phase) |
| D4 | After each phase, update `COMPLETED_TASKS.md` and the status lines in `docs/*` |
