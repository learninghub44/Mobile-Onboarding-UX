-- ============================================================
-- Fix: "Failed to create organization. Please try again."
-- appearing every time, even with valid input.
--
-- Run this once in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<your-project>/sql
--
-- Root cause: the mobile app does
--   .from('organizations').insert({...}).select().single()
-- The INSERT itself succeeds (RLS check `created_by = auth.uid()`
-- passes), but Supabase then reads the new row back to return it
-- to the client. The only SELECT policy at that point was
-- "Org members can view organization", which requires a row in
-- organization_members -- and that row isn't inserted until the
-- *next* line of app code. So the read-back returns 0 rows, and
-- supabase-js's `.single()` throws "JSON object requested, multiple
-- (or no) rows returned" -- which the app then shows as the
-- generic "Failed to create organization" message.
--
-- Fix: let a user also see any organization they created, even
-- before they're a member of it.
--
-- Safe to run multiple times.
-- ============================================================

drop policy if exists "Creator can view organization they created" on public.organizations;
create policy "Creator can view organization they created"
  on public.organizations for select using (
    created_by = auth.uid()
  );
