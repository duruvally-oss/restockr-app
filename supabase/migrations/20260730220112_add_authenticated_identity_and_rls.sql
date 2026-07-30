/*
# RESTOCKR Authenticated Identity & RLS Hardening

## Purpose
Adds a real authenticated identity to the shops table so that Row Level Security
can enforce tenant isolation at the database level — never trusting client-supplied
shop_id values. Rewrites every RLS policy to verify ownership via auth.uid().

## Changes
1. Add `owner_user_id uuid` column to `shops` table (FK to auth.users, ON DELETE CASCADE).
2. Rewrite ALL RLS policies:
   - shops: public SELECT (reseller storefront), owner-only INSERT/UPDATE/DELETE
   - products: public SELECT (catalog), owner-only INSERT/UPDATE/DELETE via EXISTS check
   - sales, customers, staff, notifications, audit_logs: owner-only ALL operations
3. Every ownership check uses: EXISTS(SELECT 1 FROM shops WHERE shops.id = <table>.shop_id AND shops.owner_user_id = auth.uid())
4. The database NEVER trusts a client-supplied shop_id — the policy verifies the
   shop belongs to the authenticated user before allowing any write or private read.

## Security Model
- Authentication: Supabase Auth (email/password). The app uses synthetic emails
  (username@restockr.app) so the existing "Shop Username" login experience is preserved.
- Authorization: auth.uid() is checked against shops.owner_user_id in every policy.
- Public reads: shops + products are readable by anon (for the public reseller storefront).
- Private data: sales, customers, staff, notifications, audit_logs are authenticated-only.
*/

-- ============================================================
-- 1. ADD owner_user_id TO SHOPS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE shops ADD COLUMN owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shops_owner_user_id ON shops(owner_user_id);

-- ============================================================
-- 2. REWRITE SHOPS RLS POLICIES
-- ============================================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_shops" ON shops;
CREATE POLICY "anon_select_shops" ON shops FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_insert_shop" ON shops;
CREATE POLICY "owner_insert_shop" ON shops FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "owner_update_shop" ON shops;
CREATE POLICY "owner_update_shop" ON shops FOR UPDATE
  TO authenticated USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "owner_delete_shop" ON shops;
CREATE POLICY "owner_delete_shop" ON shops FOR DELETE
  TO authenticated USING (auth.uid() = owner_user_id);

-- ============================================================
-- 3. REWRITE PRODUCTS RLS POLICIES
-- Public SELECT for reseller storefront; owner-only writes
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_insert_products" ON products;
CREATE POLICY "owner_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_update_products" ON products;
CREATE POLICY "owner_update_products" ON products FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "owner_delete_products" ON products;
CREATE POLICY "owner_delete_products" ON products FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.owner_user_id = auth.uid()));

-- ============================================================
-- 4. REWRITE SALES RLS POLICIES (private, owner-only)
-- ============================================================
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sales" ON sales;
CREATE POLICY "owner_select_sales" ON sales FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = sales.shop_id AND shops.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "owner_insert_sales" ON sales;
CREATE POLICY "owner_insert_sales" ON sales FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = sales.shop_id AND shops.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_update_sales" ON sales;
CREATE POLICY "owner_update_sales" ON sales FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = sales.shop_id AND shops.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM shops WHERE shops.id = sales.shop_id AND shops.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "owner_delete_sales" ON sales;
CREATE POLICY "owner_delete_sales" ON sales FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = sales.shop_id AND shops.owner_user_id = auth.uid()));

-- ============================================================
-- 5. REWRITE CUSTOMERS RLS POLICIES (private, owner-only)
-- ============================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_customers" ON customers;
CREATE POLICY "owner_select_customers" ON customers FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = customers.shop_id AND shops.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "owner_insert_customers" ON customers;
CREATE POLICY "owner_insert_customers" ON customers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = customers.shop_id AND shops.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_update_customers" ON customers;
CREATE POLICY "owner_update_customers" ON customers FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = customers.shop_id AND shops.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM shops WHERE shops.id = customers.shop_id AND shops.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "owner_delete_customers" ON customers;
CREATE POLICY "owner_delete_customers" ON customers FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = customers.shop_id AND shops.owner_user_id = auth.uid()));

-- ============================================================
-- 6. REWRITE STAFF RLS POLICIES (private, owner-only)
-- ============================================================
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_staff" ON staff;
CREATE POLICY "owner_select_staff" ON staff FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = staff.shop_id AND shops.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "owner_insert_staff" ON staff;
CREATE POLICY "owner_insert_staff" ON staff FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = staff.shop_id AND shops.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_update_staff" ON staff;
CREATE POLICY "owner_update_staff" ON staff FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = staff.shop_id AND shops.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM shops WHERE shops.id = staff.shop_id AND shops.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "owner_delete_staff" ON staff;
CREATE POLICY "owner_delete_staff" ON staff FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = staff.shop_id AND shops.owner_user_id = auth.uid()));

-- ============================================================
-- 7. REWRITE NOTIFICATIONS RLS POLICIES (private, owner-only)
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "owner_select_notifications" ON notifications FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = notifications.shop_id AND shops.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "owner_insert_notifications" ON notifications;
CREATE POLICY "owner_insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = notifications.shop_id AND shops.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_update_notifications" ON notifications;
CREATE POLICY "owner_update_notifications" ON notifications FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = notifications.shop_id AND shops.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM shops WHERE shops.id = notifications.shop_id AND shops.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "owner_delete_notifications" ON notifications;
CREATE POLICY "owner_delete_notifications" ON notifications FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = notifications.shop_id AND shops.owner_user_id = auth.uid()));

-- ============================================================
-- 8. REWRITE AUDIT_LOGS RLS POLICIES (private, owner-only)
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
CREATE POLICY "owner_select_audit_logs" ON audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = audit_logs.shop_id AND shops.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "owner_insert_audit_logs" ON audit_logs;
CREATE POLICY "owner_insert_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = audit_logs.shop_id AND shops.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_update_audit_logs" ON audit_logs;
CREATE POLICY "owner_update_audit_logs" ON audit_logs FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = audit_logs.shop_id AND shops.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM shops WHERE shops.id = audit_logs.shop_id AND shops.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "owner_delete_audit_logs" ON audit_logs;
CREATE POLICY "owner_delete_audit_logs" ON audit_logs FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = audit_logs.shop_id AND shops.owner_user_id = auth.uid()));
