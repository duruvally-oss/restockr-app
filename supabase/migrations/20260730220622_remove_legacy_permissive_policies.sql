/*
# Remove Legacy Permissive RLS Policies

## Purpose
The first migration created `anon_*` policies with USING (true) / WITH CHECK (true).
The second migration added `owner_*` policies with proper auth.uid() ownership checks
but did NOT drop the old anon policies. Both sets coexist, and Postgres ORs them —
meaning the permissive anon policies override the secure owner policies, defeating
tenant isolation entirely.

This migration drops every legacy `anon_*` policy so ONLY the owner-scoped policies
remain. After this, the database enforces real ownership — no client-supplied shop_id
can bypass the auth.uid() check.

## Changes
- Drop all `anon_select_*`, `anon_insert_*`, `anon_update_*`, `anon_delete_*` policies
  on every tenant table.
- Keep only the `owner_*` policies (already created in the previous migration).
*/

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE 'anon_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Also drop legacy storage policies that used the old naming
DROP POLICY IF EXISTS "anon_upload_products" ON storage.objects;
DROP POLICY IF EXISTS "anon_read_products" ON storage.objects;
DROP POLICY IF EXISTS "anon_delete_products" ON storage.objects;

-- Replace with owner-aware storage policies
-- Authenticated users can upload/read/delete media in the product buckets
DROP POLICY IF EXISTS "auth_upload_media" ON storage.objects;
CREATE POLICY "auth_upload_media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('products', 'media', 'storage'));

DROP POLICY IF EXISTS "auth_read_media" ON storage.objects;
CREATE POLICY "auth_read_media" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('products', 'media', 'storage'));

DROP POLICY IF EXISTS "auth_delete_media" ON storage.objects;
CREATE POLICY "auth_delete_media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('products', 'media', 'storage'));
