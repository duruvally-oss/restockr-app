# RESTOCKR - Authentication & Authorization Specification

## Overview
RESTOCKR implements a multi-tenant shop authentication strategy based on **Shop Username** identification. Store owners register and sign in with a shop username and password. Staff members operate within the store context via 4-digit security PINs with granular privilege controls.

---

## Authentication Actors & Roles

```
                               ┌─────────────────────────┐
                               │   Store Owner Account   │
                               └─────────────────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
┌─────────────────────────────┐                           ┌─────────────────────────────┐
│    Full Store Admin Access  │                           │    Staff Profiles (PIN)     │
└─────────────────────────────┘                           └─────────────────────────────┘
  - Complete Inventory CRUD                                 - Granular Permission Flags:
  - Financial & Profit Reports                                • canAddStock
  - Staff Account Management                                  • canEditPrice
  - Sale Reversals                                            • canSellProduct
  - Storefront Settings                                       • canViewCostPrice
                                                              • canDeleteProduct
                                                              • canExportData
                                                              • canManageStaff
```

---

## Registration & Login Flows

### 1. Store Registration Flow
1. User provides:
   - Store Name (e.g. `AutoGadget Hub`)
   - Store Slug (auto-sanitized, e.g. `autogadget`)
   - Shop Username (e.g. `autogadgets`)
   - Account Password
   - WhatsApp Number (e.g. `2348012345678`)
2. `db.getShops()` validates username uniqueness.
3. New `Shop` record created with initial 30-day active trial.
4. Credentials persisted in `restockr_passwords` map via `db.savePassword(username, password)`.
5. User auto-authenticated and directed to Store Dashboard.

### 2. Store Owner Login Flow
1. User enters `Shop Username` and `Password`.
2. `db.getShops()` searches for matching `ownerUsername`.
3. Validates entered password against stored credential hash/string in `restockr_passwords`.
4. On success:
   - Sets `restockr_current_shop` in `localStorage`.
   - Sets `restockr_isLoggedIn = "true"`.
   - Initializes active owner session in React app state.

### 3. Staff Lock / PIN Activation Flow
1. Owner or Staff clicks "Lock Terminal" or switches context to Staff mode.
2. Staff enters their 4-digit PIN.
3. System verifies PIN against `db.getStaff(shopId)`.
4. On success, session updates to active staff member with strict permission flags applied across the UI.

---

## Session Persistence & Restoration
- On application load (`src/App.tsx`), `localStorage` is checked for `restockr_current_shop` and `restockr_isLoggedIn`.
- If valid, store context is automatically restored without requiring re-login.
- Session remains active across page reloads and browser restarts.

---

## Protected vs. Public Routes

| Route Pattern | Access Level | Description |
|---|---|---|
| `/#/` | Authenticated | Main Store Dashboard & Control Panel |
| `/#/shop/:slug` | Public | Reseller Catalog Storefront for buyers |
| `?shop=:slug` | Public | Query parameter route fallback for storefront |

---

## Logout Flow
1. User clicks "Log Out" in the user dropdown menu or navigation bar.
2. Confirmation modal prompts: *"Are you sure you want to log out?"*
3. Upon confirmation:
   - `localStorage.removeItem("restockr_isLoggedIn")`
   - `localStorage.removeItem("restockr_current_shop")`
   - React application state cleared.
   - User returned to Login / Registration view.
