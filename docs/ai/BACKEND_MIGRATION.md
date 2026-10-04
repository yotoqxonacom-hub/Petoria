# Backend Migration: Nestar → Petoria

> **Status as of 2026-10-04:** Phase 1 (rename layer, `26dce13`) and Phase 2 (Property → Product, uncommitted working tree) are complete and validated.
> Source of truth for domain rules: [`AGENTS.md`](../../AGENTS.md). If this file and `AGENTS.md` disagree, `AGENTS.md` wins.
> Related: [DECISIONS](DECISIONS.md) · [COMPLETED_TASKS](COMPLETED_TASKS.md) · [NEXT_STEPS](NEXT_STEPS.md) · [FRONTEND_MIGRATION](FRONTEND_MIGRATION.md)

---

## 1. Original project summary (Nestar)

| Aspect | Details |
|---|---|
| Monorepo | Nest CLI monorepo (`"monorepo": true`) with webpack builds |
| Apps | `nestar-api` (GraphQL API), `nestar-batch` (cron jobs that compute rankings) |
| Stack | NestJS 10, `@nestjs/graphql` + Apollo 4 (code-first), Mongoose 8, JWT, bcryptjs, class-validator, `graphql-upload-minimal`, `@nestjs/schedule`, `ws` |
| Domain | Real-estate `Property` (APARTMENT / VILLA / HOUSE, beds/rooms/square, rent/barter) listed by `AGENT` members |
| Modules | auth, member, property, board-article, comment, like, view, follow, socket |

## 2. New project summary (Petoria)

A petshop platform. `AGENT` members list **products**. A product is a pet, food, a toy or an accessory, and is tagged with a species and a gender. The community modules (board articles, comments, likes, follows, views, chat) are unchanged.

| Aspect | Current state |
|---|---|
| Apps | `petoria-api`, `petoria-batch` |
| Catalog entity | `Product` (single model; `PET` is one `productType` value) |
| Roles | `MemberType.USER`, `AGENT`, `ADMIN`, **unchanged** (`AGENTS.md`) |
| Batch | `BATCH_ROLLBACK`, `BATCH_TOP_PRODUCTS`, `BATCH_TOP_AGENTS` |

## 3. Backend migration goal and phases

| Phase | Scope | Breaks API? | Status |
|---|---|---|---|
| 1 | Safe rename layer: project and app identifiers Nestar → Petoria | No | ✅ Done (`26dce13`) |
| 2 | Property → Product across api + batch, following the ER model | **Yes** | ✅ Done (uncommitted) |
| 3 | Cleanup: duplicate DTO, the 20 existing lint errors, API e2e test, Jest ESM (`uuid`) support | No | ⏳ Next |
| 4 | Notice and Notification modules (schemas exist, no resolvers) | Additive | Not planned yet |

## 4. Naming changes

### 4.1 Phase 1 (project identifiers)

| Before | After |
|---|---|
| `apps/nestar-api`, `apps/nestar-batch` | `apps/petoria-api`, `apps/petoria-batch` |
| npm package `nestar` | `petoria` |
| Nest project keys, `dist/apps/nestar-*`, scripts | `petoria-*` |
| Welcome strings | "Welcome to Petoria Rest API Server!" / "Welcome to Petoria BATCH Server!" |

### 4.2 Phase 2 (domain)

| Before | After |
|---|---|
| `Property`, `Properties` | `Product`, `Products` |
| `PropertyInput` / `PropertyUpdate` | `ProductInput` / `ProductUpdate` |
| `PropertiesInquiry` / `AgentPropertiesInquiry` / `AllPropertiesInquiry` | `ProductsInquiry` / `AgentProductsInquiry` / `AllProductsInquiry` |
| `PropertyType` (APARTMENT, VILLA, HOUSE) | `ProductType` (PET, FOOD, TOY, ACCESSORY) |
| — | `ProductSpecies` (DOG, CAT, BIRD, FISH) |
| — | `ProductGender` (MALE, FEMALE) |
| `PropertyStatus` (ACTIVE, SOLD, DELETE) | `ProductStatus` (ACTIVE, SOLD, DELETE) |
| `PropertyLocation` | `ProductLocation` (same city values) |
| `availablePropertySorts` | `availableProductSorts` |
| `availableOptions` (`propertyBarter`, `propertyRent`) | Removed |
| `memberProperties` | `memberProducts` |
| `LikeGroup` / `ViewGroup` / `CommentGroup` / `NotificationGroup` `.PROPERTY` | `.PRODUCT` |
| `Notification.propertyId` | `Notification.productId` |
| `PropertyService.propertyStatsEditor` | `ProductService.productStatsEditor` |
| `LikeService.getFavoriteProperties`, `ViewService.getVisitedProperties` | `getFavoriteProducts`, `getVisitedProducts` |
| `BATCH_TOP_PROPERTIES`, `batchTopProperties` | `BATCH_TOP_PRODUCTS`, `batchTopProducts` |
| Unchanged | `MemberType.AGENT`, `getAgents`, `AgentsInquiry`, `availableAgentSorts`, `BATCH_TOP_AGENTS` |

## 5. Module changes

| Path | Change |
|---|---|
| `components/property/*` → `components/product/*` | `git mv` plus rename. Same module/service/resolver structure, guards and roles (`@Roles(MemberType.AGENT)`) |
| `components/product/product.service.spec.ts` | **New** unit test for the `getProducts` `$match` filters |
| `libs/dto/property/*` → `libs/dto/product/*` | Real-estate fields removed; species and gender added |
| `libs/enums/property.enum.ts` → `product.enum.ts` | 5 enums, each with `registerEnumType` |
| `schemas/Property.model.ts` → `Product.model.ts` | Collection `products` |
| `components/like`, `components/view` | Product lookups (`from: 'products'`, aliases `favoriteProduct` / `visitedProduct`) |
| `components/comment` | Depends on `ProductModule`. The `CommentGroup.PRODUCT` case increases `productComments` |
| `components/components.module.ts` | `ProductModule` |
| `libs/config.ts` | Sort allowlist, `lookupFavorite` / `lookupVisit` fields |
| `petoria-batch` | Product schema/model, product rank job, agent rank uses `memberProducts` |
| `petoria-batch/src/lib/` | Removed (it duplicated `libs/config.ts`) |

## 6. GraphQL changes (applied)

| Old operation | New operation | Guard / role |
|---|---|---|
| `createProperty` | `createProduct` | `RolesGuard` AGENT |
| `getProperty(propertyId)` | `getProduct(productId)` | `WithoutGuard` |
| `updateProperty` | `updateProduct` | AGENT |
| `getProperties` | `getProducts` | `WithoutGuard` |
| `getFavorites` | `getFavorites` (returns `Products`) | `AuthGuard` |
| `getVisited` | `getVisited` (returns `Products`) | `AuthGuard` |
| `getAgentProperties` | `getAgentProducts` | AGENT |
| `likeTargetProperty(propertyId)` | `likeTargetProduct(productId)` | `AuthGuard` |
| `getAllPropertiesByAdmin` | `getAllProductsByAdmin` | ADMIN |
| `updatePropertyByAdmin` | `updateProductByAdmin` | ADMIN |
| `removePropertyByAdmin(propertyId)` | `removeProductByAdmin(productId)` | ADMIN |

`ProductsInquiry.search` (PISearch):

| Filter | Mongo `$match` |
|---|---|
| `memberId` | `memberId` (ObjectId) |
| `typeList` | `productType: { $in }` |
| `speciesList` | `productSpecies: { $in }` |
| `genderList` | `productGender: { $in }` |
| `locationList` | `productLocation: { $in }` |
| `pricesRange` | `productPrice: { $gte, $lte }` |
| `periodsRange` | `createdAt: { $gte, $lte }` |
| `text` | `productTitle: { $regex, 'i' }` |

Removed: `roomsList`, `bedsList`, `squaresRange` / `SquaresRange`, `options`. Admin search: `productStatus`, `productLocationList`. Agent search: `productStatus`.

## 7. MongoDB collection and schema changes

`products` (replaces `properties`) matches the ER model:

| Field | Type | Required |
|---|---|---|
| `productType` | enum | ✔ |
| `productSpecies` | enum | ✔ |
| `productGender` | enum | ✔ |
| `productStatus` | enum, default `ACTIVE` | ✔ |
| `productLocation` | enum | ✔ |
| `productTitle` | string | ✔ |
| `productPrice` | number (double) | ✔ |
| `productViews`, `productLikes`, `productComments`, `productRank` | int, default 0 | ✔ |
| `productImages` | [string] | ✔ |
| `productDesc` | string | |
| `memberId` | ObjectId → `Member` | ✔ |
| `soldAt`, `deletedAt` | date | |
| `createdAt`, `updatedAt` | timestamps | ✔ |

Unique index: `{ productType, productLocation, productTitle, productPrice }`. It carries over the old property index shape.

Other collections:

| Collection | Change |
|---|---|
| `members` | `memberProperties` → `memberProducts` |
| `likes`, `views`, `comments`, `notifications` | Group value `PROPERTY` → `PRODUCT` |
| `notifications` | `propertyId` → `productId` (ref `Product`). ⚠ The ER diagram still shows `propertyId`; update it |
| `boardArticles`, `follows`, `notices` | Unchanged |

Dev data migration. Run it by hand with `mongosh` against `MONGO_DEV`; the app does not run it:

```js
db.members.updateMany({}, { $rename: { memberProperties: 'memberProducts' } });
['likes', 'views'].forEach((c) => db[c].deleteMany({ [c.slice(0, -1) + 'Group']: 'PROPERTY' }));
db.comments.deleteMany({ commentGroup: 'PROPERTY' });
db.notifications.deleteMany({ notificationGroup: 'PROPERTY' });
db.properties.drop();
```

## 8. Compatibility notes

- **Phase 2 breaks the GraphQL contract.** Operation names, the `propertyId` argument, `Property*` types and the `PROPERTY` enum values are gone. The frontend must switch at the same time (see [FRONTEND_MIGRATION](FRONTEND_MIGRATION.md)).
- `MemberType` is unchanged, so existing JWTs and role checks keep working.
- **Old data:** documents with `likeGroup` / `viewGroup` / `commentGroup` `PROPERTY` now fail Mongoose enum validation on write. Run the migration above.
- `LikeGroup` and `ViewGroup` are registered enums, but no GraphQL type references them, so they don't appear in schema introspection. This is expected.
- **Batch shares code with the API** through relative imports (`../../petoria-api/src/...`). Mirror any later schema or DTO rename in batch.
- **Jest:** `uuid@14` is ESM-only, and the ts-jest setup can't load it. Specs that import `libs/config.ts` must call `jest.mock('uuid', ...)` (see `product.service.spec.ts`) until the Jest config is fixed.
- **Windows/OneDrive:** `nest build` can fail with `EPERM rmdir dist/apps/petoria-*/petoria-*`. The fix is to delete `dist/apps/petoria-*` and rebuild.
