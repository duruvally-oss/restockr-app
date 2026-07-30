# RESTOCKR - Project Evolution & Migration Notes

## Summary of Major Architectural Updates

### 1. Authentication Migration: Shop Username System
- **Previous Model**: Stores authenticated via owner email addresses (`ownerEmail`).
- **Updated Architecture**: Migrated to a **Shop Username** authentication model (`ownerUsername`).
- **Rationale**: Direct align with vendor workflows in Nigeria where stores are identified by brand handles (e.g. `autogadgets`).
- **Impact**: Updated `Shop` type definition, `db.getPasswords()` storage map, registration modal, and login forms.

---

### 2. Removal of IMEI Field & Shift to Quantity Inventory
- **Previous Model**: Single-device records required 15-digit IMEI / Serial numbers.
- **Updated Architecture**: Replaced with clean quantity-based inventory counts (`quantity: number`).
- **Rationale**: Simplifies bulk stock intake for gadget vendors managing multiple units of identical specs (e.g. 10 units of iPhone 14 Pro Max 256GB).
- **Impact**: Stripped `imei` field from `Product` type, `InventoryManager`, `OfficialReceiptModal`, `WhatsAppEmulator`, and database helpers.

---

### 3. Media Upload Streamlining (Flexible Photo & Video Support)
- **Previous Model**: Rigid multi-step sequential wizard enforcing exclusive photo or video choices.
- **Updated Architecture**: Single unified media upload step allowing vendors to attach photos, a video clip, or both concurrently.
- **Rationale**: Eliminates friction during stock intake; respects vendor preference for single or dual media types.
- **Impact**: Updated `WhatsAppEmulator` step state machine and `InventoryManager` media attachment inputs.

---

### 4. Media Cleanup & Supabase Storage Integration
- **Previous Model**: Updating or deleting product listings left orphaned video and photo assets in cloud storage.
- **Updated Architecture**: Integrated `deleteFileFromSupabase()` inside product deletion routines (`db.deleteProduct`).
- **Rationale**: Prevents storage bloat and maintains zero-dangling-asset database hygiene.

---

### 5. Reseller Catalog Settings Expansion (`showPrices` Toggle)
- **Previous Model**: Public reseller site always forced display of retail selling prices.
- **Updated Architecture**: Added `showPrices` setting to `websiteSettings`.
- **Rationale**: Many wholesale vendors preferred hiding prices on public storefronts to encourage direct WhatsApp negotiations.
- **Impact**: Updated `WebsiteSettings.tsx`, `ResellerWebsite.tsx`, and copy details formatting.

---

### 6. Unified Fast Sale & Reversal Workflow
- **Previous Model**: Redundant sales forms on Sales tab competing with Inventory buttons.
- **Updated Architecture**: Sales tab dedicated to Sales History & Receipt viewing. Sales are initiated exclusively from Available Inventory ("Sell") or RESTOCKR Assistant. Added owner-only sale reversal.

---

### 7. Standalone & Portable Project Foundation
- **Verification**: Cleaned out all platform-specific lock-in dependencies. The application is a standard 100% self-contained React 18 + TypeScript + Vite project ready for standard git repository cloning and deployment.
