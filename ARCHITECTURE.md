# RESTOCKR - Full Application Architecture & Design Specification

## Overview
RESTOCKR is a multi-tenant inventory, sales management, and reseller storefront platform tailored for Nigerian electronic gadget vendors. It combines real-time inventory tracking, quick sale recording, official receipt generation, staff management, WhatsApp assistant automation, and public reseller catalog websites.

---

## Technology Stack

- **Frontend Core**: React 18, TypeScript, Vite
- **Styling & UI**: Tailwind CSS, Lucide React Icons
- **Backend & Database**: Supabase (PostgreSQL), Client-side state & fallback DB (`database.ts`)
- **File & Media Storage**: Supabase Storage (Buckets: `product-videos`, `product-images`, `shop-logos`)
- **Routing & State**: Hash-based routing / SPA view state management, React Hooks

---

## Directory & Folder Structure

```
/
├── .env.example              # Environment variables template
├── index.html                # Entry HTML point
├── metadata.json             # Applet metadata configuration
├── package.json              # Project dependencies and build scripts
├── vite.config.ts            # Vite bundler configuration
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Primary App container, routing, and global authentication state
│   ├── index.css             # Global Tailwind styling
│   ├── types.ts              # Global TypeScript interfaces, enums, and types
│   ├── components/           # UI Component Modules
│   │   ├── CustomerManager.tsx         # Customer directory & transaction tracking
│   │   ├── DashboardOverview.tsx       # Key metrics, stock alerts & quick stats
│   │   ├── ImageGalleryModal.tsx       # Fullscreen multi-image viewer
│   │   ├── IntelligentPriceInput.tsx   # Fast shorthand currency input component (e.g., 250k -> 250,000)
│   │   ├── InventoryManager.tsx        # Available stock list, edit forms & sold products
│   │   ├── OfficialReceiptModal.tsx    # Printable & downloadable customer sale receipt generator
│   │   ├── ReportsManager.tsx          # Analytics, revenue, profit & inventory reports
│   │   ├── ResellerWebsite.tsx         # Public storefront catalog view for end buyers/resellers
│   │   ├── SalesManager.tsx            # Sales history records & sale reversal actions
│   │   ├── SettingsSubscription.tsx    # Store profile, plan & settings
│   │   ├── StaffManager.tsx            # Staff accounts, PIN management & granular permissions
│   │   ├── VideoPlayerModal.tsx        # Product video streaming modal
│   │   ├── WebsiteSettings.tsx         # Reseller catalog customization controls
│   │   └── WhatsAppEmulator.tsx        # Simulated RESTOCKR WhatsApp AI Assistant
│   └── lib/                  # Core Libraries & Data Access Layer
│       ├── database.ts       # Unified local & Supabase persistence engine
│       ├── deviceDb.ts       # Nigerian gadget master catalog (Models, Specs, Conditions, Brands)
│       ├── download.ts       # Media download helpers (Images & Videos)
│       └── supabase.ts       # Supabase client setup & Storage upload/delete routines
```

---

## Application Subsystem Architecture

### 1. Authentication & Session System
- **Shop Username Auth**: Accounts identify via unique `ownerUsername` (e.g. `autogadgets`).
- **Owner & Staff Modes**: Store owners maintain root privileges; staff authenticate via 4-digit PINs within the store workspace.
- **Persistence**: Sessions persist in `localStorage` under `restockr_current_shop` and `restockr_isLoggedIn`.

### 2. Dashboard Subsystem
- Displays real-time inventory counts, total inventory valuation, monthly revenue, total sales count, low stock alerts, and quick action shortcuts (Fast Sale, Add Stock, RESTOCKR Assistant).

### 3. Inventory Subsystem
- **Available Inventory**: Manages stock items with fields: category, brand, model, storage, RAM, processor, color, quantity, selling price, warranty, battery health (Apple), condition tags, product images, product video.
- **Sold Products View**: Dedicated tab listing items whose quantity has reached 0 or have recorded sales. Read-only audit state with receipt view capability.

### 4. Sales Subsystem
- **Fast Sale Flow**: Initiated from the Available Inventory view ("Sell" button) or the RESTOCKR Assistant.
- **Deduction & Customer Assignment**: Decrements available stock quantity. Automatically binds or creates customer records.
- **Sale Reversal**: Store owners can reverse a completed sale. Reversal increments the inventory quantity back and logs an audit record.

### 5. Staff Management Subsystem
- Stores staff PINs and permissions (`canAddStock`, `canEditPrice`, `canSellProduct`, `canViewCostPrice`, `canDeleteProduct`, `canExportData`, `canManageStaff`).

### 6. Public Reseller Website Subsystem
- Accessible via hash route `/#/shop/:slug` (or `?shop=:slug`).
- Displays public product catalog, filtering by category, search by name/model, video download capabilities, image downloads, and instant WhatsApp ordering link.
- Respects `websiteSettings` toggles like `showPrices`, `showSoldProducts`, `enableVideoDownloads`, `enableImageDownloads`.

### 7. RESTOCKR Assistant Subsystem
- Interactive chat emulator representing the official RESTOCKR WhatsApp bot.
- Supports complete automated wizard flows for stock intake, searching, fast selling, updating stock, and checking stats. Uses the exact same shared database routines as the UI dashboard.

### 8. Notifications & Audit Logs Subsystem
- System alerts for low stock thresholds, stock additions, sales, and staff changes. Audit logs maintain timestamped records of all store actions.

---

## Data & Asset Lifecycles

### Product Lifecycle
```
Product Created (UI / Assistant)
      │
      ▼
Media Uploaded (Photos, Video, or Both -> Supabase Storage)
      │
      ▼
Saved to Database (Local State + Supabase Sync)
      │
      ▼
Available Inventory Listing
      │
      ▼
[Edited / Updated] (Optional)
      │
      ▼
Sold (Fast Sale Flow / Assistant)
      ├──────────────► Inventory Quantity Decremented
      ├──────────────► Customer Profile Created / Updated
      ├──────────────► Sales History Record Generated
      └──────────────► Official Receipt Available
      │
      ▼
Sold Products View (When quantity = 0)
      │
      ▼
[Sale Reversed by Owner] (Optional) ──► Quantity Restored ──► Re-listed in Available Inventory
```

### Media Lifecycle
```
File Selected (Photo / Video)
      │
      ▼
Supabase Storage Upload (`product-images` or `product-videos` bucket)
      │
      ▼
Public URL Generated & Linked to Product Record
      │
      ▼
Rendered across Inventory UI, Reseller Storefront, & WhatsApp Assistant
      │
      ▼
[Media Replaced / Deleted] ──► Storage Object Removed via deleteFileFromSupabase()
```

### Sales Lifecycle
```
"Sell" Triggered on Product
      │
      ▼
Quantity Selected & Customer Info Entered (Name, Phone, Address)
      │
      ▼
Transaction Recorded in Sales Collection
      ├─► Product Quantity Decremented
      ├─► Audit Log Recorded
      ├─► Notification Created
      └─► Sales Reports Updated
      │
      ▼
Official Receipt Rendered (Print / Download PNG)
```

---

## Realtime Synchronization & Event Flow
- Local operations instantly update in-memory DB and `localStorage`.
- Asynchronous sync calls (`syncProductToSupabase`, `syncSaleToSupabase`, `syncShopToSupabase`) push changes to Supabase PostgreSQL when available.
- UI components reactively receive database updates via React state setters.
