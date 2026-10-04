# Completed Tasks: Nestar → Petoria

> **Status as of 2026-10-04:** Phase 1 (rename layer) and Phase 2 (Property → Product, §7) are complete. Phase 2 is not committed yet.
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

## 7. Phase 2: Property → Product (follows the ER model and `AGENTS.md`)

Constraints: `MemberType` unchanged (`USER / AGENT / ADMIN`); no real-estate fields; existing module/DTO/enum/schema structure kept. Files moved with `git mv` so history is kept.

### 7.1 Files

| File | Change |
|---|---|
| `components/property/*` → `components/product/{product.module,product.service,product.resolver}.ts` | Renamed classes and methods. `shapeMatchQuery` now filters by type, species, gender, location, price, period and text (rooms, beds, square and options removed) |
| `components/product/product.service.spec.ts` | **New**: 3 tests on the `getProducts` `$match` |
| `libs/dto/property/*` → `libs/dto/product/{product,product.input,product.update}.ts` | ER fields; `speciesList` / `genderList` filters; `SquaresRange` removed |
| `libs/enums/property.enum.ts` → `libs/enums/product.enum.ts` | `ProductType`, `ProductSpecies`, `ProductGender`, `ProductStatus`, `ProductLocation` |
| `schemas/Property.model.ts` → `schemas/Product.model.ts` | Collection `products` |
| `schemas/Member.model.ts`, `libs/dto/member/member.ts` | `memberProperties` → `memberProducts` |
| `schemas/Notification.model.ts` | `propertyId` → `productId` (ref `Product`) |
| `libs/enums/{like,view,comment,notification}.enum.ts` | `PROPERTY` → `PRODUCT` |
| `libs/config.ts` | `availableProductSorts`; `availableOptions` removed; `favoriteProduct` / `visitedProduct` lookups |
| `components/like/like.service.ts` | `getFavoriteProducts` (`from: 'products'`) |
| `components/view/view.service.ts` | `getVisitedProducts` (`from: 'products'`) |
| `components/comment/comment.{module,service}.ts` | `ProductModule` / `productStatsEditor('productComments')` |
| `components/components.module.ts` | `ProductModule` |
| `petoria-batch/src/batch.{module,service,controller}.ts`, `libs/config.ts` | Product model, `BATCH_TOP_PRODUCTS` / `batchTopProducts`, agent rank uses `memberProducts` |
| `petoria-batch/src/lib/config.ts` | Deleted (duplicated `libs/config.ts`) |

GraphQL operations: `createProduct`, `getProduct(productId)`, `updateProduct`, `getProducts`, `getFavorites`, `getVisited`, `getAgentProducts`, `likeTargetProduct(productId)`, `getAllProductsByAdmin`, `updateProductByAdmin`, `removeProductByAdmin(productId)`.

### 7.2 Validation

| Check | Result |
|---|---|
| `grep -rniE "propert" apps/` | ✅ 0 matches |
| `npx tsc -p apps/petoria-api/tsconfig.app.json --noEmit` | ✅ pass |
| `npx tsc -p apps/petoria-batch/tsconfig.app.json --noEmit` | ✅ pass |
| `npm run build`, `npx nest build petoria-batch` | ✅ pass (after deleting the locked `dist/apps/petoria-*` incremental folders; see BACKEND_MIGRATION §8) |
| `npx eslint "apps/**/*.ts"` | ✅ 20 errors, same as the baseline; the new spec is lint-clean |
| `npx jest product.service` | ✅ 3/3 pass |
| API boot | ✅ MongoDB connected (dev) |
| GraphQL introspection | ✅ All 11 product operations present; no property operations. `ProductType` PET/FOOD/TOY/ACCESSORY, `ProductSpecies` DOG/CAT/BIRD/FISH, `ProductGender` MALE/FEMALE, `ProductStatus` ACTIVE/SOLD/DELETE, `CommentGroup` MEMBER/ARTICLE/PRODUCT, `MemberType` USER/AGENT/ADMIN |
| `getProducts` with `typeList` / `speciesList` / `genderList` | ✅ Executes; returns an empty list (no product data in the dev DB yet) |
| Batch boot | ✅ "BATCH SERVER IS READY", `GET /` = Petoria welcome |

Not executed: write-path smoke tests (signup / create / like / comment) and the dev data migration. They were left out to avoid writing test data to the shared dev DB; see NEXT_STEPS P1–P2.
