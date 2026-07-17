-- ============================================================
-- Fix: Members list shows "Unknown" for everyone except yourself,
-- and non-admin members only ever see themselves in the roster.
--
-- Run this once in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<your-project>/sql
--
-- Root cause, two layered bugs:
--
-- 1. organization_members had no policy letting a regular member
--    read OTHER members' rows in their own org -- only their own row
--    (`user_id = auth.uid()`), or an admin/treasurer's full-roster
--    view. A plain "member" role querying the Members tab got back
--    a single row: themselves.
--
-- 2. profiles had only one SELECT policy: `auth.uid() = id` -- you
--    can only read your OWN profile. But getOrgMembers() (and the
--    loan cards, invite screens, etc.) all do a join like:
--      organization_members.select('*, profiles:profiles(name, email, phone)')
--    Under that policy, the joined profile comes back null for every
--    member except yourself, and the app falls back to showing
--    "Unknown" / blank email / "??" initials for everyone else.
--    This is why the member cards looked broken regardless of how
--    much visual polish they got -- the underlying data was missing.
--
-- Safe to run multiple times.
-- ============================================================

drop policy if exists "Members can view all memberships in their org" on public.organization_members;
create policy "Members can view all memberships in their org"
  on public.organization_members for select using (
    public.is_org_member(org_id)
  );

drop policy if exists "Org co-members can view each other's profile" on public.profiles;
create policy "Org co-members can view each other's profile"
  on public.profiles for select using (
    exists (
      select 1
      from public.organization_members om1
      join public.organization_members om2 on om1.org_id = om2.org_id
      where om1.user_id = auth.uid() and om2.user_id = profiles.id
    )
  );
