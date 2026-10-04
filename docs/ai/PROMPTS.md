# Prompts: Nestar → Petoria

> **Status as of 2026-10-04:** Phase 1 is done. Use the templates in §2 for Phase 2.
> Related: [NEXT_STEPS](NEXT_STEPS.md) · [BACKEND_MIGRATION](BACKEND_MIGRATION.md)

## 1. Prompts used in this session

### 1.1 Analysis
```text
Analyze the current Nestar monorepo structure to transform the existing NestJS monorepo
Nestar Platform into a petshop platform.
```
Outcome: an analysis of the modules and their coupling, and three decisions from the user (Product + Pet + Order, AGENT → SELLER, rename the apps to petoria-*).

### 1.2 Safe rename layer (the prompt that was executed)
```text
Safe rename layer (no business logic change).
Rename all visible project/app identifiers from Nestar to Petoria.
Do not change domain logic.
Keep APIs and database collections unchanged.
Update package names, environment labels and constants.
Run lint and typecheck after refactoring. Please make a plan first.
```
Outcome: commit `26dce13`. See [COMPLETED_TASKS](COMPLETED_TASKS.md).

### 1.3 Documentation
```text
Create a docs folder with BACKEND_MIGRATION.md, DECISIONS.md, FRONTEND_MIGRATION.md,
COMPLETED_TASKS.md, NEXT_STEPS.md, PROMPTS.md summarizing the current Nestar → Petoria
migration state. Do not change application source code. Be precise and technical.
Use markdown tables where useful.
```

## 2. Reusable prompts for the next session

Every prompt below assumes this shared preamble. Paste it first:

```text
Context: Petoria is a NestJS GraphQL monorepo (apps/petoria-api, apps/petoria-batch) being
migrated from the Nestar real-estate platform to a petshop platform. Read docs/BACKEND_MIGRATION.md,
docs/DECISIONS.md and docs/NEXT_STEPS.md first.
Rules:
- Make a plan first; do not edit until approved.
- Change only what the task names; no unrelated refactors or formatting.
- Follow the existing component pattern (module/service/resolver, dto/<x>/{x,x.input,x.update}.ts,
  schemas/X.model.ts, enums/x.enum.ts with registerEnumType, xStatsEditor, $facet + metaCounter).
- Mirror any API schema/DTO/enum rename in apps/petoria-batch (it imports ../../petoria-api/src/...).
- Validate: record a baseline first, then run
    npx tsc --noEmit -p apps/petoria-api/tsconfig.app.json
    npx tsc --noEmit -p apps/petoria-batch/tsconfig.app.json
    npx eslint "apps/**/*.ts"        (report-only; never npm run lint, it uses --fix)
    npm run build && npx nest build petoria-batch
  Report baseline and new errors separately.
- Do not commit unless asked. Update docs/COMPLETED_TASKS.md and docs/NEXT_STEPS.md at the end.
```

### 2.1 Backend cleanup (P1–P5)
```text
Do NEXT_STEPS items P1–P5: delete the duplicate "board-article.input (1).ts" and
apps/petoria-batch/src/lib/, delete stale dist/apps/nestar-*, fix the 20 existing eslint errors
without changing behavior, and fix the API e2e expectation. Show me each lint fix before applying.
```

### 2.2 Phase 2b: SELLER role
```text
Phase 2b: rename MemberType.AGENT to SELLER across petoria-api and petoria-batch.
Rename getAgents→getSellers, AgentsInquiry→SellersInquiry, availableAgentSorts→availableSellerSorts,
BATCH_TOP_AGENTS→BATCH_TOP_SELLERS, memberProperties→memberProducts and add memberPets, memberOrders
(Number, default 0) to Member schema + DTO. Do not touch Property yet (keep memberStatsEditor calls
compiling by pointing them at memberProducts). List every @Roles(MemberType.AGENT) changed.
```

### 2.3 Phase 2c: Product module
```text
Phase 2c: replace components/property with components/product by mirroring it 1:1.
Enums: ProductCategory (FOOD, TOY, ACCESSORY, GROOMING, HEALTH, HOUSING), ProductStatus
(ACTIVE, SOLD_OUT, DELETE), PetSpecies (DOG, CAT, BIRD, FISH, REPTILE, SMALL_ANIMAL).
Schema 'products' fields per docs/BACKEND_MIGRATION.md §7, unique index {memberId, productTitle}.
Move OrdinaryInquiry to libs/dto/common/common.input.ts. Rename every operation per §6.1.
Remove property files only after everything compiles. Keep like/view/comment compiling with a
minimal change; the full rewiring is Phase 2f.
```

### 2.4 Phase 2f: Shared rewiring
```text
Phase 2f: rename group enum value PROPERTY→PRODUCT and add PET in like/view/comment/notification
enums. Replace getFavoriteProperties/getVisitedProperties with one private generic aggregation
helper (group, collection, alias) and expose getFavoriteProducts/getFavoritePets/
getVisitedProducts/getVisitedPets. Parameterize lookupFavorite/lookupVisit in libs/config.ts.
Update comment.service switch for PRODUCT and PET. Notification: propertyId→productId, add petId.
```

### 2.5 Phase 2d: Pet module
```text
Phase 2d: add components/pet following the product module pattern. Enums PetGender (MALE, FEMALE),
PetStatus (ACTIVE, RESERVED, SOLD, DELETE), PetLocation (old PropertyLocation cities).
Schema 'pets' per docs/BACKEND_MIGRATION.md §7. Search filters: speciesList, genderList,
locationList, pricesRange, periodsRange, options [petVaccinated, petNeutered], text.
Increment/decrement memberPets on create/sold/delete. Register PetModule in components.module.ts.
```

### 2.6 Phase 2e: Order module
```text
Phase 2e: add Order + OrderItem (collections 'orders', 'orderItems'). OrderStatus: PENDING, PAID,
SHIPPED, DELIVERED, CANCELED, DELETE. createOrder(items[{productId,itemQuantity}], orderAddress):
load ACTIVE products, reject if stock < qty (Message.OUT_OF_STOCK), snapshot itemPrice, compute
orderTotal, insert order + items, decrement productStock via productStatsEditor, set SOLD_OUT at 0,
increment memberOrders. Buyer updateOrder: only PENDING→CANCELED (restore stock) or
SHIPPED→DELIVERED. Admin: getAllOrdersByAdmin, updateOrderByAdmin. Explain how you handle
partial failure without transactions.
```

### 2.7 Phase 2g: Batch
```text
Phase 2g: update petoria-batch to register Product, Pet, Member schemas. Jobs: BATCH_ROLLBACK
(reset productRank, petRank, SELLER memberRank), BATCH_TOP_PRODUCTS and BATCH_TOP_PETS
(rank = likes*2 + views), BATCH_TOP_SELLERS (rank = (memberProducts+memberPets)*5 +
memberArticles*3 + memberLikes*2 + memberViews). Add a cron slot '00 01 01 * * *' for pets.
```

### 2.8 Frontend migration
```text
This is the Petoria Next.js frontend (migrating from Nestar). Read the backend repo's
docs/FRONTEND_MIGRATION.md. Step 0: inspect this repo and produce a corrected page/component
mapping table and a list of every Apollo operation in apollo/**. Do not edit yet.
Then implement one step of the plan at a time, running `next build` and lint after each.
```

### 2.9 Validate a phase
```text
Validate the current working tree for the Petoria migration: run both tsc --noEmit checks,
report-only eslint, both nest builds, and boot both apps (built dist) to hit GET / and
POST /graphql {__typename}. Compare lint against the previous baseline. Do not change code.
Report results as a table.
```

### 2.10 Update docs after a phase
```text
Update docs/COMPLETED_TASKS.md (files changed + validation table), docs/NEXT_STEPS.md
(tick done items, re-prioritize), and the status line in every docs/*.md for the phase just
completed. Do not change source code.
```
