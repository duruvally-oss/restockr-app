# RESTOCKR - Permanent Architectural Rules & Design Principles

## Core Architectural Mandates

### 1. Authentication & Identity
- **Shop Username Authentication Only**: Accounts authenticate exclusively using `Shop Username` (e.g., `autogadgets`). Email logins are prohibited.
- **Staff Terminal Access**: Staff members operate under the store owner's workspace via 4-digit security PINs. Staff do not have separate web sign-in accounts.

### 2. Inventory Model
- **Quantity-Based Inventory**: Stock items are managed by available physical count (`quantity: number`).
- **No IMEI / Serial Requirement**: IMEI numbers are not used or stored. Tracking relies on Category, Brand, Model, Storage, Specs, and Quantity.
- **Unified Master Catalog**: Device models, categories, and quick tags share a single source of truth in `src/lib/deviceDb.ts`.

### 3. Sales & Reversal Workflows
- **Single Fast Sale Pipeline**: Sales are triggered directly from Available Inventory items ("Sell" button) or via the RESTOCKR WhatsApp Assistant wizard.
- **Sales History Page**: The Sales navigation tab strictly contains the Sales History records list. It does not host redundant product picker forms.
- **Owner-Only Reversals**: Sale reversal is strictly restricted to Store Owners. Reversing a transaction restores the product's physical inventory quantity and records an audit log entry.
- **Read-Only Sold Products View**: When a product's quantity reaches 0, it appears under the "Sold Out Products" tab in Inventory. This view is strictly for audit and receipt generation.

### 4. Media & Storage Principles
- **Flexible Attachments**: Media upload steps allow vendors to attach photos, a video clip, or both. No forced exclusive either/or choice.
- **Automated Storage Cleanup**: Replacing or deleting product media triggers `deleteFileFromSupabase()`, preventing orphaned assets in Supabase Storage buckets.
- **Direct Asset Streaming**: Videos play in custom, accessible inline modals (`VideoPlayerModal.tsx`) and support direct browser downloads.

### 5. Assistant & Bot Rules
- **Synchronized Backend**: The RESTOCKR Assistant (`WhatsAppEmulator.tsx`) operates on the exact same database API routines (`db`) as the main UI dashboard.
- **Permission Enforcement**: Assistant wizard flows enforce staff PIN permission checks before executing stock additions, price updates, or fast sales.

### 6. Reseller Catalog Storefront
- **Dynamic Configuration**: Reseller site behavior is driven by `shop.websiteSettings` (`showPrices`, `showSoldProducts`, `enableVideoDownloads`, `enableImageDownloads`).
- **Clean Copy Details**: Copying product specs for social media sharing outputs plain formatted text without markdown clutter or mandatory prices when hidden.

### 7. Code Quality & Modularity
- **No Duplicate Implementations**: Every functional flow (e.g. sale creation, stock intake) uses a single unified module.
- **Zero Mock Data in Production**: All data operates through synchronized database routines with local fallback and Supabase persistence.
- **Mobile-First Responsive Layout**: All interfaces are fully optimized for touch targets, mobile browsers, and desktop dashboards.
