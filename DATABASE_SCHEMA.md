# RESTOCKR - Database Schema Specification

## Overview
RESTOCKR uses a relational multi-tenant schema model hosted on Supabase (PostgreSQL), with an identical synchronized fallback model in `src/lib/database.ts` using local web storage mechanisms.

---

## Entity Relationship Overview

```
 ┌──────────────┐
 │    shops     │ ──┐
 └──────────────┘   │
        │ 1         │ 1
        │           │
        ▼ N         ▼ N
 ┌──────────────┐ ┌──────────────┐
 │   products   │ │    staff     │
 └──────────────┘ └──────────────┘
        │ 1
        │
        ▼ N
 ┌──────────────┐       ┌──────────────┐
 │    sales     │ ────► │  customers   │
 └──────────────┘ N   1 └──────────────┘
```

---

## Tables & Document Schemas

### 1. `shops`
Stores multi-tenant store account details, branding, subscription state, and storefront settings.

- **Primary Key**: `id` (text)

| Field Name | Type | Nullable | Description |
|---|---|---|---|
| `id` | text | No | Unique shop identifier (e.g. `shop-1720000000000` or UUID) |
| `name` | text | No | Business name of the store (e.g. `AutoGadget Hub`) |
| `slug` | text | No | URL-friendly unique slug for storefront (e.g. `autogadget`) |
| `ownerUsername` | text | No | Unique login username for the store owner |
| `logoUrl` | text | Yes | Public image URL for the shop logo |
| `whatsappNumber` | text | No | Primary WhatsApp contact phone number |
| `businessAddress` | text | Yes | Physical store location address |
| `subscriptionPlan` | text | No | Subscription tier (`Free Trial`, `Pro Store`, `Enterprise`) |
| `subscriptionStatus` | text | No | Current subscription status (`Active`, `Expired`) |
| `subscriptionExpiry` | text | No | ISO date string for subscription expiry |
| `websiteSettings` | jsonb / object | No | Storefront configuration flags (see breakdown below) |

#### `websiteSettings` Object Breakdown
- `showPrices` (boolean): Controls whether product selling prices display on public storefront.
- `showSoldProducts` (boolean): Controls whether out-of-stock products display on public storefront.
- `enableVideoDownloads` (boolean): Allows visitors to download product video clips.
- `enableImageDownloads` (boolean): Allows visitors to download product photo assets.
- `storeDescription` (text): Custom bio text shown on the public reseller site.
- `bannerUrl` (text): Custom promotional banner image URL.

---

### 2. `products`
Stores inventory item records.

- **Primary Key**: `id` (text)
- **Foreign Key**: `shop_id` -> `shops(id)`

| Field Name | Type | Nullable | Description |
|---|---|---|---|
| `id` | text | No | Unique product SKU/ID (e.g. `prod-1720000000000`) |
| `shop_id` | text | No | ID of the owning shop |
| `category` | text | No | Device Category (`Phones`, `Tablets`, `Laptops`, `Smart Watches`, `Gaming Consoles`, `Accessories`) |
| `brand` | text | No | Manufacturer brand name (e.g. `Apple`, `Samsung`, `Dell`) |
| `model` | text | No | Specific device model (e.g. `iPhone 14 Pro Max`) |
| `storage` | text | No | Internal storage capacity (e.g. `128GB`, `256GB`, `1TB`, `N/A`) |
| `ram` | text | Yes | RAM capacity (e.g. `8GB`, `16GB`) |
| `processor` | text | Yes | Chipset / CPU model (e.g. `M2 Chip`, `Core i7`) |
| `color` | text | Yes | Device color finish (e.g. `Space Black`, `Deep Purple`) |
| `costPrice` | numeric | Yes | Wholesale purchase cost price in NGN (Owner private) |
| `sellingPrice` | numeric | No | Retail price in NGN |
| `quantity` | integer | No | Total available physical inventory stock count |
| `batteryHealth` | text | Yes | Apple iPhone Battery Health percentage (e.g. `88%`, `100%`) |
| `warranty` | text | No | Store warranty duration tag (e.g. `No Warranty`, `7 Days`, `30 Days`) |
| `condition` | text[] / array | No | Nigerian quick condition tags (e.g. `["Brand New", "UK Used", "Physical SIM"]`) |
| `variant` | text | Yes | Custom variant extension string |
| `minimumStockThreshold` | integer | Yes | Stock alert trigger threshold (default: 2) |
| `productVideo` | text | Yes | Supabase Storage public video URL or Base64 fallback |
| `productImages` | text[] / array | Yes | Array of Supabase Storage public image URLs |
| `createdAt` | text / timestamp | No | Creation timestamp ISO string |

---

### 3. `sales`
Stores sales transaction history records.

- **Primary Key**: `id` (text)
- **Foreign Keys**: `shop_id` -> `shops(id)`, `productId` -> `products(id)`, `customerId` -> `customers(id)`

| Field Name | Type | Nullable | Description |
|---|---|---|---|
| `id` | text | No | Unique sale receipt ID (e.g. `SALE-1720000000000`) |
| `shop_id` | text | No | Owning shop ID |
| `productId` | text | No | ID of the sold product |
| `productName` | text | No | Full display name of the device at time of sale |
| `quantity` | integer | No | Quantity sold in this transaction |
| `sellingPrice` | numeric | No | Unit selling price at time of sale |
| `totalAmount` | numeric | No | Total transaction amount (`sellingPrice * quantity`) |
| `paymentMethod` | text | No | Payment type (`Cash`, `Bank Transfer`, `POS Card`) |
| `soldBy` | text | No | Name of staff member or owner who processed the sale |
| `soldAt` | text | No | Timestamp ISO string of transaction completion |
| `customerId` | text | Yes | Associated customer ID |
| `customerName` | text | Yes | Name of customer |
| `customerPhone` | text | Yes | Contact phone number of customer |
| `customerAddress` | text | Yes | Delivery/contact address of customer |
| `notes` | text | Yes | Additional transaction notes or accessories included |

---

### 4. `customers`
Stores buyer profile directory records.

- **Primary Key**: `id` (text)
- **Foreign Key**: `shop_id` -> `shops(id)`

| Field Name | Type | Nullable | Description |
|---|---|---|---|
| `id` | text | No | Unique customer ID |
| `shop_id` | text | No | Owning shop ID |
| `name` | text | No | Full customer name |
| `phone` | text | No | Contact phone number |
| `address` | text | Yes | Delivery address |
| `totalPurchases` | numeric | No | Cumulative spending in NGN |
| `totalOrders` | integer | No | Total count of completed purchases |
| `lastPurchaseDate` | text | No | Timestamp of most recent purchase |

---

### 5. `staff`
Stores employee profiles and security PIN credentials.

- **Primary Key**: `id` (text)
- **Foreign Key**: `shop_id` -> `shops(id)`

| Field Name | Type | Nullable | Description |
|---|---|---|---|
| `id` | text | No | Unique staff ID |
| `shop_id` | text | No | Owning shop ID |
| `name` | text | No | Staff member name |
| `role` | text | No | Job role (e.g. `Sales Rep`, `Store Manager`) |
| `pin` | text | No | 4-digit numeric login PIN |
| `permissions` | jsonb / object | No | Permission boolean flags (`canAddStock`, `canEditPrice`, etc.) |

---

### 6. `notifications`
Stores system activity alerts and stock alerts.

- **Primary Key**: `id` (text)
- **Foreign Key**: `shop_id` -> `shops(id)`

| Field Name | Type | Nullable | Description |
|---|---|---|---|
| `id` | text | No | Unique notification ID |
| `shop_id` | text | No | Owning shop ID |
| `title` | text | No | Notification title |
| `message` | text | No | Detailed notification body text |
| `type` | text | No | Category (`sale`, `low_stock`, `system`, `staff`) |
| `read` | boolean | No | Read status flag |
| `timestamp` | text | No | ISO timestamp string |

---

### 7. `audit_logs`
Stores audit trail events for store tracking.

- **Primary Key**: `id` (text)
- **Foreign Key**: `shop_id` -> `shops(id)`

| Field Name | Type | Nullable | Description |
|---|---|---|---|
| `id` | text | No | Unique log entry ID |
| `shop_id` | text | No | Owning shop ID |
| `action` | text | No | Event summary (e.g. `Stock Intake`, `Sale Completed`, `Sale Reversed`) |
| `performedBy` | text | No | Username or staff name who initiated action |
| `details` | text | No | Additional context details |
| `timestamp` | text | No | ISO timestamp string |
