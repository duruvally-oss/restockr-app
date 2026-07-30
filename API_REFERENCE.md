# RESTOCKR - Core API & Database Helper Function Reference

## 1. Database Persistence API (`src/lib/database.ts`)

### Store & Account Management
#### `db.getShops(): Shop[]`
- **Purpose**: Retrieves all registered store accounts from local storage and Supabase sync.
- **Returns**: Array of `Shop` objects.
- **Called By**: `App.tsx`, `WhatsAppEmulator.tsx`, `ResellerWebsite.tsx`.

#### `db.getShopBySlug(slug: string): Shop | undefined`
- **Purpose**: Looks up a shop account matching the given URL slug.
- **Parameters**: `slug` (string)
- **Returns**: `Shop` object or `undefined`.
- **Called By**: `App.tsx`, `ResellerWebsite.tsx`.

#### `db.saveShop(shop: Shop): void`
- **Purpose**: Saves or updates a shop record in storage and triggers Supabase sync.
- **Parameters**: `shop` (`Shop`)
- **Called By**: `App.tsx`, `WebsiteSettings.tsx`, `SettingsSubscription.tsx`.

#### `db.savePassword(username: string, password: string): void`
- **Purpose**: Stores owner authentication credentials keyed by shop username.
- **Parameters**: `username` (string), `password` (string)
- **Called By**: `App.tsx`.

---

### Product & Inventory Management
#### `db.getProducts(shopId: string): Product[]`
- **Purpose**: Fetches inventory records for a specific shop.
- **Parameters**: `shopId` (string)
- **Returns**: Array of `Product` objects.
- **Called By**: `App.tsx`, `InventoryManager.tsx`, `WhatsAppEmulator.tsx`, `ResellerWebsite.tsx`, `DashboardOverview.tsx`.

#### `db.saveProduct(product: Product): void`
- **Purpose**: Creates or updates a product record in inventory.
- **Parameters**: `product` (`Product`)
- **Called By**: `InventoryManager.tsx`, `WhatsAppEmulator.tsx`.

#### `db.deleteProduct(id: string, shopId: string): void`
- **Purpose**: Deletes a product from inventory and triggers Supabase storage cleanup for attached media.
- **Parameters**: `id` (string), `shopId` (string)
- **Called By**: `InventoryManager.tsx`, `WhatsAppEmulator.tsx`.

#### `db.getResolvedVideoUrl(product: Product): string`
- **Purpose**: Resolves the display URL for product video clips (handling blob object URLs and Supabase storage paths).
- **Parameters**: `product` (`Product`)
- **Returns**: Video URL string.
- **Called By**: `InventoryManager.tsx`, `ResellerWebsite.tsx`, `VideoPlayerModal.tsx`.

---

### Sales & Transactions
#### `db.getSales(shopId: string): Sale[]`
- **Purpose**: Fetches sales transaction history for a store.
- **Parameters**: `shopId` (string)
- **Returns**: Array of `Sale` objects.
- **Called By**: `SalesManager.tsx`, `DashboardOverview.tsx`, `ReportsManager.tsx`, `OfficialReceiptModal.tsx`.

#### `db.addSale(sale: Sale): void`
- **Purpose**: Records a new sale transaction, decrements inventory quantity, creates/updates customer profile, and logs notifications.
- **Parameters**: `sale` (`Sale`)
- **Called By**: `InventoryManager.tsx`, `WhatsAppEmulator.tsx`.

#### `db.reverseSale(saleId: string, shopId: string): { success: boolean; message: string }`
- **Purpose**: Reverses a previously completed sale, restores inventory quantity, and updates reports. (Owner privilege).
- **Parameters**: `saleId` (string), `shopId` (string)
- **Returns**: Operation result object.
- **Called By**: `SalesManager.tsx`.

---

### Staff & Permissions
#### `db.getStaff(shopId: string): Staff[]`
- **Purpose**: Fetches staff profile directory for a shop.
- **Parameters**: `shopId` (string)
- **Returns**: Array of `Staff` objects.
- **Called By**: `StaffManager.tsx`, `App.tsx`, `WhatsAppEmulator.tsx`.

#### `db.saveStaff(staff: Staff): void`
- **Purpose**: Saves or updates staff member details and security PIN.
- **Parameters**: `staff` (`Staff`)
- **Called By**: `StaffManager.tsx`.

---

## 2. Supabase Storage API (`src/lib/supabase.ts`)

#### `uploadFileToSupabase(file: File, bucketName: string): Promise<string>`
- **Purpose**: Uploads a binary media file to a Supabase Storage bucket and returns its public CDN URL.
- **Parameters**: `file` (`File`), `bucketName` (string)
- **Returns**: Public URL string.
- **Called By**: `InventoryManager.tsx`, `WhatsAppEmulator.tsx`, `WebsiteSettings.tsx`.

#### `deleteFileFromSupabase(fileUrl: string): Promise<boolean>`
- **Purpose**: Parses bucket and file path from a Supabase public URL and removes the asset from storage.
- **Parameters**: `fileUrl` (string)
- **Returns**: `Promise<boolean>` success status.
- **Called By**: `database.ts` (Product deletion & update routines).

---

## 3. Media Download API (`src/lib/download.ts`)

#### `downloadVideo(videoUrl: string, filename?: string): Promise<void>`
- **Purpose**: Downloads a product video clip directly to the user's device.
- **Parameters**: `videoUrl` (string), `filename` (optional string)
- **Called By**: `ResellerWebsite.tsx`, `VideoPlayerModal.tsx`, `InventoryManager.tsx`.

#### `downloadImage(imageUrl: string, filename?: string): Promise<void>`
- **Purpose**: Downloads a product image asset to the user's device.
- **Parameters**: `imageUrl` (string), `filename` (optional string)
- **Called By**: `ResellerWebsite.tsx`, `ImageGalleryModal.tsx`.
