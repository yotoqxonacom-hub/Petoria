# Backend Migration: Nestar → Petoria

> **Status as of 2026-10-04:** Phase 1 (safe rename layer) is complete and committed (`26dce13`). Phase 2 (domain refactor) has not started.
> Related: [DECISIONS](DECISIONS.md) · [COMPLETED_TASKS](COMPLETED_TASKS.md) · [NEXT_STEPS](NEXT_STEPS.md) · [FRONTEND_MIGRATION](FRONTEND_MIGRATION.md)

---

## 1. Original project summary (Nestar)

Nestar is a real-estate listing platform built as a NestJS monorepo.

| Aspect | Details |
|---|---|
| Monorepo | Nest CLI monorepo (`nest-cli.json` with `"monorepo": true`) and webpack builds |
| Apps | `nestar-api`: GraphQL API. `nestar-batch`: cron jobs that compute rankings |
| Stack | NestJS 10, `@nestjs/graphql` + Apollo Server 4 (code-first, `autoSchemaFile: true`), Mongoose 8, `@nestjs/jwt`, bcryptjs, class-validator, `graphql-upload-minimal`, `@nestjs/schedule`, `ws` (`WsAdapter`) |
| Domain | `Property` listings (APARTMENT / VILLA / HOUSE) in Korean cities. Listings are created by `AGENT` members |
| API modules | `auth`, `member`, `property`, `board-article`, `comment`, `like`, `view`, `follow`, `socket` (WebSocket chat) |
| Schemas only (no module) | `Notice`, `Notification` |
| Batch jobs | `BATCH_ROLLBACK`, `BATCH_TOP_PROPERTIES`, `BATCH_TOP_AGENTS` (daily at 01:00, 01:00:20 and 01:00:40) |
| Env | `PORT_API`, `PORT_BATCH`, `MONGO_DEV`, `MONGO_PROD`, `SECRET_TOKEN` |

## 2. New project summary (Petoria)

Petoria is a petshop platform. Sellers list **pet products** (supplies) and **pets** (for sale or adoption), and buyers place **orders**. The community features (board articles, comments, likes, follows, views, chat) stay as they are.

| Aspect | Target |
|---|---|
| Apps | `petoria-api`, `petoria-batch` (**done**) |
| Listing domains | `Product` (replaces `Property`), `Pet` (new) |
| Commerce | `Order` and `OrderItem` (new) |
| Roles | `USER`, `SELLER` (replaces `AGENT`), `ADMIN` |
| Batch | Rank top products, top pets and top sellers |

## 3. Backend migration goal

Turn the real-estate backend into a petshop backend in **phases**, so every phase builds, typechecks and runs on its own.

| Phase | Scope | Breaks API? | Status |
|---|---|---|---|
| 1 | Safe rename layer: project and app identifiers Nestar → Petoria. No logic, API or DB changes | No | ✅ Done |
| 2a | Cleanup: duplicate files, stale `dist`, existing lint errors, API e2e test | No | ⏳ Next |
| 2b | Role rename `AGENT` → `SELLER` and the matching member counters | **Yes** | Planned |
| 2c | `Property` → `Product` module | **Yes** | Planned |
| 2d | New `Pet` module | Additive | Planned |
| 2e | New `Order` / `OrderItem` module | Additive | Planned |
| 2f | Rewire the shared modules (like, view, comment, notification) | **Yes** | Planned |
| 2g | Batch jobs for products, pets and sellers | No (internal) | Planned |

## 4. Naming changes

### 4.1 Done (Phase 1)

| Before | After | Where |
|---|---|---|
| `apps/nestar-api/` | `apps/petoria-api/` | folder (`git mv`) |
| `apps/nestar-batch/` | `apps/petoria-batch/` | folder (`git mv`) |
| Nest project keys `nestar-api` / `nestar-batch` | `petoria-api` / `petoria-batch` | `nest-cli.json` |
| npm package `nestar` | `petoria` | `package.json`, `package-lock.json` |
| `dist/apps/nestar-*` | `dist/apps/petoria-*` | `tsconfig.app.json` `outDir`, `start:prod*` scripts |
| `nest start nestar-batch --watch` | `nest start petoria-batch --watch` | `start:dev:batch` |
| `./apps/nestar-api/test/jest-e2e.json` | `./apps/petoria-api/test/jest-e2e.json` | `test:e2e` |
| `'Welcome to Nestar Rest API Server!'` | `'Welcome to Petoria Rest API Server!'` | `petoria-api/src/app.service.ts` |
| `'Welcome to Nestar BATCH Server!'` | `'Welcome to Petoria BATCH Server!'` | `petoria-batch/src/batch.service.ts` |
| `../../nestar-api/src/...` imports | `../../petoria-api/src/...` | `petoria-batch/src/batch.module.ts`, `batch.service.ts` |

### 4.2 Planned (Phase 2)

| Before | After |
|---|---|
| `MemberType.AGENT` | `MemberType.SELLER` |
| `Property*` (class, DTO, enum, schema, service, resolver) | `Product*` |
| `PropertyType` (APARTMENT, VILLA, HOUSE) | `ProductCategory` (FOOD, TOY, ACCESSORY, GROOMING, HEALTH, HOUSING) |
| `PropertyStatus` (ACTIVE, SOLD, DELETE) | `ProductStatus` (ACTIVE, SOLD_OUT, DELETE) |
| `PropertyLocation` | `PetLocation` (moves to the Pet domain) |
| — | `PetSpecies` (DOG, CAT, BIRD, FISH, REPTILE, SMALL_ANIMAL), shared by Product and Pet |
| `AgentsInquiry`, `availableAgentSorts` | `SellersInquiry`, `availableSellerSorts` |
| `availablePropertySorts`, `availableOptions` | `availableProductSorts`, `availablePetSorts`, `availablePetOptions` |
| `memberProperties` | `memberProducts`, `memberPets`, `memberOrders` |
| `BATCH_TOP_PROPERTIES`, `BATCH_TOP_AGENTS` | `BATCH_TOP_PRODUCTS`, `BATCH_TOP_PETS`, `BATCH_TOP_SELLERS` |
| `LikeGroup` / `ViewGroup` / `CommentGroup` / `NotificationGroup` value `PROPERTY` | `PRODUCT`, plus a new `PET` |

## 5. Module changes (planned)

| Module | Change | Notes |
|---|---|---|
| `components/property` | **Replaced** by `components/product` | Mirror the files 1:1 (`*.module.ts`, `*.service.ts`, `*.resolver.ts`, `dto/product/*`, `schemas/Product.model.ts`, `enums/product.enum.ts`) |
| `components/pet` | **New** | Same pattern and method set as product |
| `components/order` | **New** | `OrderService` depends on `ProductService` (stock) and `MemberService` (counters) |
| `components/member` | Changed | `getAgents` → `getSellers`; `@Roles(AGENT)` → `@Roles(SELLER)` everywhere |
| `components/like` | Changed | `getFavoriteProperties` → `getFavoriteProducts` / `getFavoritePets` through one generic aggregation helper |
| `components/view` | Changed | `getVisitedProperties` → `getVisitedProducts` / `getVisitedPets` |
| `components/comment` | Changed | Imports `ProductModule` and `PetModule`. The `CommentGroup.PRODUCT` / `PET` paths call `productStatsEditor` / `petStatsEditor` |
| `libs/config.ts` | Changed | `lookupFavorite` / `lookupVisit` take a field parameter. Sort allowlists are renamed |
| `libs/dto/common/common.input.ts` | **New** | `OrdinaryInquiry` moves here from `dto/property/property.input.ts` |
| `components.module.ts` | Changed | Imports `ProductModule`, `PetModule`, `OrderModule` |
| `auth`, `board-article`, `follow`, `socket` | Unchanged | — |
| `petoria-batch` | Changed | Registers the Product, Pet and Member schemas and adds a pets cron slot (`00 01 01 * * *`) |

## 6. GraphQL changes (planned; the current schema is still Nestar-shaped)

### 6.1 Operations

| Current operation | Planned operation | Guard / role |
|---|---|---|
| `createProperty` | `createProduct`, `createPet` | `RolesGuard` SELLER |
| `getProperty(propertyId)` | `getProduct(productId)`, `getPet(petId)` | `WithoutGuard` |
| `updateProperty` | `updateProduct`, `updatePet` | SELLER |
| `getProperties` | `getProducts`, `getPets` | `WithoutGuard` |
| `getFavorites` | `getFavoriteProducts`, `getFavoritePets` | `AuthGuard` |
| `getVisited` | `getVisitedProducts`, `getVisitedPets` | `AuthGuard` |
| `getAgentProperties` | `getSellerProducts`, `getSellerPets` | SELLER |
| `likeTargetProperty` | `likeTargetProduct`, `likeTargetPet` | `AuthGuard` |
| `getAllPropertiesByAdmin` | `getAllProductsByAdmin`, `getAllPetsByAdmin` | ADMIN |
| `updatePropertyByAdmin` | `updateProductByAdmin`, `updatePetByAdmin` | ADMIN |
| `removePropertyByAdmin` | `removeProductByAdmin`, `removePetByAdmin` | ADMIN |
| `getAgents` | `getSellers` | `WithoutGuard` |
| — | `createOrder`, `getMyOrders`, `updateOrder` | `AuthGuard` |
| — | `getAllOrdersByAdmin`, `updateOrderByAdmin` | ADMIN |
| `signup`, `login`, `checkAuth`, `checkAuthRoles`, `getMember`, `updateMember`, `likeTargetMember`, `getAllMembersByAdmin`, `updateMembersByAdmin`, `imageUploader`, `imagesUploader` | Unchanged | — |
| BoardArticle, Comment and Follow operations | Unchanged (only the group enum values change) | — |

### 6.2 Types and inputs

| Current | Planned |
|---|---|
| `Property`, `Properties` | `Product`, `Products`; `Pet`, `Pets` |
| `PropertyInput`, `PropertyUpdate` | `ProductInput` / `ProductUpdate`, `PetInput` / `PetUpdate` |
| `PropertiesInquiry`, `AgentPropertiesInquiry`, `AllPropertiesInquiry` | `ProductsInquiry` / `SellerProductsInquiry` / `AllProductsInquiry` (and the same set for Pet) |
| `SquaresRange`, `roomsList`, `bedsList`, `options: [propertyBarter, propertyRent]` | Removed. Products add `categoryList`, `speciesList`, `inStock`. Pets add `speciesList`, `genderList`, `locationList`, `options: [petVaccinated, petNeutered]` |
| `AgentsInquiry` | `SellersInquiry` |
| — | `Order`, `Orders`, `OrderInput`, `OrderItemInput`, `OrderUpdate`, `OrdersInquiry`, enum `OrderStatus` |
| Enum `MemberType { USER AGENT ADMIN }` | `MemberType { USER SELLER ADMIN }` |

## 7. MongoDB collection and schema changes (planned)

| Collection | Change | Fields |
|---|---|---|
| `properties` | **Retired**, replaced by `products` | — |
| `products` | **New** | `productCategory`, `productSpecies`, `productStatus`, `productTitle`, `productBrand`, `productPrice`, `productStock`, `productImages`, `productDesc`, `productViews/Likes/Comments/Rank`, `memberId`, `soldOutAt`, `deletedAt`, timestamps. Unique index `{memberId, productTitle}` |
| `pets` | **New** | `petSpecies`, `petBreed`, `petGender`, `petAgeMonths`, `petStatus` (ACTIVE / RESERVED / SOLD / DELETE), `petLocation`, `petTitle`, `petPrice`, `petImages`, `petDesc`, `petVaccinated`, `petNeutered`, `petViews/Likes/Comments/Rank`, `memberId`, `soldAt`, `deletedAt` |
| `orders` | **New** | `orderTotal`, `orderDelivery`, `orderStatus` (PENDING / PAID / SHIPPED / DELIVERED / CANCELED / DELETE), `orderAddress`, `memberId` (buyer) |
| `orderItems` | **New** | `orderId`, `productId`, `itemPrice` (price at order time), `itemQuantity` |
| `members` | Changed | `memberType: AGENT` → `SELLER`; `memberProperties` → `memberProducts`; adds `memberPets`, `memberOrders` |
| `likes`, `views`, `comments` | Data change | `likeGroup` / `viewGroup` / `commentGroup` `PROPERTY` → `PRODUCT` (or delete those rows) |
| `notifications` | Changed | `propertyId` → `productId`; adds `petId`; group `PROPERTY` → `PRODUCT` |
| `boardArticles`, `follows`, `notices` | Unchanged | — |

Dev data migration, to run by hand with `mongosh` against `MONGO_DEV` **after** Phase 2b/2c ships. The application code does not run this.

```js
db.members.updateMany({ memberType: 'AGENT' }, { $set: { memberType: 'SELLER' } });
db.members.updateMany({}, { $rename: { memberProperties: 'memberProducts' } });
db.members.updateMany({}, { $set: { memberPets: 0, memberOrders: 0 } });
['likes', 'views'].forEach((c) => db[c].deleteMany({ [c.slice(0, -1) + 'Group']: 'PROPERTY' }));
db.comments.deleteMany({ commentGroup: 'PROPERTY' });
db.properties.drop();
```

## 8. Compatibility notes

- **Phase 1 is fully backward compatible.** The GraphQL schema, collection names, env keys and ports did not change, so the existing Nestar frontend still works against `petoria-api`.
- **Phase 2b/2c/2f break the API.** Enum values (`AGENT`, `PROPERTY`) and operation names change. Ship the backend and the frontend together, or keep a temporary alias resolver for one release (not planned by default).
- **Enum stored as data.** Mongoose enum validation rejects existing `AGENT` and `PROPERTY` documents on write once the enums change. Run the migration snippet first.
- **Batch shares code with the API** through relative imports (`../../petoria-api/src/...`). Every schema or DTO rename in the API must be mirrored in `petoria-batch`.
- **Unique index change.** The old `properties` index `{propertyType, propertyLocation, propertyTitle, propertyPrice}` is not carried over. `products` uses `{memberId, productTitle}`.
- **Stale build output.** `dist/apps/nestar-*` still exists on disk (gitignored). The `start:prod*` scripts point to `dist/apps/petoria-*`.
- **`start:prod`** uses the POSIX form `NODE_ENV=production node ...`, which does not work in Windows PowerShell or cmd. This is an existing issue and was not changed.
