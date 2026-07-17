-- ============================================================
-- Fix: "Failed to send invitation" + hardcoded contribution goal
--
-- Run this once in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<your-project>/sql
--
-- Part 1 — invites
-- The old inviteMember() called supabase.auth.signUp() from the
-- MOBILE APP for the invited person's email. supabase-js swaps the
-- client's active session to whatever signUp() returns, so sending
-- an invite silently logged the ADMIN out of their own account and
-- logged them in as the brand-new (unconfirmed) invitee -- then the
-- follow-up membership insert ran as the wrong user and typically
-- got rejected by RLS. This adds a proper organization_invites
-- table instead: invites are just recorded, and a new signup with a
-- matching email auto-joins the org (handled in AppContext.register()
-- in code, not here).
--
-- Part 2 — monthly_target
-- The mobile dashboard previously hardcoded a 63% / KES 88,000 /
-- KES 140,000 contribution goal for every organization. This adds a
-- real, optional monthly_target column so each org can set (or not
-- set) its own goal, and the app computes progress from actual
-- transactions.
--
-- Safe to run multiple times.
-- ============================================================

alter table public.organizations add column if not exists monthly_target bigint;

create table if not exists public.organization_invites (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations on delete cascade,
  email      text not null,
  role       text not null default 'member'
               check (role in ('admin', 'treasurer', 'secretary', 'member')),
  invited_by uuid references auth.users,
  status     text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (org_id, email)
);

alter table public.organization_invites enable row level security;

drop policy if exists "Admins and treasurers can view invites for their org" on public.organization_invites;
create policy "Admins and treasurers can view invites for their org"
  on public.organization_invites for select using (
    public.is_org_admin_or_treasurer(org_id)
  );

drop policy if exists "Users can view invites addressed to their email" on public.organization_invites;
create policy "Users can view invites addressed to their email"
  on public.organization_invites for select using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Admins and treasurers can create invites for their org" on public.organization_invites;
create policy "Admins and treasurers can create invites for their org"
  on public.organization_invites for insert with check (
    public.is_org_admin_or_treasurer(org_id)
  );

drop policy if exists "Admins and treasurers can cancel invites" on public.organization_invites;
create policy "Admins and treasurers can cancel invites"
  on public.organization_invites for update using (
    public.is_org_admin_or_treasurer(org_id)
  );

drop policy if exists "Invitee can accept their own invite" on public.organization_invites;
create policy "Invitee can accept their own invite"
  on public.organization_invites for update using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and status = 'accepted'
  );
