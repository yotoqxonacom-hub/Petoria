# Frontend Migration Plan: Nestar Next.js → Petoria

> **Status as of 2026-10-04:** Not started. The backend has finished Phase 1 only, so the current GraphQL contract is still Nestar-shaped and the existing frontend works without changes.
> Related: [BACKEND_MIGRATION](BACKEND_MIGRATION.md) · [NEXT_STEPS](NEXT_STEPS.md)

> ⚠️ **Assumption:** The Next.js frontend is **not in this repository** and was not inspected. The page and component paths below follow the usual Nestar Next.js layout (`pages/`, `apollo/user|admin/{query,mutation}.ts`, `libs/components/`, `libs/types/`, `libs/enums/`). Check every path against the real frontend repo before starting. The GraphQL names come from the backend resolvers and are accurate.

---

## 1. Step-by-step plan

| Step | Task | Depends on backend phase |
|---|---|---|
| 0 | Inspect the frontend repo. Correct the mapping tables below. Record a baseline (`next build`, lint, the pages that work) | — |
| 1 | **Branding (no API change):** app name, `<title>`/meta, logo, favicon, colors, footer text, `package.json` name → Petoria | Phase 1 (done) |
| 2 | **Enums and types:** in `libs/enums/`, `AGENT` → `SELLER`, `Property*` → `Product*`, and add `Pet*` and `OrderStatus`. Copy the types in `libs/types/` from the backend DTOs | 2b, 2c, 2d, 2e |
| 3 | **Apollo operations:** rename and split the operations in `apollo/user/*` and `apollo/admin/*` (see §3). Update field selections | 2b–2f |
| 4 | **Listing pages:** property list/detail → product list/detail, then add pet list/detail | 2c, 2d |
| 5 | **Seller pages:** agent list/detail → seller list/detail; add/edit listing forms | 2b, 2c, 2d |
| 6 | **My page:** split favorites and visited by domain; my-products / my-pets; my-orders | 2f, 2e |
| 7 | **Commerce:** cart (client state), checkout → `createOrder`, order history, cancel | 2e |
| 8 | **Admin:** products, pets, orders, sellers | 2c–2e |
| 9 | **Copy and i18n:** apply the terminology table (§4) to every string and translation file | — |
| 10 | **QA:** every route, every role (USER, SELLER, ADMIN), image upload, chat, likes, follows; `next build` | All |

Ship steps 2–8 together with the matching backend release. The enum and operation renames break the API (see [BACKEND_MIGRATION §8](BACKEND_MIGRATION.md#8-compatibility-notes)).

## 2. Page and component mapping (assumed paths)

### 2.1 Pages

| Nestar page (assumed) | Petoria page | Notes |
|---|---|---|
| `pages/index.tsx` | `pages/index.tsx` | Sections: top products, top pets, top sellers, community |
| `pages/property/index.tsx` | `pages/product/index.tsx` | Filters: category, species, price range, in stock, text |
| `pages/property/detail.tsx` | `pages/product/detail.tsx` | Adds stock, brand and an add-to-cart button |
| — | `pages/pet/index.tsx` | Filters: species, gender, location, price, vaccinated/neutered |
| — | `pages/pet/detail.tsx` | Breed, age, gender, vaccination, seller contact |
| `pages/agent/index.tsx` | `pages/seller/index.tsx` | `getAgents` → `getSellers` |
| `pages/agent/detail.tsx` | `pages/seller/detail.tsx` | Seller's products and pets, comments |
| `pages/community/*` | `pages/community/*` | Unchanged (board articles) |
| `pages/member/*` | `pages/member/*` | `memberProperties` → `memberProducts` / `memberPets` |
| `pages/mypage/index.tsx` (add-property tab) | `mypage` tabs: add-product, add-pet | SELLER only |
| `pages/mypage` (my-properties tab) | `mypage` tabs: my-products, my-pets | `getSellerProducts` / `getSellerPets` |
| `pages/mypage` (my-favorites tab) | `mypage` favorites: products and pets | Split queries |
| `pages/mypage` (recently-visited tab) | `mypage` visited: products and pets | Split queries |
| — | `pages/cart/index.tsx` | Client-side cart, no backend cart |
| — | `pages/checkout/index.tsx` | `createOrder` |
| — | `pages/mypage` (my-orders tab) | `getMyOrders`, `updateOrder` (cancel / confirm delivery) |
| `pages/cs/*` | `pages/cs/*` | Unchanged (notice/FAQ, if present) |
| `pages/_admin/properties` | `pages/_admin/products`, `pages/_admin/pets` | Admin CRUD |
| `pages/_admin/users` | `pages/_admin/users` | Role filter `AGENT` → `SELLER` |
| — | `pages/_admin/orders` | `getAllOrdersByAdmin`, `updateOrderByAdmin` |

### 2.2 Components

| Nestar component (assumed) | Petoria component |
|---|---|
| `libs/components/property/PropertyCard.tsx` | `libs/components/product/ProductCard.tsx`, `libs/components/pet/PetCard.tsx` |
| `libs/components/property/Filter.tsx` | `ProductFilter.tsx`, `PetFilter.tsx` |
| `libs/components/homepage/TopProperties.tsx` | `TopProducts.tsx`, `TopPets.tsx` |
| `libs/components/homepage/TrendProperties.tsx` / `PopularProperties.tsx` | `TrendProducts.tsx` / `PopularPets.tsx` |
| `libs/components/homepage/TopAgents.tsx` | `TopSellers.tsx` |
| `libs/components/agent/AgentCard.tsx` | `libs/components/seller/SellerCard.tsx` |
| `libs/components/mypage/AddNewProperty.tsx` | `AddNewProduct.tsx`, `AddNewPet.tsx` |
| `libs/components/mypage/MyProperties.tsx` | `MyProducts.tsx`, `MyPets.tsx` |
| `libs/components/mypage/MyFavorites.tsx`, `RecentlyVisited.tsx` | Same names, each with a Products/Pets tab switch |
| — | `libs/components/cart/*`, `libs/components/order/OrderCard.tsx` |
| `libs/components/admin/properties/*` | `admin/products/*`, `admin/pets/*`, `admin/orders/*` |
| `libs/components/layout/Top.tsx`, `Footer.tsx` | Same files: Petoria brand and nav links (Products, Pets, Sellers, Community, Cart) |

## 3. GraphQL query/mutation rename plan

| Current operation (backend today) | Petoria operation(s) | Frontend file (assumed) |
|---|---|---|
| `getProperties` | `getProducts`, `getPets` | `apollo/user/query.ts` |
| `getProperty` | `getProduct`, `getPet` | `apollo/user/query.ts` |
| `getAgentProperties` | `getSellerProducts`, `getSellerPets` | `apollo/user/query.ts` |
| `getFavorites` | `getFavoriteProducts`, `getFavoritePets` | `apollo/user/query.ts` |
| `getVisited` | `getVisitedProducts`, `getVisitedPets` | `apollo/user/query.ts` |
| `getAgents` | `getSellers` | `apollo/user/query.ts` |
| `createProperty` | `createProduct`, `createPet` | `apollo/user/mutation.ts` |
| `updateProperty` | `updateProduct`, `updatePet` | `apollo/user/mutation.ts` |
| `likeTargetProperty` | `likeTargetProduct`, `likeTargetPet` | `apollo/user/mutation.ts` |
| — | `createOrder`, `updateOrder` | `apollo/user/mutation.ts` |
| — | `getMyOrders` | `apollo/user/query.ts` |
| `getAllPropertiesByAdmin` | `getAllProductsByAdmin`, `getAllPetsByAdmin` | `apollo/admin/query.ts` |
| `updatePropertyByAdmin` | `updateProductByAdmin`, `updatePetByAdmin` | `apollo/admin/mutation.ts` |
| `removePropertyByAdmin` | `removeProductByAdmin`, `removePetByAdmin` | `apollo/admin/mutation.ts` |
| — | `getAllOrdersByAdmin`, `updateOrderByAdmin` | `apollo/admin/*` |
| `signup`, `login`, `getMember`, `updateMember`, `likeTargetMember`, `imageUploader`, `imagesUploader`, BoardArticle, Comment and Follow operations | Unchanged | — |

Arguments and fields:
- Arguments: `propertyId` → `productId` / `petId`.
- `commentGroup` / `likeGroup` value `PROPERTY` → `PRODUCT` / `PET`.
- Remove the selections `propertyBeds`, `propertyRooms`, `propertySquare`, `propertyBarter`, `propertyRent`, `constructedAt`, and the inquiry inputs `squaresRange`, `roomsList`, `bedsList`, `options`.
- Member selection: `memberProperties` → `memberProducts`, `memberPets`, `memberOrders`.

## 4. UI terminology changes

| Nestar term | Petoria term |
|---|---|
| Nestar | Petoria |
| Property / Properties | Product(s) for supplies; Pet(s) for animals |
| Agent / Agents | Seller / Sellers |
| Property type (Apartment / Villa / House) | Category (Food / Toy / Accessory / Grooming / Health / Housing) |
| — | Species (Dog / Cat / Bird / Fish / Reptile / Small animal) |
| Location (Seoul, Busan, …) | Pet location (same city list) |
| Price | Price (unchanged) |
| Square / Beds / Rooms | Product: Stock, Brand · Pet: Breed, Age (months), Gender |
| Rent / Barter options | Removed. Pets get Vaccinated / Neutered |
| Sold | Sold out (product) / Sold (pet) / Reserved (pet) |
| Construction year (`constructedAt`) | Removed |
| My properties | My products / My pets |
| Add new property | Add product / Add pet |
| Top agents | Top sellers |
| — | Cart, Checkout, My orders, Order status (Pending / Paid / Shipped / Delivered / Canceled) |
