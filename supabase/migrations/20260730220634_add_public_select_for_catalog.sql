/*
# Add Public SELECT Policies for Catalog

## Purpose
The previous migration removed ALL anon policies including the public SELECT
on shops and products. The reseller storefront needs to display shops and products
to unauthenticated visitors. This restores ONLY the public read access — writes
remain owner-authenticated-only.

## Changes
- shops: add public SELECT (anon, authenticated)
- products: add public SELECT (anon, authenticated)
- sales, customers, staff, notifications, audit_logs: remain authenticated-only (no change)
*/

DROP POLICY IF EXISTS "public_select_shops" ON shops;
CREATE POLICY "public_select_shops" ON shops FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_products" ON products;
CREATE POLICY "public_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);
